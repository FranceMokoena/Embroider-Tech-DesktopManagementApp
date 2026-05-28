import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './ERPLayout.css';

const navItems = [
  ['Dashboard', '/dashboard'],
  ['Asset Registry', '/assets'],
  ['RFID Verification', '/verify'],
  ['Sections', '/sections'],
  ['Transfers', '/transfers'],
  ['Reports', '/reports'],
  ['Audit Logs', '/audit'],
  ['Users & Roles', '/users'],
  ['Settings', '/settings']
];

export default function ERPLayout() {
  return (
    <div className="erp-shell">
      <aside className="erp-sidebar">
        <div className="erp-brand">
          <span className="erp-brand-mark">ET</span>
          <div>
            <strong>EmbroideryTech</strong>
            <small>RFID Asset ERP</small>
          </div>
        </div>
        <nav className="erp-nav" aria-label="ERP navigation">
          {navItems.map(([label, to]) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : undefined}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="erp-sidebar-footer">
          <span>Production Console</span>
          <strong>EPC-first registry</strong>
        </div>
      </aside>
      <main className="erp-main">
        <Outlet />
      </main>
    </div>
  );
}
