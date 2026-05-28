export function normalizeTag(tag) {
  if (!tag) return null;

  return {
    _id: tag._id || tag.id || null,
    epc: tag.epc || null,
    assetId: tag.assetId || null,
    status: tag.status || null,
    currentSection: tag.currentSection || null,
    lastSeen: tag.lastSeen || null,
    createdAt: tag.createdAt || null,
    updatedAt: tag.updatedAt || null,
    raw: tag
  };
}

export default { normalizeTag };
