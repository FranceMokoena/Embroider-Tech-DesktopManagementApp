export function normalizeAsset(asset) {
  if (!asset) return null;

  return {
    _id: asset._id || asset.id || asset.assetId || null,
    assetNumber: asset.assetNumber || null,
    name: asset.name || asset.assetName || null,
    epc: asset.epc || null,
    assetStatus: asset.assetStatus || asset.conditionStatus || asset.status || null,
    status: asset.assetStatus || asset.conditionStatus || asset.status || null,
    verificationStatus: asset.verificationStatus || null,
    currentSection: asset.currentSection || asset.section || null,
    location: asset.location || asset.currentSection || asset.section || null,
    scanHistory: Array.isArray(asset.scanHistory) ? asset.scanHistory : [],
    transferLogs: Array.isArray(asset.transferLogs) ? asset.transferLogs : [],
    verificationHistory: Array.isArray(asset.verificationHistory) ? asset.verificationHistory : [],
    department: asset.department || null,
    assignedTo: asset.assignedTo || null,
    createdAt: asset.createdAt || null,
    updatedAt: asset.updatedAt || null,
    raw: asset
  };
}

export default { normalizeAsset };
