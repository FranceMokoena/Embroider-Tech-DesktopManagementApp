import { normalizeVerification } from './VerificationModel';

export function normalizeAsset(asset) {
  if (!asset) return null;

  const id = asset._id || asset.id || asset.assetId || null;
  const name = asset.assetName || asset.name || null;
  const currentSection = asset.currentSection || asset.section || asset.location || null;
  const status = asset.assetStatus || asset.conditionStatus || asset.status || null;

  return {
    _id: id,
    id,
    assetName: name,
    assetNumber: asset.assetNumber || null,
    serialNumber: asset.serialNumber || null,
    name,
    epc: asset.epc || null,
    assetStatus: status,
    status,
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
    assignedTechnician: asset.assignedTechnician || asset.technician || null,
    createdAt: asset.createdAt || null,
    updatedAt: asset.updatedAt || null,
    raw: asset
  };
}

export default { normalizeAsset };
