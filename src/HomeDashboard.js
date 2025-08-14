import React, { useEffect, useState } from 'react';
import './HomeDashboard.css';

// Two separate APIs
const MOBILE_API = 'https://embroider-scann-app.onrender.com';
const DESKTOP_API = 'https://embroider-tech-desktopmanagementapp.onrender.com';

function HomeDashboard({ token }) {
  const [userProfile, setUserProfile] = useState(null);
  const [scanStats, setScanStats] = useState({
    totalScans: 0,
    reparable: 0,
    beyondRepair: 0,
    healthy: 0
  });
  const [scanHistory, setScanHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Fetch admin profile from desktop backend
  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${DESKTOP_API}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUserProfile(await res.json());
    } catch (err) {
      console.error('Error fetching profile', err);
    }
  };

  // Fetch scan history from mobile backend
  const fetchScanHistory = async () => {
    try {
      const res = await fetch(`${MOBILE_API}/api/scan/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setScanStats({
          totalScans: data.totalScans || 0,
          reparable: data.totalReparable || 0,
          beyondRepair: data.totalBeyondRepair || 0,
          healthy: data.totalHealthy || 0
        });
        if (data.sessions) {
          setScanHistory(
            data.sessions.flatMap(session =>
              session.scans.map(scan => ({
                ...scan,
                date: scan.timestamp,
                barcode: scan.barcode || scan.screenId,
                status: scan.status
              }))
            )
          );
        }
      }
    } catch (err) {
      console.error('Error fetching scan history', err);
    }
  };

  // Fetch users from desktop backend
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${DESKTOP_API}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error('Error fetching users', err);
    }
  };

  // Fetch notifications from desktop backend
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${DESKTOP_API}/api/messaging/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setNotifications(await res.json());
    } catch (err) {
      console.error('Error fetching notifications', err);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchScanHistory();
    fetchUsers();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // refresh notifications every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <h2 className="sidebar-title">Admin Menu</h2>
        <a href="#overview">Dashboard Overview</a>
        <a href="#users">Technician Management</a>
        <a href="#scans">Scan History</a>
        <a href="#notifications">Notifications</a>
        <a href="#logout">Logout</a>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="dashboard-header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? '❮' : '❯'}
          </button>
          <h1>EmbroideryTech Admin Dashboard</h1>
          {userProfile && <p>Welcome, {userProfile.username} ({userProfile.role})</p>}
        </header>

        {/* Stats */}
        <section id="overview" className="dashboard-section">
          <h2>Dashboard Overview</h2>
          <div className="stats-cards">
            <div className="card">Total Scans: {scanStats.totalScans}</div>
            <div className="card">Reparable: {scanStats.reparable}</div>
            <div className="card">Beyond Repair: {scanStats.beyondRepair}</div>
            <div className="card">Healthy: {scanStats.healthy}</div>
          </div>
        </section>

        {/* Users */}
        <section id="users" className="dashboard-section">
          <h2>Technician Management</h2>
          <ul>
            {users.map(u => (
              <li key={u._id}>{u.username} ({u.department})</li>
            ))}
          </ul>
        </section>

        {/* Scans */}
        <section id="scans" className="dashboard-section">
          <h2>Scan History</h2>
          <ul>
            {scanHistory.map(scan => (
              <li key={scan._id}>
                {scan.barcode} - {scan.status} ({new Date(scan.date).toLocaleString()})
              </li>
            ))}
          </ul>
        </section>

        {/* Notifications */}
        <section id="notifications" className="dashboard-section">
          <h2>Notifications</h2>
          <ul>
            {notifications.map(n => (
              <li key={n._id}>{n.message} ({new Date(n.date).toLocaleString()})</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default HomeDashboard;
