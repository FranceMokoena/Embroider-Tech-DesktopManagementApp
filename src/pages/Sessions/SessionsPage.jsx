import React, { useEffect, useMemo, useState } from 'react';
import './SessionsPage.css';
import { getDepartments, getSessions, getUsers } from '../../services/apiClient';

const ACTIVITY_OPTIONS = ['LOGIN', 'LOGOUT', 'STARTED SESSION', 'SCANNING'];
const PAGE_SIZE = 12;

const resolveTechnicianName = (raw, user) => {
  if (user) {
    const fullName = [user.name, user.surname, user.displayName, user.fullName, user?.profileName]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (fullName) return fullName;
    return user.username || user.email || 'Unknown Technician';
  }
  const fallbackName =
    raw.technicianName ||
    raw.technicianUsername ||
    raw.name ||
    raw.username ||
    raw.technicianDisplay ||
    raw.fullName ||
    raw.technician?.username;
  return fallbackName || 'Unknown Technician';
};

const findUserForSession = (raw, usersLookup = {}) => {
  if (!raw) return null;
  const identifiers = new Set();
  const addIdentifier = (value) => {
    if (!value) return;
    identifiers.add(value);
  };

  if (raw.technician) {
    if (typeof raw.technician === 'object') {
      addIdentifier(raw.technician._id);
      addIdentifier(raw.technician.id);
      addIdentifier(raw.technician.username);
      addIdentifier(raw.technician.email);
      addIdentifier(raw.technician.displayName);
      addIdentifier(raw.technician.name);
    } else {
      addIdentifier(raw.technician);
    }
  }

  addIdentifier(raw.technicianId);
  addIdentifier(raw.userId);
  addIdentifier(raw.sessionTechnician);
  addIdentifier(raw.technicianEmail);
  addIdentifier(raw.technicianName);
  addIdentifier(raw.technicianUsername);
  addIdentifier(raw.technicianDisplay);
  addIdentifier(raw.operatorId);
  addIdentifier(raw.techId);
  addIdentifier(raw.scanner);
  addIdentifier(raw.scannerId);
  addIdentifier(raw.scannerUsername);
  addIdentifier(raw.scannerEmail);

  if (raw.user) {
    addIdentifier(raw.user._id);
    addIdentifier(raw.user.id);
    addIdentifier(raw.user.username);
    addIdentifier(raw.user.email);
    addIdentifier(raw.user.name);
  }

  for (const identifier of identifiers) {
    const key = identifier?.toString?.();
    if (!key) continue;
    const lowerKey = key.toLowerCase();
    const upperKey = key.toUpperCase();
    const user =
      usersLookup[key] || usersLookup[lowerKey] || usersLookup[upperKey];
    if (user) {
      return user;
    }
  }

  return null;
};

const buildUsersLookup = (users = []) => {
  const lookup = {};
  users.forEach((user) => {
    ['_id', 'id', 'username', 'email', 'displayName', 'name', 'surname'].forEach((field) => {
      const value = user?.[field];
      if (!value) return;
      const key = value.toString();
      lookup[key] = lookup[key] || user;
    });
  });
  return lookup;
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
      const key = identifier.toString();
      lookup[key] = lookup[key] || display;
      lookup[key.toLowerCase()] = lookup[key.toLowerCase()] || display;
    });
  });
  return lookup;
};

const normalizeLabelValue = (value) => {
  if (!value && value !== 0) return '';
  try {
    return value.toString().trim().toLowerCase();
  } catch {
    return '';
  }
};

const resolveDepartmentDisplay = (departmentValue, lookup = {}, fallback = 'Unassigned') => {
  if (!departmentValue) return fallback;
  if (typeof departmentValue === 'object') {
    const display =
      departmentValue.name ||
      departmentValue.department ||
      departmentValue.label ||
      departmentValue.code ||
      departmentValue.value;
    if (display) return display;
    const nestedKey = departmentValue._id || departmentValue.id;
    if (nestedKey) {
      const value = nestedKey.toString();
      if (lookup[value]) return lookup[value];
      const lowerValue = value.toLowerCase();
      if (lookup[lowerValue]) return lookup[lowerValue];
    }
  }

  const key = departmentValue.toString();
  if (lookup[key]) return lookup[key];
  const lowerKey = key.toLowerCase();
  if (lookup[lowerKey]) return lookup[lowerKey];
  return departmentValue;
};

