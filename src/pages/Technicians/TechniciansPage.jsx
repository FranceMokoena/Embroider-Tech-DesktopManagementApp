import React, { useEffect, useMemo, useState } from 'react';
import './TechniciansPage.css';
import { createUser, deleteUser, getDepartments, getSessions, getUsers, updateUser } from '../../services/apiClient';

const sortOptions = [
  { key: 'name', label: 'Name' },
  { key: 'department', label: 'Department' },
  { key: 'joined', label: 'Date Joined' }
];

const INITIAL_FORM = {
  username: '',
  email: '',
  department: '',
  password: '',
  confirmPassword: ''
};

const buildDepartmentLookup = (departments = []) => {
  const lookup = {};
  departments.forEach((department) => {
    if (!department) return;
    const display =
      department.name ||
      department.department ||
      department.label ||
      department.code ||
      'Unknown Department';
    const identifiers = [
      department._id,
      department.id,
      department.code,
      department.name,
      department.department,
      department.label
    ];
    identifiers.forEach((identifier) => {
      if (!identifier) return;
      const key = identifier.toString().toLowerCase();
      lookup[key] = display;
    });
  });
  return lookup;
};

const resolveDepartmentDisplay = (departmentValue, lookup = {}) => {
  if (!departmentValue) return 'N/A';
  const key = departmentValue.toString();
  const lower = key.toLowerCase();
  if (lookup[key]) return lookup[key];
  if (lookup[lower]) return lookup[lower];
  return departmentValue;
};

const normalizeSessionScanCount = (session = {}) => {
  if (typeof session.totalScans === 'number') return session.totalScans;
  if (typeof session.scanCount === 'number') return session.scanCount;
  if (Array.isArray(session.scans)) return session.scans.length;
  if (typeof session.scans === 'number') return session.scans;
  if (typeof session.screenCount === 'number') return session.screenCount;
  return 0;
};

const buildScanTotals = (sessions = []) => {
  const totals = {};
  sessions.forEach((session) => {
    const key =
      session.technician ||
      session.technicianName ||
      session.technicianUsername ||
      session.username ||
      session.techName;
    if (!key) return;
    const normalizedKey = key.toString().trim().toLowerCase();
    if (!normalizedKey) return;
    const count = normalizeSessionScanCount(session);
    totals[normalizedKey] = (totals[normalizedKey] ?? 0) + count;
  });
  return totals;
};

