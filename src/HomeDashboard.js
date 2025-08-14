import React, { useEffect, useState } from 'react';
import './HomeDashboard.css';

const DESKTOP_API = 'https://embroider-tech-desktopmanagementapp.onrender.com';

function HomeDashboard() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [userProfile, setUserProfile] = useState(null);
  const [scanStats, setScanStats] = useState({ totalScans: 0, reparable: 0, beyondRepair: 0, healthy: 0 });
  const [scanHistory, setScanHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const authFetch = async (url, options = {}) => {
    if (!token) throw new Error('No JWT token found');
    return fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  };

  const fetchUserProfile = async () => {
    const res = await authFetch(`${DESKTOP_API}/api/auth/profile`);
    const data = await res.json();
    setUserProfile(data);
  };

  const fetchScanHistory = async () => {
    const res = await authFetch(`${DESKTOP_API}/api/mobile-scans`);
    const data = await res.json();

    // Compute stats
    const total = data.sessions?.reduce((sum, s) => sum + (s.scans?.length || 0), 0) || 0;
    const reparable = data.sessions?.flatMap(s => s.scans).filter(scan => scan.status === 'Reparable').length || 0;
    const beyondRepair = data.sessions?.flatMap(s => s.scans).filter(scan => scan.status === 'Beyond Repair').length || 0;
    const healthy = data.sessions?.flatMap(s => s.scans).filter(scan => scan.status === 'Healthy').length || 0;

    setScanStats({ totalScans: total, reparable, beyondRepair, healthy });

    // Flatten scans
    const flattened = data.sessions?.flatMap(s => s.scans.map(scan => ({
      _id: scan._id,
      barcode: scan.barcode,
      status: scan.status,
      date: scan.timestamp
    }))) || [];
    setScanHistory(flattened);
  };

  const fetchUsers = async () => {
    const res = await authFetch(`${DESKTOP_API}/api/admin/users`);
    const data = await res.json();
    setUsers(data || []);
  };

  const fetchNotifications = async () => {
    const res = await authFetch(`${DESKTOP_API}/api/messaging/notifications`);
    const data = await res.json();
    setNotifications(data || []);
  };

  useEffect(() => {
    if (!token) return;
    fetchUserProfile();
    fetchScanHistory();
    fetchUsers();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="dashboard-wrapper">
      <div className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <h2 className="sidebar-title">Admin Menu</h2>
        <a href="#overview">Dashboard Overview</a>
        <a href="#users">Technician Management</a>
        <a href="#scans">Scan History</a>
        <a href="#notifications">Notifications</a>
      </div>

      <div className="main-content">
        <header className="dashboard-header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? '❮' : '❯'}
          </button>
          <h1>EmbroideryTech Admin Dashboard</h1>
          {userProfile && <p>Welcome, {userProfile.username} ({userProfile.department || 'Admin'})</p>}
        </header>

        <section id="overview" className="dashboard-section">
          <h2>Dashboard Overview</h2>
          <div className="stats-cards">
            <div className="card">Total Scans: {scanStats.totalScans}</div>
            <div className="card">Reparable: {scanStats.reparable}</div>
            <div className="card">Beyond Repair: {scanStats.beyondRepair}</div>
            <div className="card">Healthy: {scanStats.healthy}</div>
          </div>
        </section>

        <section id="users" className="dashboard-section">
          <h2>Technician Management</h2>
          <ul>{users.map(u => <li key={u._id}>{u.username} ({u.department})</li>)}</ul>
        </section>

        <section id="scans" className="dashboard-section">
          <h2>Scan History</h2>
          <ul>{scanHistory.map(scan => <li key={scan._id}>{scan.barcode} - {scan.status} ({new Date(scan.date).toLocaleString()})</li>)}</ul>
        </section>

        <section id="notifications" className="dashboard-section">
          <h2>Notifications</h2>
          <ul>{notifications.map(n => <li key={n._id}>{n.message} ({new Date(n.date).toLocaleString()})</li>)}</ul>
        </section>
      </div>
    </div>
  );
}

export default HomeDashboard;
