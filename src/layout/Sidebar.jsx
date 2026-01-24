import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
  { label: 'History', path: '/history', icon: '🕑' },
  { label: 'All Screens', path: '/all-screens', icon: '📡' },
  { label: 'Technicians', path: '/technicians', icon: '👷' },
  { label: 'Departments', path: '/departments', icon: '🏢' },
  { label: 'Notifications', path: '/notifications', icon: '🔔' },
  { label: 'Sessions', path: '/sessions', icon: '📋' },
  { label: 'Insights', path: '/insights', icon: '📘' }
];

const Sidebar = ({ collapsed, onToggle }) => (
  <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`}>
    <div className="sidebar__logo">
      <div className="sidebar__logo-icon">ES</div>
      {!collapsed && <div className="sidebar__logo-text">Embroidery Ops</div>}
    </div>
    <nav className="sidebar__nav">
      {menuItems.map((item) => (
        <NavLink
          to={item.path}
          key={item.path}
          className={({ isActive }) => `sidebar__nav-item ${isActive ? 'is-active' : ''}`}
          title={collapsed ? item.label : undefined}
        >
          <div className="sidebar__nav-icon">{item.icon}</div>
          {!collapsed && <span>{item.label}</span>}
        </NavLink>
      ))}
    </nav>
    <button className="sidebar__footer" onClick={onToggle}>
      {collapsed ? 'Expand' : 'Collapse'}
    </button>
  </aside>
);

export default Sidebar;
