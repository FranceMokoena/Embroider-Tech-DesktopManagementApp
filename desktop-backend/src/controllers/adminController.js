import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import databaseService from '../services/databaseService.js';
import mobileApiService from '../services/mobileApiService.js';
// Direct database access will be implemented here

const getMobileTokenFromRequest = (req, res) => {
  const token = req.headers['mobile-token'];
  if (!token) {
    res.status(401).json({ error: 'Mobile backend token required' });
    return null;
  }
  return token;
};

const flattenScans = (sessions = []) =>
  sessions.flatMap((session) => (Array.isArray(session.scans) ? session.scans : []));

const normalizeIdentifier = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && typeof value.toString === 'function') {
    return value.toString();
  }

  try {
    return String(value);
  } catch {
    return null;
  }
};

const getSessionTechnicianKey = (session) => {
  if (!session) {
    return null;
  }

  if (session.technician) {
    if (typeof session.technician === 'object') {
      return (
        normalizeIdentifier(session.technician._id) ||
        normalizeIdentifier(session.technician.id) ||
        normalizeIdentifier(session.technician.username) ||
        normalizeIdentifier(session.technician.name) ||
        normalizeIdentifier(session.technician.email) ||
        null
      );
    }
    return normalizeIdentifier(session.technician);
  }

  return (
    normalizeIdentifier(session.technicianId) ||
    normalizeIdentifier(session.userId) ||
    normalizeIdentifier(session.technicianName) ||
    normalizeIdentifier(session.technicianUsername) ||
    null
  );
};

const getDepartmentScreenCountValue = (department = {}) => {
  const keys = [
    'screenCount',
    'totalScreens',
    'scannedScreens',
    'scans',
    'scanCount',
    'departmentScreens',
    'screens',
    'size'
  ];
  for (const key of keys) {
    const rawValue = department[key];
    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      return rawValue;
    }
    if (typeof rawValue === 'string' && rawValue.trim()) {
      const parsed = Number(rawValue);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
};

const extractDepartmentsArray = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.departments)) return payload.departments;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.departments)) return payload.data.departments;
  if (Array.isArray(payload.data?.items)) return payload.data.items;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const normalizeDepartmentsPayload = (payload) => {
  const entries = extractDepartmentsArray(payload);
  return entries.map((department) => {
    const screenCount = getDepartmentScreenCountValue(department);
    return {
      name:
        department?.name ||
        department?.department ||
        department?.code ||
        department?.label ||
        'Unknown Department',
      value: Number.isFinite(screenCount) ? screenCount : 0
    };
  });
};

const extractDepartmentCountFromPayload = (payload) => {
  const candidates = [
    payload?.totalDepartments,
    payload?.totalCount,
    payload?.count,
    payload?.data?.total,
    payload?.data?.count,
    payload?.meta?.total,
    payload?.meta?.count
  ];
  const parsed = candidates.find((value) => Number.isFinite(Number(value)));
  return Number.isFinite(Number(parsed)) ? Number(parsed) : null;
};

// Get mobile token for desktop frontend
export const getMobileToken = async (req, res) => {
  try {
    // For now, we'll use the hardcoded token
    // In production, this should get a proper JWT token from mobile app
    const mobileToken = process.env.MOBILE_ADMIN_TOKEN || 'franceman99';
    
    if (!mobileToken) {
      return res.status(500).json({ error: 'Mobile backend token not configured' });
    }

    res.json({
      success: true,
      mobileToken
    });

  } catch (error) {
    console.error('❌ Get mobile token error:', error);
    res.status(500).json({ 
      error: 'Failed to get mobile token',
      details: error.message 
    });
  }
};

