import mobileApiService from '../services/mobileApiService.js';

// Get dashboard overview data
export const getDashboardOverview = async (req, res) => {
  try {
    // Get desktop service token directly
    const token = await mobileApiService.getAdminToken();
    
    // Fetch dashboard stats from mobile API
    const stats = await mobileApiService.getDashboardStats(token);
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Dashboard overview error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard overview',
      details: error.message 
    });
  }
};

  // Get scan history with statistics
  export const getScanHistory = async (req, res) => {
    try {
      // Get desktop service token directly
      const token = await mobileApiService.getAdminToken();

      const { dateFrom, dateTo, department, status, technician } = req.query;
      
      // Fetch scans from mobile API
      const scansResponse = await mobileApiService.getAllScans(token, {
        dateFrom,
        dateTo,
        department,
        status,
        technician
      });

      const scans = scansResponse.data || [];
      const stats = scansResponse.stats || {
        totalScans: scans.length,
        reparable: scans.filter(scan => scan.status === 'Reparable').length,
        beyondRepair: scans.filter(scan => scan.status === 'Beyond Repair').length,
        healthy: scans.filter(scan => scan.status === 'Healthy').length
      };

      res.json({
        success: true,
        stats,
        scans
      });

    } catch (error) {
      console.error('❌ Scan history error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch scan history',
        details: error.message 
      });
    }
  };

// Get all users
export const getUsers = async (req, res) => {
  try {
    // Get desktop service token directly
    const token = await mobileApiService.getAdminToken();

    const { department } = req.query;
    
    // Fetch users from mobile API
    const usersResponse = await mobileApiService.getAllUsers(token, { department });
    const users = usersResponse.data || [];

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('❌ Users fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    // Get desktop service token directly
    const token = await mobileApiService.getAdminToken();

    // For now, return a default admin profile
    // In the future, this could fetch from mobile API if needed
    const profile = {
      _id: 'desktop-admin',
      username: 'admin',
      role: 'admin',
      department: 'Management',
      name: 'Desktop',
      surname: 'Administrator',
      email: 'admin@embroidery-tech.com',
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      details: error.message 
    });
  }
};

// Get all sessions
export const getSessions = async (req, res) => {
  try {
    // Get desktop service token directly
    const token = await mobileApiService.getAdminToken();

    const { dateFrom, dateTo, department, technician } = req.query;
    
    // Fetch sessions from mobile API
    const sessionsResponse = await mobileApiService.getAllSessions(token, {
      dateFrom,
      dateTo,
      department,
      technician
    });
    const sessions = sessionsResponse.data || [];

    res.json({
      success: true,
      data: sessions
    });

  } catch (error) {
    console.error('❌ Sessions fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sessions',
      details: error.message 
    });
  }
};

// Get notifications
export const getNotifications = async (req, res) => {
  try {
    // Get desktop service token directly
    const token = await mobileApiService.getAdminToken();

    // For now, return empty notifications
    // In the future, this could fetch from mobile API if needed
    const notifications = [];

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('❌ Notifications fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch notifications',
      details: error.message 
    });
  }
};
