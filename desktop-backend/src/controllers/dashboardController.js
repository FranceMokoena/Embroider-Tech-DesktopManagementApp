// Direct database access implementation
import databaseService from '../services/databaseService.js';
import Technician from '../models/Technician.js';
import TaskSession from '../models/TaskSession.js';
import Screen from '../models/Screen.js';

// Get dashboard overview data
export const getDashboardOverview = async (req, res) => {
  try {
    // Fetch dashboard stats directly from database
    const [technicianStats, sessionStats, scanStats] = await Promise.all([
      Technician.getTechnicianStats(),
      TaskSession.getSessionStats(),
      Screen.getScanStats()
    ]);

    const overview = {
      overview: {
        totalUsers: technicianStats.data.totalTechnicians,
        totalSessions: sessionStats.data.totalSessions,
        totalScans: scanStats.data.totalScans,
        todayScans: scanStats.data.todayScans,
        weeklyScans: scanStats.data.weeklyScans
      },
      statusBreakdown: scanStats.data.statusBreakdown,
      departmentStats: technicianStats.data.departmentStats,
      recentActivity: {
        lastScans: [], // Will be populated separately if needed
        lastSessions: [] // Will be populated separately if needed
      }
    };
    
    res.json({
      success: true,
      data: overview
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
      const { dateFrom, dateTo, department, status, technician } = req.query;
      
      // Build filters for database query
      const filters = {};
      if (dateFrom && dateTo) {
        filters.startDate = dateFrom;
        filters.endDate = dateTo;
      }
      if (department) {
        filters.department = department;
      }
      if (status) {
        filters.status = status;
      }
      if (technician) {
        filters.technician = technician;
      }
      
      // Fetch scans directly from database
      const scansResponse = await Screen.getAllScans(filters);
      const scans = scansResponse.data || [];
      
      // Get scan statistics
      const scanStats = await Screen.getScanStats();
      const stats = {
        totalScans: scanStats.data.totalScans,
        reparable: scanStats.data.statusBreakdown.Reparable || 0,
        beyondRepair: scanStats.data.statusBreakdown['Beyond Repair'] || 0,
        healthy: scanStats.data.statusBreakdown.Healthy || 0
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
    const { department } = req.query;
    
    // Build filters for database query
    const filters = {};
    if (department) {
      filters.department = department;
    }
    
    // Fetch technicians directly from database
    const techniciansResponse = await Technician.getAllTechnicians(filters);
    const technicians = techniciansResponse.data || [];

    res.json({
      success: true,
      data: technicians
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
    const { dateFrom, dateTo, department, technician } = req.query;
    
    // Build filters for database query
    const filters = {};
    if (dateFrom && dateTo) {
      filters.startDate = dateFrom;
      filters.endDate = dateTo;
    }
    if (department) {
      filters.department = department;
    }
    if (technician) {
      filters.technician = technician;
    }
    
    // Fetch sessions directly from database
    const sessionsResponse = await TaskSession.getAllSessions(filters);
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
