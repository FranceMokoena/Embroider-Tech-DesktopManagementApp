import { ObjectId } from 'mongodb';
import databaseService from '../services/databaseService.js';

const toObjectId = id => ObjectId.isValid(id) ? new ObjectId(id) : null;

function normalizeAsset(asset) {
  if (!asset) return null;
  const id = asset._id?.toString?.() || asset._id || asset.id || null;
  const assetName = asset.assetName || asset.name || null;
  const currentSection = asset.currentSection || asset.section || asset.location || null;

  return {
    _id: id,
    id,
    assetName,
    assetNumber: asset.assetNumber || null,
    name: assetName,
    serialNumber: asset.serialNumber || null,
    epc: asset.epc || null,
    assetStatus: asset.assetStatus || asset.conditionStatus || asset.status || null,
    status: asset.assetStatus || asset.conditionStatus || asset.status || null,
    verificationStatus: asset.verificationStatus || null,
    currentSection,
    section: currentSection,
    location: currentSection,
    scanHistory: Array.isArray(asset.scanHistory) ? asset.scanHistory : [],
    transferLogs: Array.isArray(asset.transferLogs) ? asset.transferLogs : [],
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
    query.$or = [
      { currentSection: req.query.currentSection },
      { section: req.query.currentSection },
      { location: req.query.currentSection }
    ];
  }

  if (req.query.q) {
    const pattern = new RegExp(String(req.query.q).trim(), 'i');
    query.$or = [
      ...(query.$or || []),
      { assetName: pattern },
      { name: pattern },
      { assetNumber: pattern },
      { serialNumber: pattern },
      { epc: pattern },
      { currentSection: pattern },
      { section: pattern }
    ];
  }

  const assets = await collection.find(query).sort({ updatedAt: -1, createdAt: -1 }).toArray();
  res.json({ assets: assets.map(normalizeAsset) });
}

export async function createAsset(req, res) {
  const collection = await databaseService.getCollection('assets');
  const assetName = req.body.assetName || req.body.name;

  if (!assetName || !req.body.assetNumber || !req.body.epc) {
    return res.status(400).json({ error: 'assetName, assetNumber, and epc are required' });
  }

  const now = new Date();
  const section = req.body.section || req.body.currentSection || null;
  const asset = {
    assetName,
    name: assetName,
    assetNumber: req.body.assetNumber,
    serialNumber: req.body.serialNumber || null,
    epc: req.body.epc,
    currentSection: section,
    section,
    status: req.body.status || 'Healthy',
    verificationStatus: req.body.verificationStatus || 'Unknown',
    assignmentInformation: req.body.assignmentInformation || null,
    statusHistory: [],
    assignmentLifecycleHistory: [],
    verificationHistory: [],
    createdAt: now,
    updatedAt: now
  };

  const result = await collection.insertOne(asset);
  return res.status(201).json({
    success: true,
    message: 'Asset created successfully',
    data: normalizeAsset({ ...asset, _id: result.insertedId })
  });
}

