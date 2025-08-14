import React, { useEffect, useState, useMemo } from 'react';
import './HomeDashboard.css';

const DESKTOP_API = process.env.REACT_APP_DESKTOP_API || 'https://embroider-tech-desktopmanagementapp.onrender.com';

function HomeDashboard({ token: initialToken }) {
  const [token, setToken] = useState(initialToken || '');
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
  const [filterTechnician, setFilterTechnician] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const savedToken = initialToken || localStorage.getItem('authToken');
    if (savedToken) setToken(savedToken);
  }, [initialToken]);

  const authFetch = async (url, options = {}) => {
    if (!token) throw new Error('No JWT token found');
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  };

  // Fetch functions
  const fetchUserProfile = async () => {
    try {
      const res = await authFetch(`${DESKTOP_API}/api/auth/profile`);
      if (!res.ok) return console.error('Failed to fetch profile', res.status);
      const data = await res.json();
      setUserProfile(data);
    } catch (err) {
      console.error('Error fetching profile', err);
    }
  };

  const fetchScanHistory = async () => {
    try {
      const res = await authFetch(`${DESKTOP_API}/api/scan-history`);
      if (!res.ok) return console.error('Failed to fetch scan history', res.status);
      const data = await res.json();
      setScanStats(data.stats || { totalScans: 0, reparable: 0, beyondRepair: 0, healthy: 0 });
      setScanHistory(data.scans || []);
    } catch (err) {
      console.error('Error fetching scan history', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await authFetch(`${DESKTOP_API}/api/admin/users`);
      if (!res.ok) return console.error('Failed to fetch users', res.status);
      const data = await res.json();
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await authFetch(`${DESKTOP_API}/api/messaging/notifications`);
      if (!res.ok) return console.error('Failed to fetch notifications', res.status);
      const data = await res.json();
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications', err);
    }
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

  // Filtered & grouped scans by technician
  const groupedScans = useMemo(() => {
    const filtered = scanHistory.filter(scan => {
      const techMatch = filterTechnician ? scan.technician.includes(filterTechnician) : true;
      const deptMatch = filterDepartment
        ? users.find(u => `${u.name} ${u.surname}` === scan.technician)?.department.includes(filterDepartment)
        : true;
      return techMatch && deptMatch;
    });

    return filtered.reduce((acc, scan) => {
      if (!acc[scan.technician]) acc[scan.technician] = [];
      acc[scan.technician].push(scan);
      return acc;
    }, {});
  }, [scanHistory, filterTechnician, filterDepartment, users]);

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
          {userProfile && (
            <p>
              Welcome, {userProfile.username} ({userProfile.department || 'Admin'})
            </p>
          )}
        </header>

        <section id="overview">
          <h2>Overview</h2>
          <p>Total Scans: {scanStats.totalScans}</p>
          <p>Reparable Screens: {scanStats.reparable}</p>
          <p>Beyond Repair: {scanStats.beyondRepair}</p>
          <p>Healthy Screens: {scanStats.healthy}</p>
        </section>

        <section id="users">
          <h2>Technicians</h2>
          <ul>
            {users.map(u => (
              <li key={u._id}>
                {u.name} {u.surname} - {u.department}
              </li>
            ))}
          </ul>
        </section>

        <section id="scans">
          <h2>Scan History</h2>
          <div className="filters">
            <input
              type="text"
              placeholder="Filter by Technician"
              value={filterTechnician}
              onChange={e => setFilterTechnician(e.target.value)}
            />
            <input
              type="text"
              placeholder="Filter by Department"
              value={filterDepartment}
              onChange={e => setFilterDepartment(e.target.value)}
            />
          </div>

          {Object.keys(groupedScans).length === 0 && <p>No scans found for selected filters.</p>}

          {Object.entries(groupedScans).map(([technician, scans]) => (
            <div key={technician} className="technician-group">
              <h3>{technician}</h3>
              <ul>
                {scans.map((scan, idx) => (
                  <li key={idx}>
                    {scan.barcode} - {scan.status} ({new Date(scan.date).toLocaleString()})
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section id="notifications">
          <h2>Notifications</h2>
          <ul>
            {notifications.map((note, idx) => (
              <li key={idx}>
                {note.message} ({new Date(note.date || note.timestamp).toLocaleString()})
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default HomeDashboard;
