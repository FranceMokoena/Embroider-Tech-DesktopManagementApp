import { ObjectId } from 'mongodb';
import databaseService from '../services/databaseService.js';

const toObjectId = id => ObjectId.isValid(id) ? new ObjectId(id) : null;

function normalizeResult(input) {
  return {
    _id: input._id?.toString?.() || input._id || null,
    assetId: input.assetId?.toString?.() || input.assetId || null,
    epc: input.epc || null,
    currentSection: input.currentSection || null,
    expectedSection: input.expectedSection || null,
    status: input.status || null,
    verifiedAt: input.verifiedAt || null,
    verifiedBy: input.verifiedBy || null,
    notes: input.notes || null
  };
}

export async function verifyRoom(req, res) {
  const epcs = Array.from(new Set((req.body.epcs || []).map(value => String(value).trim()).filter(Boolean)));
  const currentSection = req.body.currentSection || req.body.section || req.body.sectionId || null;
  const verifiedBy = req.body.verifiedBy || null;
  const verifiedAt = new Date();

  if (!epcs.length) {
    return res.status(400).json({ error: 'At least one EPC is required' });
  }

  const assets = await databaseService.getCollection('assets');
  const logs = await databaseService.getCollection('tagscanlogs');
  const records = await assets.find({ epc: { $in: epcs } }).toArray();
  const byEpc = new Map(records.map(asset => [asset.epc, asset]));

  const results = epcs.map(epc => {
    const asset = byEpc.get(epc);
    if (!asset) {
      return {
        epc,
        currentSection,
        expectedSection: null,
        status: 'Missing',
        verifiedAt,
        verifiedBy,
        notes: 'EPC is not linked to a registered asset'
      };
    }

    const expectedSection = asset.currentSection || null;
    const status = currentSection && expectedSection && currentSection !== expectedSection
      ? 'Section Mismatch'
      : 'Verified';

    return {
      assetId: asset._id,
      epc,
      currentSection,
      expectedSection,
      status,
      verifiedAt,
      verifiedBy
    };
  });

  const sectionAssets = currentSection
    ? await assets.find({ currentSection }).toArray()
    : [];
  const observed = new Set(epcs);
  const missingFromSection = sectionAssets
    .filter(asset => asset.epc && !observed.has(asset.epc))
    .map(asset => ({
      assetId: asset._id,
      epc: asset.epc,
      currentSection,
      expectedSection: asset.currentSection,
      status: 'Missing',
      verifiedAt,
      verifiedBy,
      notes: 'Expected asset was not observed in this verification'
    }));

  const completeResults = [...results, ...missingFromSection];
  if (completeResults.length) {
    await logs.insertMany(completeResults);
  }

  const updatedAssetIds = completeResults.filter(result => result.assetId).map(result => result.assetId);
  await Promise.all(completeResults.filter(result => result.assetId).map(result =>
    assets.updateOne(
      { _id: result.assetId },
      {
        $set: {
          verificationStatus: result.status,
          updatedAt: verifiedAt
        },
        $push: {
          verificationHistory: normalizeResult(result)
        }
      }
    )
  ));

  return res.json({
    updatedAssetIds: updatedAssetIds.map(id => id.toString()),
    results: completeResults.map(normalizeResult)
  });
}

export async function lookupTag(req, res) {
  const epc = req.params.epc || req.query.epc;
  if (!epc) {
    return res.status(400).json({ error: 'EPC is required' });
  }

  const assets = await databaseService.getCollection('assets');
  const tags = await databaseService.getCollection('rfidtags');
  const mappings = await databaseService.getCollection('assettagmappings');

  const [asset, tag, mapping] = await Promise.all([
    assets.findOne({ epc }),
    tags.findOne({ epc }),
    mappings.findOne({ epc })
  ]);

  return res.json({
    tag: {
      ...(tag || {}),
      epc,
      assetId: asset?._id || mapping?.assetId || null,
      currentSection: asset?.currentSection || null,
      status: asset?.verificationStatus || asset?.status || tag?.status || null
    }
  });
}

export async function updateAssetStatus(req, res) {
  const assetId = req.body.assetId || req.body.id || null;
  const epc = req.body.epc || null;
  const status = req.body.verificationStatus || req.body.status || null;

  if ((!assetId && !epc) || !status) {
    return res.status(400).json({ error: 'assetId or epc and status are required' });
  }

  const objectId = assetId ? toObjectId(String(assetId)) : null;
  const query = objectId ? { _id: objectId } : { epc };
  const now = new Date();
  const assets = await databaseService.getCollection('assets');
  const logs = await databaseService.getCollection('tagscanlogs');

  const update = {
    verificationStatus: status,
    updatedAt: now,
    ...(req.body.currentSection || req.body.section ? {
      currentSection: req.body.currentSection || req.body.section,
      section: req.body.currentSection || req.body.section
    } : {})
  };

  const result = await assets.findOneAndUpdate(
    query,
    { $set: update },
    { returnDocument: 'after' }
  );

  if (!result.value) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  const history = normalizeResult({
    assetId: result.value._id,
    epc: result.value.epc,
    currentSection: req.body.currentSection || req.body.section || result.value.currentSection || null,
    expectedSection: result.value.section || null,
    status,
    verifiedAt: now,
    verifiedBy: req.body.verifiedBy || null,
    notes: req.body.notes || null
  });

  await logs.insertOne(history);
  await assets.updateOne(
    { _id: result.value._id },
    { $push: { verificationHistory: history } }
  );

  return res.json({
    success: true,
    asset: result.value,
    verification: history
  });
}
