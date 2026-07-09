import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAssets } from '../context/AssetContext';
import { getStoredAuth } from '../services/authStorage';
import './ERPLayout.css';

const navItems = [
  {
    group: 'Operations',
    items: [
      ['Dashboard', '/dashboard', 'dashboard'],
      ['All Assets', '/assets', 'assets'],
      ['RFID Verification', '/verify', 'rfid'],
      ['Sections', '/sections', 'sections'],
      ['Transfers', '/transfers', 'transfers']
    ]
  },
  {
    group: 'Governance',
    items: [
      ['Reports', '/reports', 'reports'],
      ['Audit Logs', '/audit', 'audit'],
      ['Users & Roles', '/users', 'users'],
      ['Settings', '/settings', 'settings']
    ]
  }
];

const pageMeta = {
  '/dashboard': ['Dashboard', 'Operations Center'],
  '/home-dashboard': ['Dashboard', 'Operations Center'],
  '/assets': ['All Assets', 'Asset Registry'],
  '/verify': ['RFID Verification', 'Room Control'],
  '/sections': ['Sections', 'Registry Control'],
  '/transfers': ['Transfers', 'Asset Movement'],
  '/reports': ['Reports', 'Governance'],
  '/audit': ['Audit Logs', 'Verification History'],
  '/users': ['Users & Roles', 'Identity Management'],
  '/settings': ['Settings', 'System Governance']
};

function Icon({ name }) {
  const paths = {
    dashboard: 'M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-5H4v5Zm10 0h6v-5h-6v5Z',
    assets: 'M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Zm8 4.2 5.4-3.1L12 5.6 6.6 8.6l5.4 3.1Zm-6 3.6 5 2.8v-4.7l-5-2.9v4.8Zm7 2.8 5-2.8v-4.8l-5 2.9v4.7Z',
    rfid: 'M5.4 8.3a8 8 0 0 0 0 7.4l-1.7 1a10 10 0 0 1 0-9.4l1.7 1Zm15-1a10 10 0 0 1 0 9.4l-1.7-1a8 8 0 0 0 0-7.4l1.7-1ZM8.9 10.2a4 4 0 0 0 0 3.6l-1.8 1a6 6 0 0 1 0-5.6l1.8 1Zm8-1a6 6 0 0 1 0 5.6l-1.8-1a4 4 0 0 0 0-3.6l1.8-1ZM12 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z',
    sections: 'M4 5h7v6H4V5Zm9 0h7v6h-7V5ZM4 13h7v6H4v-6Zm9 0h7v6h-7v-6Z',
    transfers: 'M7 7h10l-3-3 1.4-1.4L20.8 8l-5.4 5.4L14 12l3-3H7V7Zm10 10H7l3 3-1.4 1.4L3.2 16l5.4-5.4L10 12l-3 3h10v2Z',
    reports: 'M6 3h9l3 3v15H6V3Zm8 1.8V7h2.2L14 4.8ZM8 11h8v2H8v-2Zm0 4h8v2H8v-2Zm0-8h4v2H8V7Z',
    audit: 'M12 2 5 5v6c0 4.4 2.8 8.4 7 10 4.2-1.6 7-5.6 7-10V5l-7-3Zm-1 13.4-3.2-3.2 1.4-1.4 1.8 1.8 4.3-4.3 1.4 1.4-5.7 5.7Z',
    users: 'M8 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm8.5 1a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7ZM2 20c.4-3.4 3-6 6-6s5.6 2.6 6 6H2Zm12.5 0a7.8 7.8 0 0 0-2-4.5 5.3 5.3 0 0 1 4-1.5c2.7 0 4.9 2.5 5.3 6h-7.3Z',
    settings: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm8.8 5.2-1.9.5a7 7 0 0 1-.8 1.9l1 1.7-1.8 1.8-1.7-1a7 7 0 0 1-1.9.8l-.5 1.9h-2.5l-.5-1.9a7 7 0 0 1-1.9-.8l-1.7 1-1.8-1.8 1-1.7a7 7 0 0 1-.8-1.9l-1.9-.5v-2.5l1.9-.5a7 7 0 0 1 .8-1.9l-1-1.7 1.8-1.8 1.7 1a7 7 0 0 1 1.9-.8l.5-1.9h2.5l.5 1.9a7 7 0 0 1 1.9.8l1.7-1 1.8 1.8-1 1.7a7 7 0 0 1 .8 1.9l1.9.5v2.5Z',
    search: 'M10.5 4a6.5 6.5 0 0 1 5.1 10.5l4 4-1.4 1.4-4-4A6.5 6.5 0 1 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z',
    bell: 'M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22Zm7-5-1.8-2.2V10a5.2 5.2 0 0 0-4.2-5.1V3h-2v1.9A5.2 5.2 0 0 0 6.8 10v4.8L5 17v1h14v-1Z',
    help: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 17a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm1.2-4.8h-2v-.7c0-1.1.6-1.8 1.5-2.4.8-.6 1.3-1 1.3-1.8 0-1-.8-1.6-1.9-1.6-1 0-1.8.5-2.4 1.4L8.1 8c.9-1.4 2.2-2.2 4.1-2.2 2.3 0 4 1.3 4 3.4 0 1.6-.9 2.5-2 3.2-.7.5-1 .8-1 1.4v.4Z',
    moon: 'M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z',
    refresh: 'M17.7 6.3A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.2L13 11h8V3l-3.3 3.3Z',
    menu: 'M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z',
    command: 'M7 6a3 3 0 1 1 3 3H9v6h1a3 3 0 1 1-3 3 3 3 0 0 1 0-6h1V9H7a3 3 0 0 1 0-3Zm0 2a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm10-11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0-7h-1V9h1a3 3 0 1 0-3-3 3 3 0 0 0 0 6h1v3h-1a3 3 0 1 0 3-3Z'
  };

  return (
    <svg className="erp-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={paths[name] || paths.dashboard} />
    </svg>
  );
}

