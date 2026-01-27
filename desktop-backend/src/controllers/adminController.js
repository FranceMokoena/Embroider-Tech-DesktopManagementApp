import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import databaseService from '../services/databaseService.js';
import mobileApiService from '../services/mobileApiService.js';
// Direct database access will be implemented here

const CACHE_TTL = Number(process.env.DESKTOP_CACHE_TTL) || 60000;
const sessionsCache = { timestamp: 0, data: null };
const departmentsCache = { timestamp: 0, data: null };

const getMobileTokenFromRequest = (req, res) => {
  const token = req.headers['mobile-token'] || process.env.MOBILE_ADMIN_TOKEN || 'franceman99';
  if (!token) {
    console.warn('[adminController] missing mobile-token header and no default token', {
      method: req.method,
      path: req.originalUrl
    });
    res.status(401).json({ 
      error: 'Mobile backend token required',
      message: 'Please ensure mobile-token header is set or MOBILE_ADMIN_TOKEN environment variable is configured'
    });
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

    // Test the connection with this token
    try {
      const connectionTest = await mobileApiService.testConnection(mobileToken);
      console.info('[adminController] Mobile API connection test:', connectionTest);
    } catch (testError) {
      console.warn('[adminController] Mobile API connection test failed:', testError.message);
      // Don't fail the request, but log the warning
    }

    res.json({
      success: true,
      mobileToken,
      mobileApiUrl: process.env.MOBILE_API_URL || 'https://embroider-scann-app.onrender.com/api'
    });

  } catch (error) {
    console.error('❌ Get mobile token error:', error);
    res.status(500).json({ 
      error: 'Failed to get mobile token',
      details: error.message 
    });
  }
};

// Health check endpoint for mobile API
export const checkMobileApiHealth = async (req, res) => {
  try {
    const token = getMobileTokenFromRequest(req, res);
    if (!token) return;
    
    const result = await mobileApiService.testConnection(token);
    res.json({
      success: result.success,
      message: result.message,
      status: result.status,
      code: result.code,
      details: result.details,
      mobileApiUrl: process.env.MOBILE_API_URL || 'https://embroider-scann-app.onrender.com/api'
    });
  } catch (error) {
    console.error('❌ Mobile API health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message,
      details: error.details
    });
  }
};

