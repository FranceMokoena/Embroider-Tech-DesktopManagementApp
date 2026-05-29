import { normalizeVerification } from './VerificationModel';

export function normalizeAsset(asset) {
  if (!asset) return null;

  const id = asset._id || asset.id || asset.assetId || null;
  const name = asset.assetName || asset.name || null;
  const currentSection = asset.currentSection || asset.section || asset.location || null;

  return {
    _id: id,
    id,
    assetName: name,
    assetNumber: asset.assetNumber || null,
    serialNumber: asset.serialNumber || null,
    name,
    epc: asset.epc || null,
    assetStatus: asset.assetStatus || asset.conditionStatus || asset.status || null,
    status: asset.assetStatus || asset.conditionStatus || asset.status || null,
    verificationStatus: asset.verificationStatus || null,
    currentSection,
    section: currentSection,
    location: currentSection,
    scanHistory: Array.isArray(asset.scanHistory) ? asset.scanHistory : [],
    transferLogs: Array.isArray(asset.transferLogs) ? asset.transferLogs : [],
    verificationHistory: Array.isArray(asset.verificationHistory)
      ? asset.verificationHistory.map(normalizeVerification).filter(Boolean)
      : [],
    department: asset.department || null,
    assignedTo: asset.assignedTo || null,
    createdAt: asset.createdAt || null,
    updatedAt: asset.updatedAt || null,
    raw: asset
  };
}

export default { normalizeAsset };
