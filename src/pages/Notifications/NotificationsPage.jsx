import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './NotificationsPage.css';
import { getSessions, getUsers } from '../../services/apiClient';
import {
  extractSessionsFromResponse,
  buildScanRows,
  buildUsersLookup
} from '../../utils/sessionAggregators';

const LAST_SEEN_KEY = 'notifications.lastSeenCounts';

const STATUS_CONFIG = {
  production: {
    title: 'Screens Sent for Production',
    description: 'Marked as HEALTHY and awaiting production.',
    emoji: '🟢',
    verb: 'have been marked for production',
    statusFilter: 'healthy'
  },
  repair: {
    title: 'Screens Sent for Repair',
    description: 'Tagged as REPAIRABLE and awaiting repair.',
    emoji: '🟡',
    verb: 'have been sent for repair',
    statusFilter: 'repairable'
  },
  'written-off': {
    title: 'Screens Written Off',
    description: 'Screens beyond repair have been written off.',
    emoji: '🔴',
    verb: 'have been written off',
    statusFilter: 'beyond repair'
  }
};

const normalizeStatusValue = (value) => {
  const text = value?.toString().toLowerCase() ?? '';
  if (text.includes('reparable')) return 'repairable';
  if (text.includes('repairable')) return 'repairable';
  if (text.includes('written')) return 'beyond repair';
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

const loadSeenCounts = () => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(LAST_SEEN_KEY)) || {};
  } catch {
    return {};
  }
};

const saveSeenCounts = (counts) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_SEEN_KEY, JSON.stringify(counts));
};

export default function NotificationsPage() {
  const [scanRows, setScanRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seenCounts, setSeenCounts] = useState(() => loadSeenCounts());

  const handleMarkAllRead = useCallback(() => {
    const newCounts = Object.keys(STATUS_CONFIG).reduce((acc, key) => {
      const count = scanRows.filter((row) => normalizeStatusValue(row.status) === STATUS_CONFIG[key].statusFilter).length;
      acc[key] = count;
      return acc;
    }, {});
    setSeenCounts(newCounts);
    saveSeenCounts(newCounts);
  }, [scanRows]);

  const handleCardClick = useCallback(
    (id, count) => {
      const updated = { ...seenCounts, [id]: count };
      setSeenCounts(updated);
      saveSeenCounts(updated);
    },
    [seenCounts]
  );

  const fetchSessions = useCallback(async () => {
    try {
      const [sessionsPayload, usersResponse] = await Promise.all([getSessions(), getUsers()]);
      const sessions = extractSessionsFromResponse(sessionsPayload);
      const lookup = buildUsersLookup(usersResponse?.data ?? []);
      setScanRows(buildScanRows(sessions, lookup));
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      if (cancelled) return;
      await fetchSessions();
    };

    refresh();
    const intervalId = window.setInterval(refresh, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [fetchSessions]);

  const renderedGroups = useMemo(() => {
    return Object.entries(STATUS_CONFIG).map(([id, config]) => {
      const filteredRows = scanRows.filter((row) => normalizeStatusValue(row.status) === config.statusFilter);
      const time = filteredRows.length
        ? formatTimestamp(filteredRows[0].timestamp)
        : new Date().toLocaleString('en-US');
      return {
        id,
        title: config.title,
        description: `${filteredRows.length} screen(s) ${config.verb}.`,
        time,
        statusEmoji: config.emoji,
        count: filteredRows.length,
        rows: filteredRows,
        pathLabel: filteredRows.length ? `${filteredRows.length} screen(s) detail` : 'No screens yet',
        hasNew: filteredRows.length > (seenCounts[id] ?? 0)
      };
    });
  }, [scanRows, seenCounts]);

  return (
    <div className="page-view notifications-page">
      <header className="page-view__header notifications-header">
        <div>
          <h2>Notifications</h2>
          <p>Live action history grouped by current screen status.</p>
        </div>
        <div className="notifications-header__actions">
          <div className="notifications-live" aria-live="polite">
            <span className="notifications-live__dot" aria-hidden="true" />
            <span>Live feed</span>
          </div>
          <button type="button" className="notification-action" onClick={handleMarkAllRead}>
            Mark All Read
          </button>
        </div>
      </header>

      {loading && <p className="dashboard-page__status">Loading notifications…</p>}
      {error && <p className="dashboard-page__status dashboard-page__status--error">{error}</p>}

      <section className="notification-list">
        {renderedGroups.map((group) => (
          <article className="notification-card" key={group.id}>
            <div className="notification-card__header">
              <span className="notification-card__icon">{group.statusEmoji}</span>
              <div className="notification-card__title">
                <p className="eyebrow-text">Live scan notifications</p>
                <h3>{group.title}</h3>
              </div>
              <div className="notification-card__metrics">
                <span className="notification-card__count">{group.count}</span>
                {group.hasNew && <span className="notification-card__new-badge">NEW</span>}
              </div>
            </div>
            <p className="notification-card__description">{group.description}</p>
            <div className="notification-card__footer">
              <p className="notification-card__timestamp">Last updated {group.time}</p>
              <Link
                className="notification-card__link"
                to={`/notifications/${group.id}`}
                state={{ scans: group.rows }}
                onClick={() => handleCardClick(group.id, group.count)}
              >
                {group.pathLabel}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
