import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './AppShell.css';
import { getSessions } from '../services/apiClient';
import {
  extractSessionsFromResponse,
  buildScanRows
} from '../utils/sessionAggregators';

const LAST_SEEN_KEY = 'notifications.lastSeenCounts';
const LAST_BELL_KEY = 'notifications.lastBellSeenCounts';

const STATUS_FILTERS = {
  production: 'healthy',
  repair: 'repairable',
  'written-off': 'beyond repair'
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

const loadSeenCounts = () => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(LAST_SEEN_KEY)) || {};
  } catch {
    return {};
  }
};

const loadBellSeenCounts = () => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(LAST_BELL_KEY)) || {};
  } catch {
    return {};
  }
};

const saveBellSeenCounts = (counts) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_BELL_KEY, JSON.stringify(counts));
};

const mergeSeenCounts = (primary = {}, fallback = {}) =>
  Object.keys(STATUS_FILTERS).reduce((acc, key) => {
    const base = primary[key] ?? 0;
    const alt = fallback[key] ?? 0;
    acc[key] = base > alt ? base : alt;
    return acc;
  }, {});

const buildStatusCounts = (rows = []) =>
  Object.keys(STATUS_FILTERS).reduce((acc, key) => {
    const statusFilter = STATUS_FILTERS[key];
    acc[key] = rows.filter((row) => normalizeStatusValue(row.status) === statusFilter).length;
    return acc;
  }, {});