// Dashboard Overview
export const getDashboardStats = async (req, res) => {
  const token = getMobileTokenFromRequest(req, res);
  if (!token) return;
  console.info('[adminController] getDashboardStats', {
    user: req.user?.username,
    mobileToken: Boolean(token)
  });

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

    // Enrich sessions with department info from users/technicians
    const usersCollection = await databaseService.getCollection('users');
    const allUsers = await usersCollection.find({}).toArray();
    const userMap = new Map();
    allUsers.forEach(user => {
      if (user._id) {
        userMap.set(user._id.toString(), user);
      }
    });
    
    // Enrich sessions with department from technician
    const enrichedSessions = sessions.map(session => {
      const technicianId = getSessionTechnicianKey(session);
      if (technicianId) {
        const technician = userMap.get(technicianId.toString()) || 
                         Array.from(userMap.values()).find(u => 
                           u.username === technicianId || 
                           u._id?.toString() === technicianId
                         );
        if (technician && technician.department) {
          return { ...session, department: technician.department };
        }
      }
      return session;
    });
    
    const departmentStats = enrichedSessions.reduce((acc, session) => {
      if (!session.department) return acc;
      const dept = session.department;
      acc[dept] = acc[dept] ?? { department: dept, sessions: 0, scans: 0 };
      acc[dept].sessions += 1;
      acc[dept].scans += Array.isArray(session.scans) ? session.scans.length : 0;
      return acc;
    }, {});

    const activeTechnicianKeys = new Set();
    enrichedSessions.forEach((session) => {
      const key = getSessionTechnicianKey(session);
      if (key) {
        activeTechnicianKeys.add(key);
      }
    });
    let departmentCount = Object.keys(departmentStats).length;
    let departmentDetails = [];
    try {
      const departmentPayload = await mobileApiService.getDepartments(token);
      const rawDepartmentDetails = normalizeDepartmentsPayload(departmentPayload);
      
      // Merge scan counts from departmentStats into departmentDetails
      // Create a map of department name to scan count from actual session data
      const departmentScanCounts = {};
      Object.values(departmentStats).forEach(stat => {
        const deptName = stat.department;
        if (deptName) {
          departmentScanCounts[deptName] = stat.scans || 0;
        }
      });
      
      // Update departmentDetails with real scan counts
      departmentDetails = rawDepartmentDetails.map(dept => {
        const deptName = dept.name;
        // Try to find matching department in departmentStats by name
        const scanCount = departmentScanCounts[deptName] || 
                         Object.values(departmentStats).find(stat => 
                           stat.department && stat.department.toLowerCase() === deptName.toLowerCase()
                         )?.scans || 
                         dept.value; // Fallback to original value if no match
        
        return {
          name: deptName,
          value: scanCount
        };
      });
      
      // Also add departments from sessions that might not be in the API response
      Object.values(departmentStats).forEach(stat => {
        const deptName = stat.department;
        if (deptName && !departmentDetails.find(d => d.name === deptName || d.name.toLowerCase() === deptName.toLowerCase())) {
          departmentDetails.push({
            name: deptName,
            value: stat.scans || 0
          });
        }
      });
      
      // Log for debugging
      console.info('[adminController] Department details calculated:', {
        totalDepartments: departmentDetails.length,
        departmentsWithScans: departmentDetails.filter(d => d.value > 0).length,
        totalScans: departmentDetails.reduce((sum, d) => sum + d.value, 0)
      });
      
      if (departmentDetails.length > departmentCount) {
        departmentCount = departmentDetails.length;
      }
      const payloadCount = extractDepartmentCountFromPayload(departmentPayload);
      if (Number.isFinite(payloadCount) && payloadCount > departmentCount) {
        departmentCount = payloadCount;
      }
    } catch (err) {
      console.error('❌ Dashboard departments fetch error:', err);
      // Fallback: create departmentDetails from departmentStats
      departmentDetails = Object.values(departmentStats).map(stat => ({
        name: stat.department,
        value: stat.scans || 0
      }));
    }
    const activeTechniciansCount = activeTechnicianKeys.size;

    const recentSessions = [...enrichedSessions]
      .sort((a, b) => new Date(b.startTime || b.start || 0) - new Date(a.startTime || a.start || 0))
      .slice(0, 3);

    const recentActivity = {
      lastSessions: recentSessions,
      lastScans: flattenScans(enrichedSessions)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)
    };

    const totalUsers = allUsers.length;

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
    const isNetworkError = error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND';
    const status = error.response?.status || error.status || 500;
    
    if (isNetworkError) {
      return res.status(503).json({ 
        error: 'Mobile API connection failed',
        message: `Cannot connect to mobile backend. Please verify the mobile API is running and accessible at ${process.env.MOBILE_API_URL || 'https://embroider-scann-app.onrender.com/api'}`,
        details: error.message
      });
    }
    
    return res.status(status >= 400 && status < 500 ? status : 500).json({ 
      error: 'Failed to fetch dashboard statistics, please try to logout and login again',
      message: error.message || 'Unknown error occurred',
      details: error.response?.data || error.details
    });
  }
};

export const getDepartments = async (req, res) => {
  const token = getMobileTokenFromRequest(req, res);
  if (!token) return;

  const now = Date.now();
  if (departmentsCache.data && now - departmentsCache.timestamp < CACHE_TTL) {
    console.info('[adminController] getDepartments cache hit');
    return res.json(departmentsCache.data);
  }

  try {
    const payload = await mobileApiService.getDepartments(token);
    departmentsCache.data = payload;
    departmentsCache.timestamp = Date.now();
    return res.json(payload);
  } catch (error) {
    console.error('❌ Departments fetch error:', error);
    const isNetworkError = error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND';
    const status = error.response?.status || error.status || 500;

    if (departmentsCache.data) {
      console.warn('[adminController] getDepartments returning stale cache due to error');
      res.set('X-Cache', 'stale');
      return res.json(departmentsCache.data);
    }

    if (isNetworkError) {
      return res.status(503).json({ 
        error: 'Mobile API connection failed',
        message: 'Cannot connect to mobile backend to fetch departments, please verify the mobile API is running and accessible',
        details: error.message
      });
    }
    
    return res.status(status >= 400 && status < 500 ? status : 500).json({ 
      error: 'Failed to fetch departments, reload and login again',
      message: error.message || 'Unknown error occurred',
      details: error.response?.data
    });
  }
};

