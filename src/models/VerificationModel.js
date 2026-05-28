export function normalizeVerification(v) {
  if (!v) return null;

  return {
    _id: v._id || v.id || null,
    assetId: v.assetId || null,
    epc: v.epc || null,
    currentSection: v.currentSection || null,
    expectedSection: v.expectedSection || null,
    status: v.status || null,
    verifiedAt: v.verifiedAt || null,
    verifiedBy: v.verifiedBy || null,
    notes: v.notes || null,
    raw: v
  };
}

export default { normalizeVerification };
