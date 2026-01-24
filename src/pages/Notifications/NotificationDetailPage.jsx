import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './NotificationsPage.css';
import {
  deleteScreens,
  getSessions,
  getUsers
} from '../../services/apiClient';
import {
  extractSessionsFromResponse,
  buildScanRows,
  buildUsersLookup
} from '../../utils/sessionAggregators';

const STATUS_CONFIG = {
  production: {
    title: 'Screens Sent for Production',
    description: 'Marked as HEALTHY and awaiting production.',
    emoji: '🟢',
    statusFilter: 'healthy'
  },
  repair: {
    title: 'Screens Sent for Repair',
    description: 'Tagged as REPAIRABLE and awaiting repair.',
    emoji: '🟡',
    statusFilter: 'repairable'
  },
  'written-off': {
    title: 'Screens Written Off',
    description: 'Screens beyond repair have been written off.',
    emoji: '🔴',
    statusFilter: 'beyond repair'
  }
};

const normalizeStatusValue = (value) => {
  const text = value?.toString().toLowerCase() ?? '';
  if (text.includes('repairable')) return 'repairable';
  if (text.includes('beyond')) return 'beyond repair';
  if (text.includes('healthy')) return 'healthy';
  return text;
};

const formatTimestamp = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-US');
  } catch {
    return String(value);
  }
};

const resolveSortTimestamp = (value) => Date.parse(value) || 0;

export default function NotificationDetailPage() {
  const navigate = useNavigate();
  const { category } = useParams();
  const location = useLocation();
  const config = STATUS_CONFIG[category];

  const [scanRows, setScanRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingIds, setDeletingIds] = useState([]);
  const [deletingAll, setDeletingAll] = useState(false);

  const filteredRowsFromState = location.state?.scans ?? [];

  const fetchData = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    setError(null);
    try {
      const [sessionsPayload, usersResponse] = await Promise.all([getSessions(), getUsers()]);
      const sessions = extractSessionsFromResponse(sessionsPayload);
      const lookup = buildUsersLookup(usersResponse?.data ?? []);
      setScanRows(buildScanRows(sessions, lookup));
    } catch (err) {
      setError(err.message || 'Failed to load scan details');
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    if (!config) return;
    fetchData();
  }, [config, fetchData]);

  const filteredScans = useMemo(() => {
    const sourceRows = scanRows.length ? scanRows : filteredRowsFromState;
    if (!config) return [];
    return sourceRows.filter((row) => normalizeStatusValue(row.status) === config.statusFilter);
  }, [scanRows, filteredRowsFromState, config]);

  const sortedScans = useMemo(
    () =>
      filteredScans
        .map((row) => ({ ...row, sortTimestamp: resolveSortTimestamp(row.timestamp) }))
        .sort((a, b) => b.sortTimestamp - a.sortTimestamp),
    [filteredScans]
  );

  const isDeleting = useCallback((barcode) => deletingIds.includes(barcode), [deletingIds]);

  const handleDelete = useCallback(
    async (barcode) => {
      if (!window.confirm(`Delete scan with barcode ${barcode}?`)) return;
      setDeletingIds((prev) => [...prev, barcode]);
      try {
        await deleteScreens({ barcodes: [barcode] });
        setScanRows((prev) => prev.filter((row) => row.barcode !== barcode));
      } catch (err) {
        setError(err.message || 'Failed to delete scan');
      } finally {
        setDeletingIds((prev) => prev.filter((value) => value !== barcode));
      }
    },
    []
  );

  const handleDeleteAll = useCallback(async () => {
    if (!filteredScans.length) return;
    if (!window.confirm(`Delete all ${filteredScans.length} scans?`)) return;
    setDeletingAll(true);
    try {
      await deleteScreens({ barcodes: filteredScans.map((screen) => screen.barcode) });
      setScanRows((prev) => prev.filter((row) => normalizeStatusValue(row.status) !== config.statusFilter));
    } catch (err) {
      setError(err.message || 'Failed to delete scans');
    } finally {
      setDeletingAll(false);
    }
  }, [filteredScans, config]);

  if (!config) {
    return (
      <div className="page-view">
        <p>Category not found.</p>
      </div>
    );
  }

  return (
    <div className="page-view">
      <header className="page-view__header">
        <div>
          <h2>{config.title}</h2>
          <p>{config.description}</p>
        </div>
        <div className="sessions-actions">
          <button type="button" className="pill ghost" onClick={() => navigate('/notifications')}>
            ← Back to Notifications
          </button>
          <button
            type="button"
            className="pill solid"
            onClick={handleDeleteAll}
            disabled={deletingAll || !filteredScans.length}
          >
            {deletingAll ? 'Deleting...' : 'Delete All'}
          </button>
        </div>
      </header>
      <section className="notifications-detail">
        <div className="notification-card__header">
          <span className="notification-card__emoji">{config.emoji}</span>
          <div>
            <p className="eyebrow-text">{config.title}</p>
            <h3>{filteredScans.length} scan(s) in this category</h3>
          </div>
        </div>
        <p className="notifications-detail__label">Scans ready for action</p>
        {error && <p className="dashboard-page__status dashboard-page__status--error">{error}</p>}
        {loading && <p className="dashboard-page__status">Loading scans...</p>}
        {!loading && !filteredScans.length && (
          <p className="notifications-detail__empty">There are no scans yet for this category.</p>
        )}
        <div className="screen-list">
          {sortedScans.map((screen) => (
            <article className="screen-card" key={screen.id}>
              <div className="screen-card__meta-row">
                <p className="screen-card__id">{screen.barcode}</p>
                <div className="screen-card__actions">
                  <button
                    type="button"
                    className="screen-card__delete"
                    onClick={() => handleDelete(screen.barcode)}
                    disabled={isDeleting(screen.barcode)}
                  >
                    {isDeleting(screen.barcode) ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
              <p className="screen-card__badge">Status: {screen.status}</p>
              <p className="screen-card__meta">Technician: {screen.technician}</p>
              <p className="screen-card__meta">Department: {screen.department}</p>
              <p className="screen-card__meta">Scan Time: {formatTimestamp(screen.timestamp)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
