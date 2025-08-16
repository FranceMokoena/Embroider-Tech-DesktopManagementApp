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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const toggleSidebar = () => {
    console.log('Toggling sidebar from:', sidebarOpen, 'to:', !sidebarOpen);
    setSidebarOpen(!sidebarOpen);
  };
  const handleLogout = () => {
    // Clear authentication token
    localStorage.removeItem('authToken');
    // Redirect to admin login
    window.location.href = '/admin-login';
  };
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownOpen && !event.target.closest('.user-dropdown')) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

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
      {/* Mobile Overlay */}
      <div className={`mobile-overlay ${sidebarOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
      
      <div className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">⚙️</div>
            <h2 className="sidebar-title">Admin Panel</h2>
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <div className={`hamburger ${sidebarOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Technicians</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'scans' ? 'active' : ''}`}
            onClick={() => setActiveTab('scans')}
          >
            <span className="nav-icon">📱</span>
            <span className="nav-text">Scan History</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            <span className="nav-icon">⏱️</span>
            <span className="nav-text">Sessions</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <span className="nav-icon">🔔</span>
            <span className="nav-text">Notifications</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="connection-status">
            <div className="status-indicator online"></div>
            <span>Live Connection</span>
          </div>
        </div>
      </div>

      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={toggleSidebar}>
              <div className={`hamburger ${sidebarOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
            <div className="header-title">
              <h1>🏭 EmbroideryTech Admin</h1>
              {userProfile && (
                <p className="welcome-text">
                  Welcome back, <strong>{userProfile.username}</strong> 
                  {userProfile.department && ` (${userProfile.department})`}
                </p>
              )}
            </div>
          </div>
          <div className="header-right">
            <div className="header-actions">
              <button className="refresh-btn" onClick={() => fetchAllData(token)} title="Refresh Data">
                🔄
              </button>
              <div className="notifications-dropdown">
                <button className="notifications-btn" title="Notifications">
                  🔔
                  {notifications.length > 0 && (
                    <span className="notification-badge">{notifications.length}</span>
                  )}
                </button>
              </div>
              <div className="user-dropdown">
                <button 
                  className="user-btn" 
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <div className="user-avatar">
                    {userProfile?.username?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <span className="user-name">{userProfile?.username || 'Admin'}</span>
                  <span className={`dropdown-arrow ${userDropdownOpen ? 'rotated' : ''}`}>▼</span>
                </button>
                
                {userDropdownOpen && (
                  <div className="user-panel">
                    <div className="user-info">
                      <strong>{userProfile?.username || 'Admin'}</strong>
                      <span>{userProfile?.department || 'Administrator'}</span>
                    </div>
                    <div className="user-actions">
                      <button className="logout-btn" onClick={handleLogout}>
                        🚪 Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="last-updated">
              <span className="update-indicator">🔄</span>
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="section-header">
                <h2>📊 Dashboard Overview</h2>
                <div className="section-actions">
                  <button className="export-btn">
                    📥 Export Data
                  </button>
                  <button className="settings-btn">
                    ⚙️ Settings
                  </button>
                </div>
              </div>
              
              <div className="stats-grid">
                <div className="stat-card primary">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>Total Technicians</h3>
                    <div className="stat-value">{dashboardOverview.totalUsers}</div>
                    <div className="stat-trend positive">↗️ +12% this month</div>
                  </div>
                </div>
                
                <div className="stat-card success">
                  <div className="stat-icon">📋</div>
                  <div className="stat-content">
                    <h3>Total Sessions</h3>
                    <div className="stat-value">{dashboardOverview.totalSessions}</div>
                    <div className="stat-trend positive">↗️ +8% this week</div>
                  </div>
                </div>
                
                <div className="stat-card info">
                  <div className="stat-icon">📱</div>
                  <div className="stat-content">
                    <h3>Total Scans</h3>
                    <div className="stat-value">{dashboardOverview.totalScans}</div>
                    <div className="stat-trend positive">↗️ +15% today</div>
                  </div>
                </div>
                
                <div className="stat-card warning">
                  <div className="stat-icon">📅</div>
                  <div className="stat-content">
                    <h3>Today's Scans</h3>
                    <div className="stat-value">{dashboardOverview.todayScans}</div>
                    <div className="stat-trend neutral">→ No change</div>
                  </div>
                </div>
                
                <div className="stat-card secondary">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <h3>Weekly Scans</h3>
                    <div className="stat-value">{dashboardOverview.weeklyScans}</div>
                    <div className="stat-trend positive">↗️ +22% this week</div>
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
                      <div className="status-percentage">
                        {scanStats.totalScans > 0 ? Math.round((scanStats.healthy / scanStats.totalScans) * 100) : 0}%
                      </div>
                      <div className="status-bar">
                        <div 
                          className="status-fill" 
                          style={{width: `${scanStats.totalScans > 0 ? (scanStats.healthy / scanStats.totalScans) * 100 : 0}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="status-card reparable">
                    <div className="status-icon">🔧</div>
                    <div className="status-content">
                      <h4>Reparable</h4>
                      <div className="status-value">{scanStats.reparable}</div>
                      <div className="status-percentage">
                        {scanStats.totalScans > 0 ? Math.round((scanStats.reparable / scanStats.totalScans) * 100) : 0}%
                      </div>
                      <div className="status-bar">
                        <div 
                          className="status-fill" 
                          style={{width: `${scanStats.totalScans > 0 ? (scanStats.reparable / scanStats.totalScans) * 100 : 0}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="status-card beyond-repair">
                    <div className="status-icon">❌</div>
                    <div className="status-content">
                      <h4>Beyond Repair</h4>
                      <div className="status-value">{scanStats.beyondRepair}</div>
                      <div className="status-percentage">
                        {scanStats.totalScans > 0 ? Math.round((scanStats.beyondRepair / scanStats.totalScans) * 100) : 0}%
                      </div>
                      <div className="status-bar">
                        <div 
                          className="status-fill" 
                          style={{width: `${scanStats.totalScans > 0 ? (scanStats.beyondRepair / scanStats.totalScans) * 100 : 0}%`}}
                        ></div>
                      </div>
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
              <div className="section-header">
                <h2>👥 Technician Management</h2>
                <div className="section-actions">
                  <button className="add-user-btn">
                    ➕ Add Technician
                  </button>
                  <button className="export-btn">
                    📥 Export List
                  </button>
                </div>
              </div>
              <div className="users-grid">
                {users.map(user => (
                  <div key={user._id} className="user-card">
                    <div className="user-avatar">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'T'}
                    </div>
                    <div className="user-info">
                      <h3>{user.technician}</h3>
                      <p className="user-email">{user.email}</p>
                      <p className="user-department">🏢 {user.department}</p>
                      <p className="user-role">👨‍💼 Technician</p>
                    </div>
                    <div className="user-actions">
                      <button className="action-btn edit" title="Edit">✏️</button>
                      <button className="action-btn view" title="View Details">👁️</button>
                      <button className="action-btn delete" title="Delete">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'scans' && (
            <div className="scans-section">
              <div className="section-header">
                <h2>📱 Scan History</h2>
                <div className="section-actions">
                  <button className="filter-btn">
                    🔍 Advanced Filter
                  </button>
                  <button className="export-btn">
                    📥 Export Data
                  </button>
                </div>
              </div>
              
              <div className="filters">
                <div className="filter-group">
                  <label>🔍 Filter by Technician</label>
                  <input
                    type="text"
                    placeholder="Enter technician name..."
                    value={filterTechnician}
                    onChange={e => setFilterTechnician(e.target.value)}
                    className="filter-input"
                  />
                </div>
                <div className="filter-group">
                  <label>🏢 Filter by Department</label>
                  <input
                    type="text"
                    placeholder="Enter department name..."
                    value={filterDepartment}
                    onChange={e => setFilterDepartment(e.target.value)}
                    className="filter-input"
                  />
                </div>
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
                      <div className="technician-header">
                        <h3>👨‍💼 {technician}</h3>
                        <div className="technician-stats">
                          <span className="stat healthy">✅ {scans.filter(s => s.status === 'Healthy').length}</span>
                          <span className="stat reparable">🔧 {scans.filter(s => s.status === 'Reparable').length}</span>
                          <span className="stat beyond-repair">❌ {scans.filter(s => s.status === 'Beyond Repair').length}</span>
                        </div>
                      </div>
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
                            <div className="scan-actions">
                              <button className="scan-action-btn">👁️ View</button>
                              <button className="scan-action-btn">📋 Details</button>
                              <button className="scan-action-btn">📤 Export</button>
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
              <div className="section-header">
                <h2>⏱️ Active Sessions</h2>
                <div className="section-actions">
                  <button className="filter-btn">
                    🔍 Filter Sessions
                  </button>
                  <button className="export-btn">
                    📥 Export Data
                  </button>
                </div>
              </div>
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
                      <div className="session-actions">
                        <button className="session-action-btn">👁️ View Details</button>
                        <button className="session-action-btn">📊 Analytics</button>
                        <button className="session-action-btn">📤 Export</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="notifications-section">
              <div className="section-header">
                <h2>🔔 Notifications</h2>
                <div className="section-actions">
                  <button className="mark-all-read-btn">
                    ✅ Mark All Read
                  </button>
                  <button className="clear-all-btn">
                    🗑️ Clear All
                  </button>
                </div>
              </div>
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
  );}

export default HomeDashboard;
