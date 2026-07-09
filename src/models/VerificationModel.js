export function normalizeVerification(v) {
  if (!v) return null;

  return {
    _id: v._id || v.id || null,
    assetId: v.assetId || v.asset || null,
    assetName: v.assetName || v.name || null,
    assetNumber: v.assetNumber || null,
    epc: v.epc || v.tagEpc || v.rfid || null,
    currentSection: v.currentSection || v.section || v.scannedSection || v.location || null,
    expectedSection: v.expectedSection || v.expectedCurrentSection || v.assetSection || v.registeredSection || null,
    status: v.status || v.verificationStatus || null,
    verifiedAt: v.verifiedAt || v.lastVerified || v.createdAt || v.updatedAt || null,
    verifiedBy: v.verifiedBy || null,
    notes: v.notes || null,
    raw: v
  };
}

export default { normalizeVerification };
