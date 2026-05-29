export function normalizeSection(section) {
  if (!section) return null;

  if (typeof section === 'string') {
    return {
      _id: section,
      name: section,
      code: section,
      description: null,
      active: true,
      createdAt: null,
      updatedAt: null,
      raw: section
    };
  }

  const name = section.name || section.section || section.code || null;

  return {
    _id: section._id || section.id || null,
    name,
    code: section.code || section.section || name,
    description: section.description || null,
    active: section.active !== false,
    createdAt: section.createdAt || null,
    updatedAt: section.updatedAt || null,
    raw: section
  };
}

export default { normalizeSection };
