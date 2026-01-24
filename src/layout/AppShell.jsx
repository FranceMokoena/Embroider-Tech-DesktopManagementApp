import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './AppShell.css';
import { getSessions } from '../services/apiClient';
import {
  extractSessionsFromResponse,
  resolveSessionScans
} from '../utils/sessionAggregators';

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [newScanCount, setNewScanCount] = useState(0);
  const [lastTotalScans, setLastTotalScans] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const adminActionsRef = useRef(null);
  const lastTotalRef = useRef(null);
  const shakeTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const computeTotalScans = useCallback((payload) => {
    if (!payload) return 0;
    if (typeof payload.totalScans === 'number') return payload.totalScans;
    const sessions = extractSessionsFromResponse(payload);
    return sessions.reduce((sum, session) => sum + resolveSessionScans(session), 0);
  }, []);

  const triggerShake = useCallback(() => {
    setIsShaking(true);
    if (shakeTimeoutRef.current) {
      window.clearTimeout(shakeTimeoutRef.current);
    }
    shakeTimeoutRef.current = window.setTimeout(() => {
      setIsShaking(false);
      shakeTimeoutRef.current = null;
    }, 900);
  }, []);

  useEffect(() => {
    let intervalId;

    const refreshNotificationCounts = async () => {
      try {
        const response = await getSessions({ limit: 40 });
        const total = computeTotalScans(response);
        if (lastTotalRef.current === null) {
          lastTotalRef.current = total;
          setLastTotalScans(total);
          return;
        }

        if (total > lastTotalRef.current) {
          const delta = total - lastTotalRef.current;
          setNewScanCount((count) => count + delta);
          triggerShake();
        } else if (total < lastTotalRef.current) {
          setNewScanCount(0);
        }

        lastTotalRef.current = total;
        setLastTotalScans(total);
      } catch (error) {
        console.error('Failed to refresh notification counts', error);
      }
    };

    refreshNotificationCounts();
    intervalId = window.setInterval(refreshNotificationCounts, 20000);

    return () => {
      clearInterval(intervalId);
    };
  }, [computeTotalScans, triggerShake]);

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
    return () => {
      if (shakeTimeoutRef.current) {
        window.clearTimeout(shakeTimeoutRef.current);
      }
    };
  }, []);

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