const computeNewTotal = (counts = {}, seen = {}) =>
  Object.keys(STATUS_FILTERS).reduce((sum, key) => {
    const delta = (counts[key] ?? 0) - (seen[key] ?? 0);
    return sum + (delta > 0 ? delta : 0);
  }, 0);

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [newScanCount, setNewScanCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored =
      window.localStorage.getItem('appTheme') ?? window.localStorage.getItem('dashboardTheme');
    return stored === 'dark';
  });
  const adminActionsRef = useRef(null);
  const latestCountsRef = useRef({});
  const refreshTimeoutRef = useRef(null);
  const refreshInFlightRef = useRef(false);
  const retryDelayRef = useRef(0);
  const navigate = useNavigate();

  const triggerShake = useCallback(() => {
    setIsShaking(true);
  }, []);

  useEffect(() => {
    const baseInterval = 15000;
    const maxInterval = 120000;

    const refreshNotificationCounts = async () => {
      if (document.hidden || refreshInFlightRef.current) {
        return;
      }
      refreshInFlightRef.current = true;
      try {
        const response = await getSessions();
        const sessions = extractSessionsFromResponse(response);
        const scanRows = buildScanRows(sessions);
        const counts = buildStatusCounts(scanRows);
        latestCountsRef.current = counts;
        const seenCounts = loadSeenCounts();
        const bellSeenCounts = loadBellSeenCounts();
        const effectiveSeenCounts = mergeSeenCounts(bellSeenCounts, seenCounts);
        const newTotal = computeNewTotal(counts, effectiveSeenCounts);
        setNewScanCount(newTotal);
        if (newTotal > 0) {
          triggerShake();
        } else {
          setIsShaking(false);
        }
        retryDelayRef.current = 0;
      } catch (error) {
        console.error('Failed to refresh notification counts', error);
        retryDelayRef.current = retryDelayRef.current
          ? Math.min(retryDelayRef.current * 2, maxInterval)
          : baseInterval;
      } finally {
        refreshInFlightRef.current = false;
      }
    };

    const scheduleNext = (delay) => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = window.setTimeout(async () => {
        await refreshNotificationCounts();
        const nextDelay = retryDelayRef.current || baseInterval;
        scheduleNext(nextDelay);
      }, delay);
    };

    refreshNotificationCounts();
    scheduleNext(baseInterval);

    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [triggerShake]);

  useEffect(() => {
    const closeMenu = (event) => {
      if (adminActionsRef.current && !adminActionsRef.current.contains(event.target)) {
        setAdminMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const theme = isDarkMode ? 'dark' : 'light';
    document.body.classList.toggle('theme-dark', isDarkMode);
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('appTheme', theme);
  }, [isDarkMode]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    sessionStorage.removeItem('adminTokenBackup');
    sessionStorage.removeItem('adminUsernameBackup');
    setAdminMenuOpen(false);
    navigate('/admin-login', { replace: true });
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleNotificationClick = () => {
    saveBellSeenCounts(latestCountsRef.current);
    setNewScanCount(0);
    setIsShaking(false);
    navigate('/notifications');
  };

  return (
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
      <div className="app-shell__inner">
        <header className="app-shell__header">
          <div className="app-shell__header-left">
            <button
              className="app-shell__toggle"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={`${collapsed ? 'Expand' : 'Collapse'} sidebar`}
            >
              <span />
              <span />
              <span />
            </button>
            <div className="app-shell__title-group">
              <p className="app-shell__eyebrow">Enterprise Operations</p>
              <h1>Embroideries Screen Management System</h1>
            </div>
          </div>
          <div className="app-shell__actions" ref={adminActionsRef}>
            <button
              type="button"
              className={`app-shell__action app-shell__notification ${isShaking ? 'is-shaking' : ''}`}
              aria-label="View notifications"
              onClick={handleNotificationClick}
            >
              <span aria-hidden="true" className="app-shell__emoji-icon">
                🔔
              </span>
              {newScanCount > 0 && (
                <span className="app-shell__notification-badge">{newScanCount}</span>
              )}
            </button>
            
            <button
              type="button"
              className="app-shell__action"
              aria-label="Refresh dashboard"
              onClick={handleRefresh}
            >
              <span aria-hidden="true" className="app-shell__emoji-icon">
                🔄️
              </span>
            </button>
            <button
              type="button"
              className="app-shell__action app-shell__theme-toggle"
              aria-pressed={isDarkMode}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setIsDarkMode((prev) => !prev)}
            >
              {isDarkMode ? (
                <svg className="app-shell__theme-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 14.5A9 9 0 0 1 9.5 3a9 9 0 1 0 11.5 11.5z" />
                </svg>
              ) : (
                <svg className="app-shell__theme-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 4.5a1 1 0 0 1 1 1V7a1 1 0 0 1-2 0V5.5a1 1 0 0 1 1-1zm0 12a1 1 0 0 1 1 1V19a1 1 0 0 1-2 0v-1.5a1 1 0 0 1 1-1zm7.5-4.5a1 1 0 0 1-1 1H17a1 1 0 1 1 0-2h1.5a1 1 0 0 1 1 1zM7 12a1 1 0 0 1-1 1H4.5a1 1 0 1 1 0-2H6a1 1 0 0 1 1 1zm9.95-5.45a1 1 0 0 1 0 1.41l-1.06 1.06a1 1 0 0 1-1.41-1.41l1.06-1.06a1 1 0 0 1 1.41 0zM8.52 15.47a1 1 0 0 1 0 1.41l-1.06 1.06a1 1 0 0 1-1.41-1.41l1.06-1.06a1 1 0 0 1 1.41 0zm7.01 2.47a1 1 0 0 1-1.41 0l-1.06-1.06a1 1 0 1 1 1.41-1.41l1.06 1.06a1 1 0 0 1 0 1.41zM8.52 8.53a1 1 0 0 1-1.41 0L6.05 7.47a1 1 0 1 1 1.41-1.41l1.06 1.06a1 1 0 0 1 0 1.41zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
                </svg>
              )}
            </button>













            <div className="app-shell__admin-wrapper">
              <button
                type="button"
                className="app-shell__admin"
                onClick={() => setAdminMenuOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={adminMenuOpen}
                aria-label="Open account menu"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </button>
               






              {adminMenuOpen && (
                <div className="app-shell__admin-menu">
                  {/* Simple logout action so the user sees the label clearly. */}
                  <button
                    type="button"
                    className="app-shell__logout-button"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="app-shell__body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