function formatDateTime(date) {
  return {
    date: date.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  };
}

export default function ERPLayout() {
  const location = useLocation();
  const { refresh, loading } = useAssets();
  const [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    getStoredAuth().then(auth => {
      if (mounted) setCurrentUser(auth?.user || null);
    }).catch(() => {
      if (mounted) setCurrentUser(null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const currentMeta = useMemo(() => {
    const exact = pageMeta[location.pathname];
    if (exact) return exact;
    if (location.pathname.startsWith('/assets/')) return ['Asset Details', 'Asset Master Record'];
    return ['Workspace', 'AMROD Console'];
  }, [location.pathname]);

  const clock = formatDateTime(now);
  const displayName = currentUser?.name || currentUser?.username || currentUser?.email || 'Administrator';
  const initials = String(displayName).split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'AD';

  return (
    <div className={`erp-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="erp-sidebar">
        <div className="erp-brand">
          <span className="erp-brand-mark">AM</span>
          <div>
            <strong>AMROD</strong>
            <small>Digital Asset Management</small>
          </div>
        </div>
        <button
          className="sidebar-collapse-button"
          type="button"
          onClick={() => setCollapsed(value => !value)}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          <Icon name="menu" />
          <span>Navigation</span>
        </button>
        <nav className="erp-nav" aria-label="ERP navigation">
          {navItems.map(section => (
            <div className="erp-nav-group" key={section.group}>
              <span className="erp-nav-group-label">{section.group}</span>
              {section.items.map(([label, to, icon]) => (
                <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : undefined}>
                  <Icon name={icon} />
                  <span>{label}</span>
                  {label === 'Audit Logs' && <em className="nav-badge">Live</em>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="erp-sidebar-status">
          <div>
            <span className="status-dot" />
            <strong>Production</strong>
          </div>
          <small>API systems operational</small>
        </div>
        <div className="erp-sidebar-footer">
          <span>AMROD Console</span>
          <strong>Digital Asset Management</strong>
          <small>v1.0.4 Enterprise</small>
        </div>
      </aside>
      <section className="erp-workspace">
        <header className="erp-topbar">
          <div className="topbar-title">
            <nav aria-label="Breadcrumb">
              <span>AMROD</span>
              <span>{currentMeta[1]}</span>
            </nav>
            <h1>{currentMeta[0]}</h1>
          </div>
          <div className="topbar-search" role="search">
            <Icon name="search" />
            <input aria-label="Global search" placeholder="Search assets, EPCs, sections, technicians" />
            <button type="button" aria-label="Open command palette">
              <Icon name="command" />
              <span>Ctrl K</span>
            </button>
          </div>
          <div className="topbar-actions">
            <button className="topbar-icon-button" type="button" onClick={refresh} disabled={loading} aria-label="Refresh workspace">
              <Icon name="refresh" />
            </button>
            <button className="topbar-icon-button" type="button" aria-label="Notifications">
              <Icon name="bell" />
              <span className="notification-dot" />
            </button>
            <button className="topbar-icon-button" type="button" aria-label="Help">
              <Icon name="help" />
            </button>
            <button className="topbar-icon-button" type="button" aria-label="Dark mode">
              <Icon name="moon" />
            </button>
            <div className="topbar-clock" aria-label="Current date and time">
              <strong>{clock.time}</strong>
              <span>{clock.date}</span>
            </div>
            <div className="topbar-user">
              <span className="user-avatar">{initials}</span>
              <div>
                <strong>{displayName}</strong>
                <span>{currentUser?.role || 'Admin'} · {currentUser?.department || 'Operations'}</span>
              </div>
            </div>
          </div>
        </header>
        <main className="erp-main">
          <Outlet />
        </main>
      </section>
    </div>
  );
}
