import React, { useEffect, useState, useMemo } from 'react';
import './HomeDashboard.css';

const DESKTOP_API = process.env.REACT_APP_DESKTOP_API || 'http://localhost:5001';

function HomeDashboard() {
  const [token, setToken] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [scanStats, setScanStats] = useState({
    totalScans: 0,
    reparable: 0,
    beyondRepair: 0,
    healthy: 0
  });
  const [dashboardOverview, setDashboardOverview] = useState({
    totalUsers: 0,
    totalSessions: 0,
    totalScans: 0,
    todayScans: 0,
    weeklyScans: 0
  });
  const [departmentStats, setDepartmentStats] = useState({});
  const [scanHistory, setScanHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterTechnician, setFilterTechnician] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    // Get token from localStorage
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      setToken(authToken);
      initializeData(authToken);
    } else {
      setError('No authentication token found. Please login again.');
      setLoading(false);
    }
  }, []);

  const initializeData = async (authToken) => {
    try {
      fetchAllData(authToken);
    } catch (err) {
      console.error('Error initializing data:', err);
      setError('Connection error');
    }
  };

  const fetchAllData = async (authToken) => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, profileRes, scanHistoryRes, usersRes, sessionsRes, notificationsRes] = await Promise.all([
        fetch(`${DESKTOP_API}/api/dashboard/overview`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${DESKTOP_API}/api/dashboard/profile`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${DESKTOP_API}/api/dashboard/scan-history`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${DESKTOP_API}/api/dashboard/users`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${DESKTOP_API}/api/dashboard/sessions`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${DESKTOP_API}/api/dashboard/notifications`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        const overview = overviewData.data.overview;
        const statusBreakdown = overviewData.data.statusBreakdown;
        const deptStats = overviewData.data.departmentStats;
        
        setDashboardOverview(overview);
        setDepartmentStats(deptStats);
        
        setScanStats({
          totalScans: overview.totalScans,
          reparable: statusBreakdown.Reparable || 0,
          beyondRepair: statusBreakdown['Beyond Repair'] || 0,
          healthy: statusBreakdown.Healthy || 0
        });
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserProfile(profileData.data);
      }

      if (scanHistoryRes.ok) {
        const scanData = await scanHistoryRes.json();
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
      setError('Failed to fetch data from database');
    } finally {
      setLoading(false);
    }
  };

  const groupedScans = useMemo(() => {
    const filtered = scanHistory.filter(scan => {
      const techMatch = filterTechnician ? scan.technician?.includes(filterTechnician) : true;
      const deptMatch = filterDepartment
        ? users.find(u => `${u.name} ${u.surname}` === scan.technician)?.department?.includes(filterDepartment)
        : true;
      return techMatch && deptMatch;
    });

    return filtered.reduce((acc, scan) => {
      if (!acc[scan.technician]) acc[scan.technician] = [];
      acc[scan.technician].push(scan);
      return acc;
    }, {});
  }, [scanHistory, filterTechnician, filterDepartment, users]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Reparable': return '#ff9800';
      case 'Beyond Repair': return '#f44336';
      case 'Healthy': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Reparable': return '🔧';
      case 'Beyond Repair': return '❌';
      case 'Healthy': return '✅';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>🔄 Loading Dashboard Data...</h2>
          <p>Fetching real-time data from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <div className="error-container">
          <h2>❌ Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">🎛️ Admin Panel</h2>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Dashboard Overview
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Technician Management
          </button>
          <button 
            className={`nav-item ${activeTab === 'scans' ? 'active' : ''}`}
            onClick={() => setActiveTab('scans')}
          >
            📱 Scan History
          </button>
          <button 
            className={`nav-item ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            ⏱️ Active Sessions
          </button>
          <button 
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            🔔 Notifications
          </button>
        </nav>
      </div>

      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>🏭 EmbroideryTech Admin Dashboard</h1>
            {userProfile && (
              <p className="welcome-text">
                Welcome back, <strong>{userProfile.username}</strong> 
                {userProfile.department && ` (${userProfile.department})`}
              </p>
            )}
          </div>
          <div className="header-right">
            <div className="last-updated">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'overview' && (
            <div className="overview-section">
              <h2>📊 Dashboard Overview</h2>
              
              <div className="stats-grid">
                <div className="stat-card primary">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>Total Technicians</h3>
                    <div className="stat-value">{dashboardOverview.totalUsers}</div>
                  </div>
                </div>
                
                <div className="stat-card success">
                  <div className="stat-icon">📋</div>
                  <div className="stat-content">
                    <h3>Total Sessions</h3>
                    <div className="stat-value">{dashboardOverview.totalSessions}</div>
                  </div>
                </div>
                
                <div className="stat-card info">
                  <div className="stat-icon">📱</div>
                  <div className="stat-content">
                    <h3>Total Scans</h3>
                    <div className="stat-value">{dashboardOverview.totalScans}</div>
                  </div>
                </div>
                
                <div className="stat-card warning">
                  <div className="stat-icon">📅</div>
                  <div className="stat-content">
                    <h3>Today's Scans</h3>
                    <div className="stat-value">{dashboardOverview.todayScans}</div>
                  </div>
                </div>
                
                <div className="stat-card secondary">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <h3>Weekly Scans</h3>
                    <div className="stat-value">{dashboardOverview.weeklyScans}</div>
                  </div>
                </div>
              </div>

              <div className="scan-breakdown">
                <h3>📊 Scan Status Breakdown</h3>
                <div className="status-cards">
                  <div className="status-card healthy">
                    <div className="status-icon">✅</div>
                    <div className="status-content">
                      <h4>Healthy</h4>
                      <div className="status-value">{scanStats.healthy}</div>
                    </div>
                  </div>
                  
                  <div className="status-card reparable">
                    <div className="status-icon">🔧</div>
                    <div className="status-content">
                      <h4>Reparable</h4>
                      <div className="status-value">{scanStats.reparable}</div>
                    </div>
                  </div>
                  
                  <div className="status-card beyond-repair">
                    <div className="status-icon">❌</div>
                    <div className="status-content">
                      <h4>Beyond Repair</h4>
                      <div className="status-value">{scanStats.beyondRepair}</div>
                    </div>
                  </div>
                </div>
              </div>

              {Object.keys(departmentStats).length > 0 && (
                <div className="department-stats">
                  <h3>🏢 Department Statistics</h3>
                  <div className="department-grid">
                    {Object.entries(departmentStats).map(([dept, count]) => (
                      <div key={dept} className="department-card">
                        <div className="department-name">{dept}</div>
                        <div className="department-count">{count} technicians</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-section">
              <h2>👥 Technician Management</h2>
              <div className="users-grid">
                {users.map(user => (
                  <div key={user._id} className="user-card">
                    <div className="user-avatar">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'T'}
                    </div>
                    <div className="user-info">
                      <h3>{user.name} {user.surname}</h3>
                      <p className="user-email">{user.email}</p>
                      <p className="user-department">🏢 {user.department}</p>
                      <p className="user-role">👨‍💼 Technician</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'scans' && (
            <div className="scans-section">
              <h2>📱 Scan History</h2>
              
              <div className="filters">
                <input
                  type="text"
                  placeholder="🔍 Filter by Technician"
                  value={filterTechnician}
                  onChange={e => setFilterTechnician(e.target.value)}
                  className="filter-input"
                />
                <input
                  type="text"
                  placeholder="🏢 Filter by Department"
                  value={filterDepartment}
                  onChange={e => setFilterDepartment(e.target.value)}
                  className="filter-input"
                />
              </div>

              {Object.keys(groupedScans).length === 0 ? (
                <div className="no-data">
                  <div className="no-data-icon">📱</div>
                  <h3>No scans found</h3>
                  <p>When technicians perform scans, they will appear here.</p>
                </div>
              ) : (
                <div className="scans-container">
                  {Object.entries(groupedScans).map(([technician, scans]) => (
                    <div key={technician} className="technician-scans">
                      <h3>👨‍💼 {technician}</h3>
                      <div className="scans-grid">
                        {scans.map((scan, idx) => (
                          <div key={idx} className="scan-card" style={{borderLeftColor: getStatusColor(scan.status)}}>
                            <div className="scan-header">
                              <span className="scan-barcode">📋 {scan.barcode}</span>
                              <span className="scan-status" style={{color: getStatusColor(scan.status)}}>
                                {getStatusIcon(scan.status)} {scan.status}
                              </span>
                            </div>
                            <div className="scan-time">
                              📅 {new Date(scan.timestamp || scan.date).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="sessions-section">
              <h2>⏱️ Active Sessions</h2>
              {sessions.length === 0 ? (
                <div className="no-data">
                  <div className="no-data-icon">⏱️</div>
                  <h3>No active sessions</h3>
                  <p>When technicians start scanning sessions, they will appear here.</p>
                </div>
              ) : (
                <div className="sessions-grid">
                  {sessions.map((session, idx) => (
                    <div key={idx} className="session-card">
                      <div className="session-header">
                        <h3>📋 Session {session._id?.slice(-8) || idx + 1}</h3>
                        <span className={`session-status ${session.endTime ? 'completed' : 'active'}`}>
                          {session.endTime ? '✅ Completed' : '🔄 Active'}
                        </span>
                      </div>
                      <div className="session-details">
                        <p><strong>👨‍💼 Technician:</strong> {session.technician}</p>
                        <p><strong>🏢 Department:</strong> {session.department}</p>
                        <p><strong>🕐 Start Time:</strong> {new Date(session.startTime).toLocaleString()}</p>
                        {session.endTime && (
                          <p><strong>🕐 End Time:</strong> {new Date(session.endTime).toLocaleString()}</p>
                        )}
                        <p><strong>📱 Scan Count:</strong> {session.scanCount || 0}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="notifications-section">
              <h2>🔔 Notifications</h2>
              {notifications.length === 0 ? (
                <div className="no-data">
                  <div className="no-data-icon">🔔</div>
                  <h3>No notifications</h3>
                  <p>System notifications will appear here.</p>
                </div>
              ) : (
                <div className="notifications-list">
                  {notifications.map((note, idx) => (
                    <div key={idx} className="notification-card">
                      <div className="notification-icon">📢</div>
                      <div className="notification-content">
                        <p>{note.message}</p>
                        <span className="notification-time">
                          {new Date(note.date || note.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomeDashboard;