const resolveSessionScans = (raw) => {
  if (typeof raw.totalScans === 'number') return raw.totalScans;
  if (typeof raw.scanCount === 'number') return raw.scanCount;
  if (typeof raw.scans === 'number') return raw.scans;
  if (Array.isArray(raw.scans)) return raw.scans.length;
  if (raw.screenCount && typeof raw.screenCount === 'number') return raw.screenCount;
  if (raw.screenCount) {
    const parsed = Number(raw.screenCount);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const normalizeSession = (raw, usersLookup, departmentLookup) => {
  const start = raw.startTime || raw.start || raw.createdAt;
  const end = raw.endTime || raw.end;
  const scans = resolveSessionScans(raw);
  const user = findUserForSession(raw, usersLookup);
  const technician = resolveTechnicianName(raw, user);
  const status = (raw.status || (end ? 'Completed' : 'In Progress')).toUpperCase();
  const last =
    raw.lastActivity && ACTIVITY_OPTIONS.includes(raw.lastActivity.toUpperCase())
      ? raw.lastActivity.toUpperCase()
      : status === 'COMPLETED'
      ? 'LOGOUT'
      : 'SCANNING';
  const departmentSource =
    user?.department ??
    user?.dept ??
    user?.division ??
    user?.departmentName ??
    user?.team ??
    raw.departmentName ??
    raw.department?.name ??
    raw.department ??
    raw.departmentCode ??
    raw.techDepartment ??
    raw.departmentId ??
    raw.user?.department;
  return {
    id: raw._id ?? raw.id ?? raw.sessionId ?? 'unknown',
    technician,
    department: resolveDepartmentDisplay(
      departmentSource,
      departmentLookup,
      'Unassigned'
    ),
    start,
    end,
    scans,
    status,
    last,
    duration: start && end ? Math.round((new Date(end) - new Date(start)) / 1000) : null
  };
};

export default function SessionsPage() {
  const [sessionList, setSessionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({ technician: '', department: '', day: '' });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionsResponse, usersResponse, departmentsResponse] = await Promise.all([
        getSessions(),
        getUsers(),
        getDepartments()
      ]);
      const users = usersResponse?.data ?? [];
      const lookup = buildUsersLookup(users);
      const deptList = departmentsResponse?.departments ?? departmentsResponse ?? [];
      const deptLookup = buildDepartmentLookup(Array.isArray(deptList) ? deptList : []);

      const payload = sessionsResponse?.data?.sessions ?? sessionsResponse?.sessions ?? sessionsResponse?.data ?? sessionsResponse;
      const items = Array.isArray(payload) ? payload : payload?.sessions ?? [];
      const normalizedSessions = items.map((raw) => normalizeSession(raw, lookup, deptLookup));
      const departmentScanTotals = normalizedSessions.reduce((acc, session) => {
        const key = normalizeLabelValue(session.department);
        if (!key) return acc;
        acc[key] = (acc[key] ?? 0) + (session.scans ?? 0);
        return acc;
      }, {});
      const enrichedSessions = normalizedSessions.map((session) => ({
        ...session,
        departmentScans: departmentScanTotals[normalizeLabelValue(session.department)] ?? 0
      }));
      setSessionList(enrichedSessions);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filteredSessions = useMemo(() => {
    return sessionList.filter((session) => {
      const matchesTechnician =
        !filters.technician ||
        session.technician.toLowerCase().includes(filters.technician.toLowerCase());
      const matchesDepartment =
        !filters.department ||
        session.department.toLowerCase().includes(filters.department.toLowerCase());
      const matchesDay =
        !filters.day || (session.start && session.start.startsWith(filters.day));
      return matchesTechnician && matchesDepartment && matchesDay;
    });
  }, [filters, sessionList]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.technician, filters.department, filters.day]);

  const totalPages = useMemo(
    () => (filteredSessions.length ? Math.ceil(filteredSessions.length / PAGE_SIZE) : 1),
    [filteredSessions.length]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedSessions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSessions.slice(start, start + PAGE_SIZE);
  }, [filteredSessions, currentPage]);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const summaryStats = useMemo(() => {
    const total = sessionList.length;
    const totalScans = sessionList.reduce((acc, session) => acc + (session.scans ?? 0), 0);
    const inProgress = sessionList.filter((session) => session.status.includes('IN PROGRESS')).length;
    const completed = sessionList.filter((session) => session.status.includes('COMPLETED')).length;
    const uniqueDepartments = new Set(
      sessionList.map((session) => (session.department || '').toLowerCase())
    );
    return {
      total,
      totalScans,
      avgScans: total ? Math.round(totalScans / total) : 0,
      inProgress,
      completed,
      departmentCount: Array.from(uniqueDepartments).filter(Boolean).length
    };
  }, [sessionList]);

  const handleExportData = () => {
    const header = ['Session ID', 'Technician', 'Department', 'Start', 'End', 'Scans', 'Status'];
    const rows = filteredSessions.map((session) => [
      session.id,
      session.technician,
      session.department,
      session.start ? new Date(session.start).toLocaleString('en-US') : '—',
      session.end ? new Date(session.end).toLocaleString('en-US') : 'In Progress',
      session.scans,
      session.status
    ]);
    const csvContent = [header, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sessions.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const durationText = (seconds) =>
    seconds ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : '—';

  const formatTimeOnly = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleTimeString('en-US');
    } catch {
      return '—';
    }
  };

  const handleDeleteSessions = () => {
    if (window.confirm('Delete all currently listed sessions?')) {
      setSessionList([]);
    }
  };

  const getStatusPillClass = (status) => {
    const key = status?.toLowerCase?.() ?? '';
    if (key.includes('in progress') || key.includes('progress')) return 'status-pill--in-progress';
    if (key.includes('completed')) return 'status-pill--completed';
    if (key.includes('failed') || key.includes('archived')) return 'status-pill--muted';
    return 'status-pill--neutral';
  };

  return (
    <div className="page-view sessions-page">
      <header className="page-view__header">
        <div>
          <h2>Session Intelligence</h2>
          <p>Live capture activity organized for executive review.</p>
        </div>
        <div className="sessions-actions">
          <button type="button" className="pill neutral" onClick={handleDeleteSessions}>
            Clear view
          </button>
          <button type="button" className="pill neutral" onClick={() => setShowFilters((prev) => !prev)}>
            {showFilters ? 'Hide filters' : 'Show filters'}
          </button>
          <button type="button" className="pill solid" onClick={handleExportData}>
            Export CSV
          </button>
        </div>
      </header>

      <section className="sessions-summary">
        <article className="summary-card">
          <p className="summary-card__label">Total sessions</p>
          <strong className="summary-card__value">{summaryStats.total.toLocaleString()}</strong>
          <p className="summary-card__caption">
            {summaryStats.completed} completed · {summaryStats.inProgress} in progress
          </p>
        </article>
        <article className="summary-card">
          <p className="summary-card__label">Captured screens</p>
          <strong className="summary-card__value">{summaryStats.totalScans.toLocaleString()}</strong>
          <p className="summary-card__caption">
            {summaryStats.departmentCount} departments reporting
          </p>
        </article>
        <article className="summary-card">
          <p className="summary-card__label">Avg. scans / session</p>
          <strong className="summary-card__value">{summaryStats.avgScans}</strong>
          <p className="summary-card__caption">Quality-ready pulse</p>
        </article>
      </section>

      <section className={`sessions-filters ${showFilters ? 'is-visible' : 'is-hidden'}`}>
        <div className="filter-row">
          <label>
            Technician
            <input
              placeholder="Filter by technician"
              name="technician"
              value={filters.technician}
              onChange={(event) => setFilters((prev) => ({ ...prev, technician: event.target.value }))}
            />
          </label>
          <label>
            Department
            <input
              placeholder="Filter by department"
              name="department"
              value={filters.department}
              onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))}
            />
          </label>
          <label>
            Day
            <input
              type="date"
              name="day"
              value={filters.day}
              onChange={(event) => setFilters((prev) => ({ ...prev, day: event.target.value }))}
            />
          </label>
        </div>
      </section>

      {loading && <p className="dashboard-page__status">Loading sessions…</p>}
      {error && <p className="dashboard-page__status dashboard-page__status--error">{error}</p>}

      {!loading && !error && (
        <section className="session-table-section">
          <div className="session-table__header">
            <div>
              <p className="eyebrow-text">RECENT ACTIVITY</p>
              <h3>{filteredSessions.length.toLocaleString()} session records</h3>
            </div>
            <p className="session-table__note">
              Showing the freshest captures across every department with real-time scan counts.
            </p>
          </div>
          <div className="session-table__wrapper">
            <table className="session-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Technician</th>
                  <th>Department</th>
                  <th>Scans</th>
                  <th>Status</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {pagedSessions.map((session) => (
                  <tr key={session.id}>
                    <td>
                      <div className="session-table__id">{session.id}</div>
                      <p className="session-table__hint">{session.last || '—'}</p>
                    </td>
                    <td>{session.technician || '—'}</td>
                    <td>
                      <span className="session-table__dept">{session.department || '—'}</span>
                    </td>
                    <td>{session.scans?.toLocaleString?.() ?? '0'}</td>
                    <td>
                      <span className={`status-pill ${getStatusPillClass(session.status)}`}>
                        {session.status}
                      </span>
                    </td>
                    <td>{formatTimeOnly(session.start)}</td>
                    <td>{session.end ? formatTimeOnly(session.end) : 'In Progress'}</td>
                    <td>{durationText(session.duration)}</td>
                  </tr>
                ))}
                {!filteredSessions.length && (
                  <tr>
                    <td colSpan="8" className="session-table__empty">
                      No sessions match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredSessions.length > PAGE_SIZE && (
            <div className="sessions-pagination">
              <button
                type="button"
                className="sessions-pagination__button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                &lt;
              </button>
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`sessions-pagination__button ${page === currentPage ? 'is-active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                className="sessions-pagination__button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                &gt;
              </button>
              <span className="sessions-pagination__meta">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
        </section>
      )}
    </div>
  );

}
