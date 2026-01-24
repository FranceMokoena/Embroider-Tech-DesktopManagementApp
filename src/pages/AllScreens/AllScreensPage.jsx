import React, { useEffect, useMemo, useState } from 'react';
import './AllScreensPage.css';
import StatsCards from '../../components/dashboard/StatsCards';
import { getSessions, getUsers, deleteScreens } from '../../services/apiClient';
import {
  extractSessionsFromResponse,
  buildUsersLookup,
  buildScanRows
} from '../../utils/sessionAggregators';

const formatTimestamp = (value) => {
  if (!value) return 'ƒ?"';
  try {
    return new Date(value).toLocaleString('en-US');
  } catch {
    return String(value);
  }
};

const TIMEFRAME_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' }
];

const filterScreensByTimeframe = (screens = [], timeframe = 'all') => {
  if (!timeframe || timeframe === 'all') return screens;
  const now = Date.now();
  const offsets = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000
  };
  const offset = offsets[timeframe];
  if (!offset) return screens;
  const cutoff = now - offset;
  return screens.filter((row) => {
    const timestamp = row.timestamp ? Date.parse(row.timestamp) : NaN;
    return Number.isFinite(timestamp) && timestamp >= cutoff;
  });
};

const buildCsvPayload = (rows = []) => {
  const headers = ['Barcode', 'Status', 'Technician', 'Department', 'Session', 'Timestamp'];
  const lines = rows.map((row) => [
    row.barcode,
    row.status,
    row.technician,
    row.department,
    row.sessionId,
    formatTimestamp(row.timestamp)
  ]);
  return [headers, ...lines]
    .map((values) =>
      values.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')
    )
    .join('\r\n');
};

const AllScreensPage = () => {
  const [screens, setScreens] = useState([]);
  const [historyPayload, setHistoryPayload] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingBarcode, setDeletingBarcode] = useState(null);
  const [timeframe, setTimeframe] = useState('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getSessions(), getUsers()])
      .then(([payload, usersResponse]) => {
        if (cancelled) return;
        const sessionList = extractSessionsFromResponse(payload);
        const lookup = buildUsersLookup(usersResponse?.data ?? []);
        setHistoryPayload(payload);
        setUsers(usersResponse?.data ?? []);
        setScreens(buildScanRows(sessionList, lookup));
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Unable to load screens');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredScreens = useMemo(() => filterScreensByTimeframe(screens, timeframe), [screens, timeframe]);

  const stats = useMemo(() => {
    const uniqueTechnicians = new Set(screens.map((row) => row.technician));
    const uniqueDepartments = new Set(screens.map((row) => row.department));
    return [
      {
        label: 'Total Screens',
        value: screens.length,
        subtitle: 'Scans recorded'
      },
      {
        label: 'Technicians',
        value: uniqueTechnicians.size,
        subtitle: 'Active operators'
      },
      {
        label: 'Departments',
        value: uniqueDepartments.size,
        subtitle: 'Departments served'
      },
      {
        label: 'Sessions',
        value: historyPayload?.totalSessions ?? 0,
        subtitle: 'Historic sessions'
      }
    ];
  }, [screens, historyPayload]);

  const handleDelete = async (row) => {
    if (!row?.barcode) return;
    if (!window.confirm(`Delete screen ${row.barcode}? This action cannot be undone.`)) {
      return;
    }
    setDeletingBarcode(row.id);
    try {
      await deleteScreens({ barcodes: [row.barcode] });
      setScreens((prev) => prev.filter((item) => item.id !== row.id));
    } catch (err) {
      setError(err.message || 'Failed to delete screen');
    } finally {
      setDeletingBarcode(null);
    }
  };

  const handleExport = (rows) => {
    if (!rows.length) {
      window.alert('No scans are visible to export right now.');
      return;
    }
    const csv = buildCsvPayload(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `screens-${timeframe || 'all'}-${new Date().toISOString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-view all-screens-page">
      <header className="page-view__header">
        <div>
          <h2>All Screens</h2>
          <p>Every scan recorded by the mobile backend with its barcode and metadata.</p>
        </div>
      </header>

      {loading && <p className="dashboard-page__status">Loading screensƒ?İ</p>}
      {error && <p className="dashboard-page__status dashboard-page__status--error">{error}</p>}

      {!loading && !error && (
        <>
          <section className="section-card">
            <StatsCards stats={stats} />
          </section>

          <section className="section-card all-screens-table">
            <div className="all-screens-table__header">
              <div>
                <span>Latest scans</span>
                <small className="all-screens-table__header-meta">
                  {filteredScreens.length.toLocaleString()} visible · {screens.length.toLocaleString()} total
                </small>
              </div>
              <div className="all-screens-table__header-actions">
                <div className="all-screens-toolbar">
                  {TIMEFRAME_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={`tiny-button ${timeframe === option.key ? 'tiny-button--active' : ''}`}
                      onClick={() => setTimeframe(option.key)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="tiny-button tiny-button--ghost"
                  onClick={() => handleExport(filteredScreens)}
                >
                  Export CSV
                </button>
              </div>
            </div>
            <div className="all-screens-table__grid">
              <div className="all-screens-table__row head">
                <span>Barcode</span>
                <span>Status</span>
                <span>Technician</span>
                <span>Department</span>
                <span>Session</span>
                <span>Timestamp</span>
              </div>
              {filteredScreens.map((row) => (
                <div className="all-screens-table__row" key={row.id}>
                  <span>{row.barcode}</span>
                  <span>{row.status}</span>
                  <span>{row.technician}</span>
                  <span>{row.department}</span>
                  <span>#{row.sessionId}</span>
                  <span>{formatTimestamp(row.timestamp)}</span>
                  <button
                    type="button"
                    className="all-screens-table__delete"
                    onClick={() => handleDelete(row)}
                    disabled={deletingBarcode === row.id}
                    aria-label={`Delete ${row.barcode}`}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AllScreensPage;