export async function bulkCreateAssets(req, res) {
  const collection = await databaseService.getCollection('assets');
  const epcs = Array.isArray(req.body.epcs) ? req.body.epcs.map(value => String(value).trim()).filter(Boolean) : [];
  const assetName = req.body.assetName || req.body.name;

  if (!assetName || !req.body.assetNumber || !req.body.section || !epcs.length) {
    return res.status(400).json({ error: 'assetName, assetNumber, section, and epcs are required' });
  }

  const existing = await collection.find({ epc: { $in: epcs } }).project({ epc: 1 }).toArray();
  const existingEpcs = new Set(existing.map(asset => asset.epc));
  const now = new Date();
  const created = [];
  const skipped = [];

  epcs.forEach((epc, index) => {
    if (existingEpcs.has(epc)) {
      skipped.push({ epc, reason: 'EPC already exists' });
      return;
    }

    const suffix = epcs.length > 1 ? String(index + 1).padStart(3, '0') : '';
    created.push({
      assetName: suffix ? `${assetName} ${suffix}` : assetName,
      name: suffix ? `${assetName} ${suffix}` : assetName,
      assetNumber: suffix ? `${req.body.assetNumber}-${suffix}` : req.body.assetNumber,
      serialNumber: req.body.serialNumber || null,
      epc,
      currentSection: req.body.section,
      section: req.body.section,
      status: req.body.status || 'Healthy',
      verificationStatus: 'Unknown',
      statusHistory: [],
      assignmentLifecycleHistory: [],
      verificationHistory: [],
      createdAt: now,
      updatedAt: now
    });
  });

  if (created.length) {
    await collection.insertMany(created);
  }

  return res.status(201).json({
    success: true,
    created: created.map(normalizeAsset),
    skipped,
    requestedCount: epcs.length,
    createdCount: created.length,
    skippedCount: skipped.length
  });
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

  const allowed = ['assetName', 'assetNumber', 'name', 'serialNumber', 'epc', 'assetStatus', 'status', 'verificationStatus', 'currentSection', 'section', 'location', 'department', 'assignedTo'];
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

export async function transferAssets(req, res) {
  const assets = await databaseService.getCollection('assets');
  const transfers = await databaseService.getCollection('assettransfers');
  const assetIds = Array.isArray(req.body.assetIds) ? req.body.assetIds : [req.body.assetId].filter(Boolean);
  const toSection = req.body.toSection || req.body.currentSection || req.body.section || null;

  if (!assetIds.length || !toSection) {
    return res.status(400).json({ error: 'assetIds and toSection are required' });
  }

  const objectIds = assetIds.map(toObjectId).filter(Boolean);
  const records = await assets.find({ _id: { $in: objectIds } }).toArray();
  const transferredAt = new Date();
  const transferRecords = records.map(asset => ({
    assetId: asset._id,
    epc: asset.epc,
    fromSection: asset.currentSection || asset.section || null,
    toSection,
    status: 'Recorded',
    reason: req.body.reason || null,
    transferType: req.body.transferType || 'rotation',
    batchId: req.body.batchId || null,
    transferredAt,
    transferredBy: req.body.transferredBy || null
  }));

  if (transferRecords.length) {
    await transfers.insertMany(transferRecords);
    await assets.updateMany(
      { _id: { $in: transferRecords.map(record => record.assetId) } },
      { $set: { currentSection: toSection, section: toSection, updatedAt: transferredAt } }
    );
  }

  return res.json({
    success: true,
    batchId: req.body.batchId || null,
    toSection,
    transferType: req.body.transferType || 'rotation',
    transferred: transferRecords,
    skipped: assetIds.filter(id => !records.some(asset => String(asset._id) === String(id))).map(id => ({ assetId: id, reason: 'Asset not found' })),
    errors: [],
    summary: {
      requested: assetIds.length,
      transferred: transferRecords.length,
      skipped: assetIds.length - transferRecords.length,
      failed: 0
    }
  });
}

export async function listSections(req, res) {
  const collection = await databaseService.getCollection('sections');
  const sections = await collection.find({}).sort({ name: 1 }).toArray();
  res.json({ sections });
}

export async function getSection(req, res) {
  const collection = await databaseService.getCollection('sections');
  const objectId = toObjectId(req.params.id);
  const section = await collection.findOne(objectId
    ? { _id: objectId }
    : { $or: [{ section: req.params.id }, { name: req.params.id }, { code: req.params.id }] }
  );

  if (!section) {
    return res.status(404).json({ error: 'Section not found' });
  }

  return res.json({ section });
}

export async function createSection(req, res) {
  const collection = await databaseService.getCollection('sections');
  const sectionName = req.body.section || req.body.name;

  if (!sectionName) {
    return res.status(400).json({ error: 'Section name is required' });
  }

  const section = {
    section: sectionName,
    name: sectionName,
    code: req.body.code || sectionName,
    manager: req.body.manager || req.body.createdBy || 'Unassigned',
    description: req.body.description || '',
    active: req.body.active !== false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await collection.insertOne(section);
  res.status(201).json({ success: true, message: 'Section created successfully', data: { ...section, _id: result.insertedId } });
}

export async function updateSection(req, res) {
  const collection = await databaseService.getCollection('sections');
  const objectId = toObjectId(req.params.id);
  if (!objectId) return res.status(400).json({ error: 'Invalid section id' });

  const sectionName = req.body.section || req.body.name;
  const update = {
    ...(sectionName ? { section: sectionName, name: sectionName } : {}),
    ...(req.body.code !== undefined ? { code: req.body.code } : {}),
    ...(req.body.manager !== undefined ? { manager: req.body.manager } : {}),
    ...(req.body.description !== undefined ? { description: req.body.description } : {}),
    ...(req.body.active !== undefined ? { active: req.body.active } : {}),
    updatedAt: new Date()
  };

  const result = await collection.findOneAndUpdate({ _id: objectId }, { $set: update }, { returnDocument: 'after' });
  if (!result.value) return res.status(404).json({ error: 'Section not found' });
  res.json({ success: true, data: result.value });
}

export async function deleteSection(req, res) {
  const collection = await databaseService.getCollection('sections');
  const objectId = toObjectId(req.params.id);
  if (!objectId) return res.status(400).json({ error: 'Invalid section id' });
  await collection.deleteOne({ _id: objectId });
  res.status(204).send();
}

export async function listSectionOptions(req, res) {
  const sections = await databaseService.getCollection('sections');
  const assets = await databaseService.getCollection('assets');
  const [registeredSections, currentSections, legacySections] = await Promise.all([
    sections.find({}).sort({ name: 1 }).toArray(),
    assets.distinct('currentSection'),
    assets.distinct('section')
  ]);

  const options = Array.from(new Set([
    ...registeredSections.map(section => section.name || section.section || section.code).filter(Boolean),
    ...currentSections.filter(Boolean),
    ...legacySections.filter(Boolean)
  ])).sort((a, b) => String(a).localeCompare(String(b)));

  res.json({ sections: options, options });
}

export async function listSectionSummary(req, res) {
  const assets = await databaseService.getCollection('assets');
  const sections = await databaseService.getCollection('sections');
  const [assetRecords, sectionRecords] = await Promise.all([
    assets.find({}).toArray(),
    sections.find({}).sort({ name: 1 }).toArray()
  ]);

  const names = Array.from(new Set([
    ...sectionRecords.map(section => section.name || section.section || section.code).filter(Boolean),
    ...assetRecords.map(asset => asset.currentSection || asset.section).filter(Boolean)
  ])).sort((a, b) => String(a).localeCompare(String(b)));

  const summary = names.map(name => {
    const section = sectionRecords.find(item => [item.name, item.section, item.code].includes(name)) || {};
    const sectionAssets = assetRecords.filter(asset => (asset.currentSection || asset.section) === name);
    const countStatus = status => sectionAssets.filter(asset => String(asset.status || asset.assetStatus || '').toLowerCase() === status).length;

    return {
      section: name,
      name,
      manager: section.manager || 'Unassigned',
      createdAt: section.createdAt || null,
      totalAssets: sectionAssets.length,
      healthy: countStatus('healthy'),
      repairable: countStatus('repairable'),
      beyondRepair: sectionAssets.filter(asset => String(asset.status || asset.assetStatus || '').toLowerCase() === 'beyond repair').length
    };
  });

  res.json({ sections: summary, summary });
}

export async function listTransfers(req, res) {
  const collection = await databaseService.getCollection('assettransfers');
  const transfers = await collection.find({}).sort({ transferredAt: -1 }).limit(500).toArray();
  res.json({ transfers });
}

export async function getTransfer(req, res) {
  const collection = await databaseService.getCollection('assettransfers');
  const objectId = toObjectId(req.params.id);
  if (!objectId) return res.status(400).json({ error: 'Invalid transfer id' });

  const transfer = await collection.findOne({ _id: objectId });
  if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

  return res.json({ transfer });
}

export async function listLifecycleHistory(req, res) {
  const [assets, transfers] = await Promise.all([
    databaseService.getCollection('assets'),
    databaseService.getCollection('assettransfers')
  ]);

  const [assetRecords, transferRecords] = await Promise.all([
    assets.find({}).project({ assetName: 1, name: 1, assetNumber: 1, assignmentLifecycleHistory: 1 }).toArray(),
    transfers.find({}).sort({ transferredAt: -1 }).limit(500).toArray()
  ]);
  const assetById = new Map(assetRecords.map(asset => [String(asset._id), asset]));

  const transferRows = transferRecords.map(transfer => {
    const asset = assetById.get(String(transfer.assetId)) || {};
    return {
      ...transfer,
      assetName: asset.assetName || asset.name || transfer.assetName || null,
      assetNumber: asset.assetNumber || transfer.assetNumber || null,
      fromSection: transfer.fromSection || transfer.initialSection || null,
      toSection: transfer.toSection || transfer.currentSection || null,
      transferredAt: transfer.transferredAt || transfer.assignmentDate || transfer.updatedAt || null,
      reason: transfer.reason || transfer.transferType || null
    };
  });

  const embeddedRows = assetRecords.flatMap(asset =>
    (asset.assignmentLifecycleHistory || []).map(item => ({
      ...item,
      assetId: asset._id,
      assetName: asset.assetName || asset.name || null,
      assetNumber: asset.assetNumber || null,
      fromSection: item.fromSection || item.initialSection || null,
      toSection: item.toSection || item.currentSection || null,
      transferredAt: item.assignmentDate || item.updatedAt || item.createdAt || null,
      reason: item.reason || item.transferType || null
    }))
  );

  const lifecycleHistory = [...transferRows, ...embeddedRows]
    .sort((a, b) => new Date(b.transferredAt || 0) - new Date(a.transferredAt || 0));

  res.json({ lifecycleHistory, transfers: lifecycleHistory });
}

export async function listVerificationHistory(req, res) {
  const [logs, assets] = await Promise.all([
    databaseService.getCollection('tagscanlogs'),
    databaseService.getCollection('assets')
  ]);
  const history = await logs.find({}).sort({ verifiedAt: -1 }).limit(500).toArray();
  const assetIds = history.map(item => toObjectId(String(item.assetId || ''))).filter(Boolean);
  const epcs = history.map(item => item.epc).filter(Boolean);
  const assetQuery = [
    ...(assetIds.length ? [{ _id: { $in: assetIds } }] : []),
    ...(epcs.length ? [{ epc: { $in: epcs } }] : [])
  ];
  const assetRecords = assetQuery.length ? await assets.find({ $or: assetQuery }).toArray() : [];
  const byId = new Map(assetRecords.map(asset => [String(asset._id), asset]));
  const byEpc = new Map(assetRecords.map(asset => [asset.epc, asset]));

  const enriched = history.map(item => {
    const asset = byId.get(String(item.assetId || '')) || byEpc.get(item.epc) || {};
    return {
      ...item,
      assetName: asset.assetName || asset.name || null,
      assetNumber: asset.assetNumber || null,
      currentSection: item.currentSection || item.section || null,
      expectedSection: item.expectedSection || asset.currentSection || asset.section || null
    };
  });

  res.json({ verificationHistory: enriched, verifications: enriched });
}

export async function listTechnicians(req, res) {
  const collection = await databaseService.getCollection('technicians');
  const technicians = await collection.find({}).sort({ name: 1, email: 1 }).toArray();
  res.json({ technicians });
}

export async function getTechnician(req, res) {
  const collection = await databaseService.getCollection('technicians');
  const objectId = toObjectId(req.params.id);
  const technician = await collection.findOne(objectId
    ? { _id: objectId }
    : { $or: [{ username: req.params.id }, { email: req.params.id }] }
  );

  if (!technician) {
    return res.status(404).json({ error: 'Technician not found' });
  }

  return res.json({ technician });
}

export async function createTechnician(req, res) {
  const collection = await databaseService.getCollection('technicians');
  if (!req.body.email && !req.body.username) {
    return res.status(400).json({ error: 'Email or username is required' });
  }

  const technician = {
    name: req.body.name || '',
    surname: req.body.surname || '',
    username: req.body.username || req.body.email || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    role: req.body.role || 'technician',
    active: req.body.active !== false,
    assignedSections: Array.isArray(req.body.assignedSections) ? req.body.assignedSections : [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const result = await collection.insertOne(technician);
  res.status(201).json({ technician: { ...technician, _id: result.insertedId } });
}

export async function updateTechnician(req, res) {
  const collection = await databaseService.getCollection('technicians');
  const objectId = toObjectId(req.params.id);
  if (!objectId) return res.status(400).json({ error: 'Invalid technician id' });

  const allowed = ['name', 'surname', 'username', 'email', 'phone', 'role', 'active', 'assignedSections'];
  const update = allowed.reduce((payload, key) => {
    if (req.body[key] !== undefined) payload[key] = req.body[key];
    return payload;
  }, { updatedAt: new Date() });

  const result = await collection.findOneAndUpdate({ _id: objectId }, { $set: update }, { returnDocument: 'after' });
  if (!result.value) return res.status(404).json({ error: 'Technician not found' });
  res.json({ technician: result.value });
}

export async function deleteTechnician(req, res) {
  const collection = await databaseService.getCollection('technicians');
  const objectId = toObjectId(req.params.id);
  if (!objectId) return res.status(400).json({ error: 'Invalid technician id' });
  await collection.deleteOne({ _id: objectId });
  res.status(204).send();
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
    sectionMismatch: counts['Section Mismatch'] || 0,
    healthy: counts.Healthy || counts.healthy || 0,
    repairable: counts.Repairable || counts.repairable || 0,
    beyondRepair: counts['Beyond Repair'] || counts.beyondRepair || 0
  });
}
