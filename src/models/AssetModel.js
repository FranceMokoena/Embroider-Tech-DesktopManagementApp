export function normalizeAsset(asset) {
  if (!asset) return null;

  return {
    _id: asset._id || asset.id || null,
    assetNumber: asset.assetNumber || null,
    name: asset.name || null,
    epc: asset.epc || null,
    status: asset.status || null,
    verificationStatus: asset.verificationStatus || asset.status || null,
    currentSection: asset.currentSection || null,
    verificationHistory: Array.isArray(asset.verificationHistory) ? asset.verificationHistory : [],
    department: asset.department || null,
    assignedTo: asset.assignedTo || null,
    createdAt: asset.createdAt || null,
    updatedAt: asset.updatedAt || null,
    raw: asset
  };
}

export default { normalizeAsset };