const mapTechnician = (raw, departmentLookup = {}, scanTotals = {}) => {
  const name = raw.username ?? raw.name ?? raw.displayName ?? 'Unknown Technician';
  const id = raw._id ?? raw.id ?? name;
  const department = resolveDepartmentDisplay(
    raw.department ?? raw.departmentName ?? raw.division ?? raw.team,
    departmentLookup
  );
  const identifierKeys = [
    raw.username,
    raw.name,
    raw.email,
    raw._id,
    raw.id
  ]
    .filter(Boolean)
    .map((value) => value.toString().trim().toLowerCase())
    .filter(Boolean);
  const aggregatedScans = identifierKeys.reduce((acc, key) => {
    const candidate = scanTotals[key] ?? 0;
    return Math.max(acc, candidate);
  }, 0);
  const scans =
    raw.scanCount ??
    raw.scans ??
    raw.screenCount ??
    aggregatedScans ??
    0;
  const joined = raw.createdAt ?? raw.joined ?? raw.dateJoined ?? new Date().toISOString();
  const last = raw.lastActive ?? raw.lastLogin ?? 'Unknown';
  return {
    id,
    name,
    email: raw.email ?? raw.username ?? '',
    department,
    status: raw.status ?? 'Active',
    scans,
    joined,
    last
  };
};

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [technicianForm, setTechnicianForm] = useState(INITIAL_FORM);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    department: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [departments, setDepartments] = useState([]);
  const [departmentLookup, setDepartmentLookup] = useState({});

  const fetchTechnicians = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersResponse, departmentsResponse, sessionsResponse] = await Promise.all([
        getUsers(),
        getDepartments(),
        getSessions()
      ]);

      const depts = departmentsResponse?.departments ?? departmentsResponse ?? [];
      setDepartments(Array.isArray(depts) ? depts : []);
      const lookup = buildDepartmentLookup(Array.isArray(depts) ? depts : []);
      setDepartmentLookup(lookup);

      const sessionCandidates = [
        sessionsResponse?.data?.sessions,
        sessionsResponse?.sessions,
        sessionsResponse?.data,
        sessionsResponse
      ];
      const sessionItems = sessionCandidates.find((candidate) => Array.isArray(candidate)) ?? [];
      const scanTotals = buildScanTotals(sessionItems);

      const users = usersResponse?.data ?? [];
      setTechnicians(users.map((tech) => mapTechnician(tech, lookup, scanTotals)));
    } catch (err) {
      setError(err.message || 'Failed to load technicians');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setTechnicianForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        username: technicianForm.username.trim(),
        email: technicianForm.email.trim(),
        department: technicianForm.department.trim(),
        password: technicianForm.password
      };
      const response = await createUser(payload);
      setTechnicians((prev) => [
        ...prev,
        mapTechnician(response?.data ?? payload, departmentLookup)
      ]);
      setTechnicianForm(INITIAL_FORM);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingTechnician) return;
    try {
      const payload = {
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        department: editForm.department.trim(),
        password: editForm.newPassword || undefined
      };
      const response = await updateUser(editingTechnician.id, payload);
      setTechnicians((prev) =>
        prev.map((tech) =>
          tech.id === editingTechnician.id
            ? mapTechnician(response?.data ?? payload, departmentLookup)
            : tech
        )
      );
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (tech) => {
    if (!window.confirm('Remove this technician?')) return;
    try {
      await deleteUser(tech.id);
      setTechnicians((prev) => prev.filter((item) => item.id !== tech.id));
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (tech) => {
    setEditingTechnician(tech);
    setEditForm({
      username: tech.name,
      email: tech.email,
      department: tech.department,
      newPassword: '',
      confirmPassword: ''
    });
    setIsEditModalOpen(true);
  };

  const sortedTechnicians = useMemo(() => {
    const list = [...technicians];
    if (sortKey === 'joined') {
      return list.sort((a, b) => new Date(b.joined) - new Date(a.joined));
    }
    return list.sort((a, b) => a[sortKey]?.toString().localeCompare(b[sortKey]?.toString() ?? ''));
  }, [technicians, sortKey]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const closeEditModal = () => setIsEditModalOpen(false);

  const handleExport = () => {
    const headers = ['Username', 'Email', 'Department', 'Status', 'Scans', 'Joined'];
    const rows = technicians.map((tech) => [
      tech.name,
      tech.email,
      tech.department,
      tech.status,
      tech.scans,
      new Date(tech.joined).toLocaleDateString()
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'technicians.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="page-view">
        <p className="dashboard-page__status">Loading technicians…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-view">
        <p className="dashboard-page__status dashboard-page__status--error">{error}</p>
      </div>
    );
  }

  return (
    <div className="page-view">
      <header className="page-view__header technician-header">
        <div>
          <h2>Technicians</h2>
          <p>Monitor operators, their departments, and scanning output.</p>
        </div>
        <div className="technician-toolbar__actions">
          <button type="button" className="technician-toolbar__button" onClick={() => fetchTechnicians()}>
            🔄
          </button>
          <button type="button" className="technician-toolbar__button" onClick={handleExport}>
            📤
          </button>
          <button type="button" className="technician-toolbar__button technician-toolbar__button--add" onClick={openModal}>
            + Add Technician
          </button>
        </div>
      </header>

      <div className="technician-toolbar">
        <div className="technician-sort">
          <span>Sort by</span>
          {sortOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`technician-sort__button ${sortKey === option.key ? 'is-active' : ''}`}
              onClick={() => setSortKey(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>


      <div className="technicians-table-wrapper">
        <table className="technicians-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Email</th>
              <th>Department</th>
              <th>No of Screens</th>
              <th>Date Joined</th>
              <th>Last Activity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTechnicians.map((tech) => {
              const initials = tech.name
                .split(' ')
                .map((segment) => segment[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              return (
                <tr key={tech.id}>
                  <td>
                    <div className="technician-table__name">
                      <div className="technician-table__avatar">{initials}</div>
                      <span className="technician-table__name-text">{tech.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`technician-table__status technician-table__status--${tech.status.toLowerCase()}`}>
                      {tech.status}
                    </span>
                  </td>
                  <td>{tech.email}</td>
                  <td>{tech.department}</td>
                  <td>{tech.scans.toLocaleString()}</td>
                  <td>{new Date(tech.joined).toLocaleDateString()}</td>
                  <td className="technician-table__activity">{tech.last}</td>
                  <td className="technician-table__actions">
                    <div className="technician-table__row-actions">
                      <button type="button" onClick={() => openEditModal(tech)} aria-label="Edit technician">✏️</button>
                      <button type="button" onClick={() => handleDelete(tech)} aria-label="Delete technician">🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {departments.length > 0 && (
        <datalist id="department-options">
          {departments.map((dept) => (
            <option
              key={dept._id ?? dept.id ?? dept.code ?? dept.name}
              value={dept.name || dept.department || dept.code || dept.label}
            />
          ))}
        </datalist>
      )}
      {isModalOpen && (
        <div className="technician-add-modal">
          <div className="technician-add-modal__inner">
            <div className="technician-add-modal__header">
              <div>
                <p className="eyebrow-text">👥 Add New Technician</p>
                <h3>Create a new technician account that can log in to the mobile app.</h3>
              </div>
              <button type="button" className="technician-add-modal__close" onClick={closeModal}>
                ✕
              </button>
            </div>
            <form className="technician-add-form" onSubmit={handleFormSubmit}>
              <label>
                👤 Username *
                <input
                  type="text"
                  name="username"
                  minLength={3}
                  placeholder="Enter username (min 3 characters)"
                  value={technicianForm.username}
                  onChange={handleFormChange}
                  required
                />
              </label>
              <label>
                📧 Email *
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={technicianForm.email}
                  onChange={handleFormChange}
                  required
                />
              </label>
              <label>
                🏢 Department *
                <input
                  type="text"
                  name="department"
                  list="department-options"
                  placeholder="Enter department"
                  value={technicianForm.department}
                  onChange={handleFormChange}
                  required
                />
              </label>
              <label>
                🔒 Password *
                <input
                  type="password"
                  name="password"
                  minLength={6}
                  placeholder="Enter password (min 6 characters)"
                  value={technicianForm.password}
                  onChange={handleFormChange}
                  required
                />
              </label>
              <label>
                🔒 Confirm Password *
                <input
                  type="password"
                  name="confirmPassword"
                  minLength={6}
                  placeholder="Confirm password"
                  value={technicianForm.confirmPassword}
                  onChange={handleFormChange}
                  required
                />
              </label>
              <div className="technician-add-form__actions">
                <button type="button" className="technician-add-form__cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="technician-add-form__submit">
                  Create Technician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="technician-add-modal">
          <div className="technician-add-modal__inner">
            <div className="technician-add-modal__header">
              <div>
                <p className="eyebrow-text">✏️ Edit Technician</p>
                <h3>Update technician information. Leave password fields empty to keep the current password.</h3>
              </div>
              <button type="button" className="technician-add-modal__close" onClick={closeEditModal}>
                ✕
              </button>
            </div>
            <form className="technician-add-form" onSubmit={handleEditSubmit}>
              <label>
                👤 Username *
                <input
                  type="text"
                  name="username"
                  minLength={3}
                  placeholder="Enter username (min 3 characters)"
                  value={editForm.username}
                  onChange={handleEditChange}
                  required
                />
              </label>
              <label>
                📧 Email *
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                />
              </label>
              <label>
                🏢 Department *
                <input
                  type="text"
                  name="department"
                  list="department-options"
                  placeholder="Enter department"
                  value={editForm.department}
                  onChange={handleEditChange}
                  required
                />
              </label>
              <label>
                🔒 New Password (Optional)
                <input
                  type="password"
                  name="newPassword"
                  minLength={6}
                  placeholder="Enter new password (min 6 characters) or leave empty"
                  value={editForm.newPassword}
                  onChange={handleEditChange}
                />
              </label>
              <label>
                🔒 Confirm New Password
                <input
                  type="password"
                  name="confirmPassword"
                  minLength={6}
                  placeholder="Confirm new password"
                  value={editForm.confirmPassword}
                  onChange={handleEditChange}
                />
              </label>
              <div className="technician-add-form__actions">
                <button type="button" className="technician-add-form__cancel" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="technician-add-form__submit">
                  Update Technician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