// Dashboard Overview
export const getDashboardStats = async (req, res) => {
  const token = getMobileTokenFromRequest(req, res);
  if (!token) return;

  try {
    const history = await mobileApiService.getScanHistory(token, {});
    const sessions = history.sessions ?? [];
    const totalScans = history.totalScans ?? 0;
    const statusBreakdown = {
      Reparable: history.totalReparable ?? 0,
      'Beyond Repair': history.totalBeyondRepair ?? 0,
      Healthy: history.totalHealthy ?? 0
    };

    const today = new Date();
    const startOfToday = new Date(today.toDateString()).getTime();
    const sevenDaysAgo = startOfToday - 6 * 24 * 60 * 60 * 1000;

    const todayScans = flattenScans(sessions).filter(
      (scan) => new Date(scan.timestamp).getTime() >= startOfToday
    ).length;
    const weeklyScans = flattenScans(sessions).filter(
      (scan) => new Date(scan.timestamp).getTime() >= sevenDaysAgo
    ).length;

    const departmentStats = sessions.reduce((acc, session) => {
      if (!session.department) return acc;
      const dept = session.department;
      acc[dept] = acc[dept] ?? { department: dept, sessions: 0, scans: 0 };
      acc[dept].sessions += 1;
      acc[dept].scans += Array.isArray(session.scans) ? session.scans.length : 0;
      return acc;
    }, {});

    const activeTechnicianKeys = new Set();
    sessions.forEach((session) => {
      const key = getSessionTechnicianKey(session);
      if (key) {
        activeTechnicianKeys.add(key);
      }
    });
    let departmentCount = Object.keys(departmentStats).length;
    let departmentDetails = [];
    try {
      const departmentPayload = await mobileApiService.getDepartments(token);
      departmentDetails = normalizeDepartmentsPayload(departmentPayload);
      if (departmentDetails.length > departmentCount) {
        departmentCount = departmentDetails.length;
      }
      const payloadCount = extractDepartmentCountFromPayload(departmentPayload);
      if (Number.isFinite(payloadCount) && payloadCount > departmentCount) {
        departmentCount = payloadCount;
      }
    } catch (err) {
      console.error('dY"S Dashboard departments fetch error:', err);
    }
    const activeTechniciansCount = activeTechnicianKeys.size;

    const recentSessions = [...sessions]
      .sort((a, b) => new Date(b.startTime || b.start || 0) - new Date(a.startTime || a.start || 0))
      .slice(0, 3);

    const recentActivity = {
      lastSessions: recentSessions,
      lastScans: flattenScans(sessions)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)
    };

    const usersCollection = await databaseService.getCollection('users');
    const totalUsers = await usersCollection.countDocuments();

    res.json({
      success: true,
      data: {
        overview: {
          totalScans,
          totalUsers,
          totalSessions: sessions.length,
          todayScans,
          weeklyScans,
          activeTechnicians: activeTechniciansCount,
          departmentCount
        },
        statusBreakdown,
        departmentStats,
        departmentDetails,
        recentActivity
      }
    });
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

// User Management
export const getAllUsers = async (req, res) => {
  try {
    console.log('🔄 Get all users request received');
    
    // Connect to database
    const usersCollection = await databaseService.getCollection('users');
    
    // Get all users from database
    const users = await usersCollection.find({}).toArray();
    
    console.log(`✅ Found ${users.length} users`);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('❌ Get all users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const createUser = async (req, res) => {
  try {
    console.log('🔄 Create user request received');
    console.log('User data:', req.body);

    const { username, email, password, department } = req.body;

    // Validate required fields
    if (!username || !email || !password || !department) {
      return res.status(400).json({ error: 'Username, email, password, and department are required' });
    }

    // Connect to database
    const usersCollection = await databaseService.getCollection('users');

    // Check if username already exists
    const existingUser = await usersCollection.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);

    // Create new user
    const newUser = {
      username: username.trim(),
      email: email.trim(),
      password: hashedPassword,
      department: department.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);

    console.log('✅ User created successfully');
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: result.insertedId,
        username: newUser.username,
        email: newUser.email,
        department: newUser.department
      }
    });

  } catch (error) {
    console.error('❌ Create user error:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req, res) => {
  try {
    console.log('🔄 Update user request received');
    console.log('User ID:', req.params.id);
    console.log('Update data:', req.body);

    const { id } = req.params;
    const { username, email, department, password } = req.body;

    // Validate required fields
    if (!username || !email || !department) {
      return res.status(400).json({ error: 'Username, email, and department are required' });
    }

    // Connect to database
    const usersCollection = await databaseService.getCollection('users');

    // Check if user exists
    const existingUser = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if username is already taken by another user
    const usernameExists = await usersCollection.findOne({ 
      username: username.trim(),
      _id: { $ne: new ObjectId(id) }
    });
    if (usernameExists) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Prepare update data
    const updateData = {
      username: username.trim(),
      email: email.trim(),
      department: department.trim(),
      updatedAt: new Date()
    };

    // Hash password if provided
    if (password && password.trim()) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);
      updateData.password = hashedPassword;
    }

    // Update user in database
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User updated successfully');
    return res.json({ 
      success: true, 
      message: 'User updated successfully',
      data: { id, username: updateData.username, email: updateData.email, department: updateData.department }
    });

  } catch (error) {
    console.error('❌ Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    console.log('🔄 Delete user request received');
    console.log('User ID:', req.params.id);

    const { id } = req.params;

    // Connect to database
    const usersCollection = await databaseService.getCollection('users');

    // Check if user exists
    const existingUser = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user from database
    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User deleted successfully');
    return res.json({
      success: true,
      message: 'User deleted successfully',
      data: { id }
    });

  } catch (error) {
    console.error('❌ Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Scan Management
export const getAllScans = async (req, res) => {
  const token = getMobileTokenFromRequest(req, res);
  if (!token) return;

  try {
    const filters = {
      department: req.query.department,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const result = await mobileApiService.getScanHistory(token, filters);
    return res.json(result);
  } catch (error) {
    console.error('❌ Get all scans error:', error);
    return res.status(500).json({ error: 'Failed to fetch scans' });
  }
};

export const getScanById = (_req, res) =>
  res.status(501).json({ error: 'Scan detail endpoint is not available in the mobile backend' });

export const updateScan = (_req, res) =>
  res.status(501).json({ error: 'Scan updates are not supported through this desktop workflow' });

export const deleteScan = async (req, res) => {
  try {
    console.log('🔄 Delete scan request received');
    console.log('Scan ID:', req.params.id);

    const { id } = req.params;

    // Connect to database
    const screensCollection = await databaseService.getCollection('screens');

    // Check if scan exists
    const existingScan = await screensCollection.findOne({ _id: new ObjectId(id) });
    if (!existingScan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    // Delete scan from database
    const result = await screensCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    console.log('✅ Scan deleted successfully');
    return res.json({
      success: true,
      message: 'Scan deleted successfully',
      data: { id }
    });

  } catch (error) {
    console.error('❌ Delete scan error:', error);
    return res.status(500).json({ error: 'Failed to delete scan' });
  }
};

export const archiveScan = (_req, res) =>
  res.status(501).json({ error: 'Archiving individual scans is handled by the mobile API' });

// Session Management
export const getAllSessions = async (req, res) => {
  const token = getMobileTokenFromRequest(req, res);
  if (!token) return;

  try {
    const filters = {
      department: req.query.department,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const result = await mobileApiService.getScanHistory(token, filters);
    return res.json(result);
  } catch (error) {
    console.error('❌ Get all sessions error:', error);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

export const getSessionById = (_req, res) =>
  res.status(501).json({ error: 'Session detail endpoint is not available in the mobile backend' });

export const deleteSession = async (req, res) => {
  try {
    console.log('🔄 Delete session request received');
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Connect to database
    const sessionsCollection = await databaseService.getCollection('tasksessions');
    const screensCollection = await databaseService.getCollection('screens');

    // Check if session exists
    const existingSession = await sessionsCollection.findOne({ _id: new ObjectId(id) });
    if (!existingSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Delete associated scans first
    const scanDeleteResult = await screensCollection.deleteMany({ session: new ObjectId(id) });
    console.log(`🗑️ Deleted ${scanDeleteResult.deletedCount} associated scans`);

    // Delete session from database
    const result = await sessionsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log('✅ Session deleted successfully');
    return res.json({
      success: true,
      message: 'Session deleted successfully',
      data: { 
        id,
        deletedScans: scanDeleteResult.deletedCount
      }
    });

  } catch (error) {
    console.error('❌ Delete session error:', error);
    return res.status(500).json({ error: 'Failed to delete session' });
  }
};

// Search and Filter
export const searchScans = async (req, res) => {
  const token = getMobileTokenFromRequest(req, res);
  if (!token) return;

  try {
    const filters = {
      department: req.query.department,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const result = await mobileApiService.getScanHistory(token, filters);
    return res.json(result);
  } catch (error) {
    console.error('❌ Search scans error:', error);
    return res.status(500).json({ error: 'Failed to search scans' });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q = '', department = '' } = req.query;
    const usersCollection = await databaseService.getCollection('users');
    const regexQuery = q
      ? {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      : {};
    const departmentQuery = department
      ? { department: { $regex: department, $options: 'i' } }
      : {};
    const filter = { ...regexQuery, ...departmentQuery };
    const users = await usersCollection.find(filter).limit(50).toArray();
    return res.json({ success: true, data: users });
  } catch (error) {
    console.error('❌ Search users error:', error);
    return res.status(500).json({ error: 'Failed to search users' });
  }
};
