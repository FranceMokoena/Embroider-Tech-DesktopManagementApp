export function normalizeTechnician(technician) {
  if (!technician) return null;

  return {
    _id: technician._id || technician.id || technician.userId || null,
    name: technician.name || '',
    surname: technician.surname || '',
    username: technician.username || '',
    email: technician.email || '',
    department: technician.department || '',
    phone: technician.phone || '',
    role: technician.role || 'technician',
    assignedSections: Array.isArray(technician.assignedSections) ? technician.assignedSections : [],
    active: technician.active !== false,
    createdAt: technician.createdAt || null,
    updatedAt: technician.updatedAt || null,
    raw: technician
  };
}

export default { normalizeTechnician };
