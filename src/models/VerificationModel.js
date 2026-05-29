export function normalizeVerification(v) {
  if (!v) return null;

  return {
    _id: v._id || v.id || null,
    assetId: v.assetId || null,
    epc: v.epc || null,
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
