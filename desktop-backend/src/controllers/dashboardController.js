import mobileApiService from '../services/mobileApiService.js';

// Get dashboard overview data
export const getDashboardOverview = async (req, res) => {
  try {
    const token = req.headers['mobile-token'];
    if (!token) {
      return res.status(401).json({ error: 'Mobile backend token required' });
    }

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
      const token = req.headers['mobile-token'];
      if (!token) {
        return res.status(401).json({ error: 'Mobile backend token required' });
      }

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
      
      // Calculate statistics based on your mobile app's status values
      const stats = {
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
    const token = req.headers['mobile-token'];
    if (!token) {
      return res.status(401).json({ error: 'Mobile backend token required' });
    }

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
    const token = req.headers['mobile-token'];
    if (!token) {
      return res.status(401).json({ error: 'Mobile backend token required' });
    }

    // Fetch user profile from mobile API
    const profile = await mobileApiService.getProfile(token);

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user profile',
      details: error.message 
    });
  }
};

// Get sessions
export const getSessions = async (req, res) => {
  try {
    const token = req.headers['mobile-token'];
    if (!token) {
      return res.status(401).json({ error: 'Mobile backend token required' });
    }

    const { dateFrom, dateTo, department } = req.query;
    
    // Fetch sessions from mobile API
    const sessionsResponse = await mobileApiService.getAllSessions(token, {
      dateFrom,
      dateTo,
      department
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

// Get notifications (admin alerts from mobile app)
export const getNotifications = async (req, res) => {
  try {
    const token = req.headers['mobile-token'];
    if (!token) {
      return res.status(401).json({ error: 'Mobile backend token required' });
    }

    // For now, we'll create sample notifications based on recent scans
    // In the future, this could connect to a real notifications endpoint
    const scansResponse = await mobileApiService.getAllScans(token, {});
    const scans = scansResponse.data || [];
    
    // Generate notifications based on recent activity
    const notifications = [];
    const recentScans = scans
      .filter(scan => new Date(scan.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      .slice(0, 10);
    
    recentScans.forEach(scan => {
      if (scan.status === 'Beyond Repair') {
        notifications.push({
          id: `notif_${scan._id}`,
          message: `Screen ${scan.barcode} marked as Beyond Repair by ${scan.technician}`,
          type: 'warning',
          timestamp: scan.timestamp,
          technician: scan.technician,
          department: scan.department
        });
      } else if (scan.status === 'Reparable') {
        notifications.push({
          id: `notif_${scan._id}`,
          message: `Screen ${scan.barcode} needs repair - assigned to ${scan.technician}`,
          type: 'info',
          timestamp: scan.timestamp,
          technician: scan.technician,
          department: scan.department
        });
      }
    });

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
