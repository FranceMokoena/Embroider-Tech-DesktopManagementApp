import { ObjectId } from 'mongodb';
import databaseService from '../services/databaseService.js';

const toObjectId = id => ObjectId.isValid(id) ? new ObjectId(id) : null;

function normalizeAsset(asset) {
  if (!asset) return null;
  return {
    _id: asset._id?.toString?.() || asset._id || null,
    assetNumber: asset.assetNumber || null,
    name: asset.name || null,
    epc: asset.epc || null,
    status: asset.status || asset.verificationStatus || null,
    verificationStatus: asset.verificationStatus || asset.status || null,
    currentSection: asset.currentSection || null,
    verificationHistory: Array.isArray(asset.verificationHistory) ? asset.verificationHistory : [],
    department: asset.department || null,
    assignedTo: asset.assignedTo || null,
    createdAt: asset.createdAt || null,
    updatedAt: asset.updatedAt || null
  };
}

export async function listAssets(req, res) {
  const collection = await databaseService.getCollection('assets');
  const query = {};

  if (req.query.ids) {
    const ids = String(req.query.ids).split(',').map(toObjectId).filter(Boolean);
    query._id = { $in: ids };
  }

  if (req.query.currentSection) {
    query.currentSection = req.query.currentSection;
  }

  const assets = await collection.find(query).sort({ updatedAt: -1, createdAt: -1 }).toArray();
  res.json({ assets: assets.map(normalizeAsset) });
}

export async function getAsset(req, res) {
  const collection = await databaseService.getCollection('assets');
  const objectId = toObjectId(req.params.id);
  const asset = await collection.findOne(objectId ? { _id: objectId } : { epc: req.params.id });

  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  return res.json({ asset: normalizeAsset(asset) });
}

export async function updateAsset(req, res) {
  const collection = await databaseService.getCollection('assets');
  const objectId = toObjectId(req.params.id);

  if (!objectId) {
    return res.status(400).json({ error: 'Invalid asset id' });
  }

  const allowed = ['assetNumber', 'name', 'epc', 'status', 'verificationStatus', 'currentSection', 'department', 'assignedTo'];
  const update = allowed.reduce((payload, key) => {
    if (req.body[key] !== undefined) payload[key] = req.body[key];
    return payload;
  }, { updatedAt: new Date() });

  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: update },
    { returnDocument: 'after' }
  );

  if (!result.value) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  return res.json({ asset: normalizeAsset(result.value) });
}

export async function archiveAsset(req, res) {
  const collection = await databaseService.getCollection('assets');
  const objectId = toObjectId(req.params.id);

  if (!objectId) {
    return res.status(400).json({ error: 'Invalid asset id' });
  }

  await collection.updateOne(
    { _id: objectId },
    { $set: { status: 'Archived', verificationStatus: 'Archived', updatedAt: new Date() } }
  );

  return res.status(204).send();
}

export async function transferAsset(req, res) {
  const assets = await databaseService.getCollection('assets');
  const transfers = await databaseService.getCollection('assettransfers');
  const objectId = toObjectId(req.params.id);

  if (!objectId) {
    return res.status(400).json({ error: 'Invalid asset id' });
  }

  const asset = await assets.findOne({ _id: objectId });
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  const transfer = {
    assetId: objectId,
    epc: asset.epc,
    fromSection: asset.currentSection || null,
    toSection: req.body.toSection || req.body.currentSection || null,
    status: 'Recorded',
    transferredAt: new Date(),
    transferredBy: req.body.transferredBy || null
  };

  await transfers.insertOne(transfer);
  await assets.updateOne(
    { _id: objectId },
    { $set: { currentSection: transfer.toSection, updatedAt: new Date() } }
  );

  return res.json({ transfer });
}

export async function listSections(req, res) {
  const collection = await databaseService.getCollection('sections');
  const sections = await collection.find({}).sort({ name: 1 }).toArray();
  res.json({ sections });
}

export async function listTransfers(req, res) {
  const collection = await databaseService.getCollection('assettransfers');
  const transfers = await collection.find({}).sort({ transferredAt: -1 }).limit(500).toArray();
  res.json({ transfers });
}

export async function listVerificationHistory(req, res) {
  const collection = await databaseService.getCollection('tagscanlogs');
  const history = await collection.find({}).sort({ verifiedAt: -1 }).limit(500).toArray();
  res.json({ verificationHistory: history });
}

export async function assetMetrics(req, res) {
  const collection = await databaseService.getCollection('assets');
  const assets = await collection.find({}).toArray();
  const counts = assets.reduce((acc, asset) => {
    const status = asset.verificationStatus || asset.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalAssets: assets.length,
    verified: counts.Verified || 0,
    missing: counts.Missing || 0,
    sectionMismatch: counts['Section Mismatch'] || 0
  });
}