export const createDepartment = async (req, res) => {
  const token = getMobileTokenFromRequest(req, res);
  if (!token) return;

  try {
    const payload = req.body || {};
    const result = await mobileApiService.createDepartment(token, payload);
    return res.status(201).json(result);
  } catch (error) {
    console.error('? Create department error:', error);
    return res.status(500).json({ error: 'Failed to create department, department details already exist, try to delete the existing department first and recreate' });
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
    return res.status(500).json({ error: 'Failed to fetch users, please try to logout and login again' });
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
    return res.status(500).json({ error: 'Failed to create user, make sure user don\'t already exist' });
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
    console.info('[adminController] getAllScans start', { filters });
    const startTime = Date.now();
    const result = await mobileApiService.getScanHistory(token, filters);
    const duration = Date.now() - startTime;
    console.info('[adminController] getAllScans complete', {
      duration,
      sessionsCount: Array.isArray(result?.sessions) ? result.sessions.length : undefined
    });
    return res.json(result);
  } catch (error) {
    console.error('❌ Get all scans error:', error);
    const isNetworkError = error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND';
    const status = error.response?.status || error.status || 500;
    
    if (isNetworkError) {
      return res.status(503).json({ 
        error: 'Mobile API connection failed',
        message: 'Cannot connect to mobile backend to fetch scans',
        details: error.message
      });
    }
    
    return res.status(status >= 400 && status < 500 ? status : 500).json({ 
      error: 'Failed to fetch scans',
      message: error.message || 'Unknown error occurred',
      details: error.response?.data
    });
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

export const deleteScreens = async (req, res) => {
  const token = getMobileTokenFromRequest(req, res);
  if (!token) return;

  try {
    const payload = req.body || {};
    const { barcodes } = payload;
    if (!Array.isArray(barcodes) || barcodes.length === 0) {
      return res.status(400).json({ error: 'At least one barcode is required' });
    }
    const result = await mobileApiService.deleteScreens(token, { barcodes });
    return res.json(result);
  } catch (error) {
    console.error('? Delete screens error:', error);
    return res.status(500).json({ error: 'Failed to delete screens' });
  }
};

// Session Management
export const getAllSessions = async (req, res) => {
  const token = getMobileTokenFromRequest(req, res);
  if (!token) return;

  const now = Date.now();
  if (sessionsCache.data && now - sessionsCache.timestamp < CACHE_TTL) {
    console.info('[adminController] getAllSessions cache hit');
    return res.json(sessionsCache.data);
  }

  try {
    const filters = {
      department: req.query.department,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    console.info('[adminController] getAllSessions start', { filters });
    const startTime = Date.now();
    const result = await mobileApiService.getScanHistory(token, filters);
    const duration = Date.now() - startTime;
    console.info('[adminController] getAllSessions complete', {
      duration,
      sessionsCount: Array.isArray(result?.sessions) ? result.sessions.length : undefined
    });
    sessionsCache.data = result;
    sessionsCache.timestamp = Date.now();
    return res.json(result);
  } catch (error) {
    console.error('❌ Get all sessions error:', error);
    const isNetworkError = error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND';
    const status = error.response?.status || error.status || 500;

    if (sessionsCache.data) {
      console.warn('[adminController] getAllSessions returning stale cache due to error');
      res.set('X-Cache', 'stale');
      return res.json(sessionsCache.data);
    }

    if (isNetworkError) {
      return res.status(503).json({ 
        error: 'Mobile API connection failed',
        message: 'Cannot connect to mobile backend to fetch sessions',
        details: error.message
      });
    }
    
    return res.status(status >= 400 && status < 500 ? status : 500).json({ 
      error: 'Failed to fetch sessions',
      message: error.message || 'Unknown error occurred',
      details: error.response?.data
    });
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
