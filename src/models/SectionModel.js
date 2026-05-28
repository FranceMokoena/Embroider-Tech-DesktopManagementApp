export function normalizeSection(section) {
  if (!section) return null;

  return {
    _id: section._id || section.id || null,
    name: section.name || null,
    code: section.code || null,
    description: section.description || null,
    createdAt: section.createdAt || null,
    updatedAt: section.updatedAt || null,
    raw: section
  };
}

export default { normalizeSection };
