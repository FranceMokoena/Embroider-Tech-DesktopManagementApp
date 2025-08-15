import React, { useEffect, useState, useMemo } from 'react';
import './HomeDashboard.css';

const DESKTOP_API = process.env.REACT_APP_DESKTOP_API || 'https://embroider-tech-desktopmanagementapp.onrender.com';

function HomeDashboard({ token: initialToken }) {
  const [token, setToken] = useState(initialToken || '');
  const [mobileToken, setMobileToken] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [scanStats, setScanStats] = useState({
    totalScans: 0,
    reparable: 0,
    beyondRepair: 0,
    healthy: 0
  });
  const [scanHistory, setScanHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterTechnician, setFilterTechnician] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const savedToken = initialToken || localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      // Get mobile token from desktop backend
      getMobileToken(savedToken);
    }
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

  // Get mobile token from desktop backend
  const getMobileToken = async (desktopToken) => {
    try {
      const response = await fetch(`${DESKTOP_API}/api/auth/mobile-token`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${desktopToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMobileToken(data.mobileToken);
        // Fetch data once we have the mobile token
        fetchAllData(data.mobileToken);
      } else {
        console.error('Failed to get mobile token');
        setError('Failed to connect to mobile backend');
      }
    } catch (err) {
      console.error('Error getting mobile token:', err);
      setError('Connection error');
    }
  };

  // Fetch all data from mobile API through desktop backend
  const fetchAllData = async (mobileToken) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data in parallel
      const [profileRes, scanHistoryRes, usersRes, sessionsRes, notificationsRes] = await Promise.all([
        fetch(`${DESKTOP_API}/api/dashboard/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'mobile-token': mobileToken,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${DESKTOP_API}/api/dashboard/scan-history`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'mobile-token': mobileToken,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${DESKTOP_API}/api/dashboard/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'mobile-token': mobileToken,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${DESKTOP_API}/api/dashboard/sessions`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'mobile-token': mobileToken,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${DESKTOP_API}/api/dashboard/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'mobile-token': mobileToken,
            'Content-Type': 'application/json'
          }
        })
      ]);

      // Process responses
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserProfile(profileData.data);
      }

      if (scanHistoryRes.ok) {
        const scanData = await scanHistoryRes.json();
        setScanStats(scanData.stats);
        setScanHistory(scanData.scans);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.data);
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData.data);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data from mobile backend');
    } finally {
      setLoading(false);
    }
  };

  // Fetch functions (keeping for backward compatibility)
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

  // Remove the old useEffect since we now fetch data when we get the mobile token
  // useEffect(() => {
  //   if (!token) return;
  //   fetchUserProfile();
  //   fetchScanHistory();
  //   fetchUsers();
  //   fetchNotifications();
  //   const interval = setInterval(fetchNotifications, 30000);
  //   return () => clearInterval(interval);
  // }, [token]);

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

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="loading-container">
          <h2>Loading Dashboard Data...</h2>
          <p>Fetching data from mobile application...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <div className="error-container">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <h2 className="sidebar-title">Admin Menu</h2>
        <a href="#overview">Dashboard Overview</a>
        <a href="#users">Technician Management</a>
        <a href="#scans">Scan History</a>
        <a href="#sessions">Active Sessions</a>
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
                    {scan.barcode} - {scan.status} ({new Date(scan.timestamp || scan.date).toLocaleString()})
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section id="sessions">
          <h2>Active Sessions</h2>
          {sessions.length === 0 ? (
            <p>No active sessions found.</p>
          ) : (
            <div className="sessions-grid">
              {sessions.map((session, idx) => (
                <div key={idx} className="session-card">
                  <h3>Session {session._id?.slice(-8) || idx + 1}</h3>
                  <p><strong>Technician:</strong> {session.technician}</p>
                  <p><strong>Department:</strong> {session.department}</p>
                  <p><strong>Start Time:</strong> {new Date(session.startTime).toLocaleString()}</p>
                  <p><strong>Status:</strong> {session.endTime ? 'Completed' : 'Active'}</p>
                  {session.endTime && (
                    <p><strong>End Time:</strong> {new Date(session.endTime).toLocaleString()}</p>
                  )}
                  <p><strong>Scan Count:</strong> {session.scanCount || 0}</p>
                </div>
              ))}
            </div>
          )}
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
