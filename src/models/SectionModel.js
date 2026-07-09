export function normalizeSection(section) {
  if (!section) return null;

  if (typeof section === 'string') {
    return {
      _id: section,
      section,
      name: section,
      code: section,
      description: null,
      active: true,
      createdAt: null,
      updatedAt: null,
      raw: section
    };
  }

  const name = section.name || section.section || section.code || section.department || null;

  return {
    _id: section._id || section.id || null,
    section: section.section || name,
    name,
    code: section.code || section.section || name,
    manager: section.manager || null,
    description: section.description || null,
    totalAssets: section.totalAssets || section.assetCount || section.total || 0,
    healthy: section.healthy || section.healthyAssets || 0,
    repairable: section.repairable || section.repairableAssets || 0,
    beyondRepair: section.beyondRepair || section.beyond_repair || section.beyondRepairAssets || 0,
    active: section.active !== false,
    createdAt: section.createdAt || null,
    updatedAt: section.updatedAt || null,
    raw: section
  };
}

export default { normalizeSection };
