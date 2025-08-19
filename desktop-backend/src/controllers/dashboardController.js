// Direct database access implementation
import databaseService from '../services/databaseService.js';

// Get dashboard overview data
export const getDashboardOverview = async (req, res) => {
  try {
    const db = await databaseService.getDb();
    
    // Get collections
    const usersCollection = db.collection('users');
    const taskSessionsCollection = db.collection('tasksessions');
    const screensCollection = db.collection('screens');
    
    // Fetch real data from database
    const [totalUsers, totalSessions, totalScans, todayScans, weeklyScans, statusBreakdown, departmentStats] = await Promise.all([
      usersCollection.countDocuments(),
      taskSessionsCollection.countDocuments(),
      screensCollection.countDocuments(),
      screensCollection.countDocuments({
        timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      screensCollection.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      screensCollection.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).toArray(),
      usersCollection.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } }
      ]).toArray()
    ]);

    // Process status breakdown
    const statusBreakdownObj = {};
    statusBreakdown.forEach(item => {
      statusBreakdownObj[item._id] = item.count;
    });

    // Process department stats
    const departmentStatsObj = {};
    departmentStats.forEach(item => {
      departmentStatsObj[item._id] = item.count;
    });

    const overview = {
      overview: {
        totalUsers,
        totalSessions,
        totalScans,
        todayScans,
        weeklyScans
      },
      statusBreakdown: statusBreakdownObj,
      departmentStats: departmentStatsObj
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

// Get scan history
export const getScanHistory = async (req, res) => {
  try {
    const db = await databaseService.getDb();
    const screensCollection = db.collection('screens');
    
    // Fetch real scan data with technician info
    const scans = await screensCollection.aggregate([
      {
        $lookup: {
          from: 'tasksessions',
          localField: 'sessionId',
          foreignField: '_id',
          as: 'session'
        }
      },
      {
        $unwind: {
          path: '$session',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'session.technician',
          foreignField: '_id',
          as: 'technicianInfo'
        }
      },
      {
        $unwind: {
          path: '$technicianInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          technician: '$technicianInfo.username',
          department: '$technicianInfo.department'
        }
      },
      {
        $project: {
          barcode: 1,
          status: 1,
          technician: 1,
          department: 1,
          timestamp: 1,
          date: 1
        }
      },
      { $sort: { timestamp: -1 } }
    ]).toArray();

    res.json({
      success: true,
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
    const db = await databaseService.getDb();
    const usersCollection = db.collection('users');
    
    // Fetch real user data
    const users = await usersCollection.find({}, {
      projection: {
        _id: 1,
        username: 1,
        name: 1,
        surname: 1,
        email: 1,
        department: 1
      }
    }).toArray();

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
    const db = await databaseService.getDb();
    const taskSessionsCollection = db.collection('tasksessions');
    
    // Fetch real session data with technician info
    const sessions = await taskSessionsCollection.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'technician',
          foreignField: '_id',
          as: 'technicianInfo'
        }
      },
      {
        $lookup: {
          from: 'screens',
          localField: '_id',
          foreignField: 'sessionId',
          as: 'scans'
        }
      },
      {
        $addFields: {
          technician: { $arrayElemAt: ['$technicianInfo.username', 0] },
          department: { $arrayElemAt: ['$technicianInfo.department', 0] },
          scanCount: { $size: '$scans' }
        }
      },
      {
        $project: {
          _id: 1,
          technician: 1,
          department: 1,
          startTime: 1,
          endTime: 1,
          scanCount: 1
        }
      },
      { $sort: { startTime: -1 } }
    ]).toArray();

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
    // Empty notifications for now - can be enhanced later
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
