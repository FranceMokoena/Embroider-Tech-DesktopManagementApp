import moment from 'moment';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import databaseService from '../services/databaseService.js';
// Direct database access will be implemented here

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
  try {
    // TODO: Implement direct database access
    res.json({
      success: true,
      data: {
        overview: {
          totalScans: 0,
          totalUsers: 0,
          totalSessions: 0,
          todayScans: 0,
          weeklyScans: 0
        },
        statusBreakdown: {
      Reparable: 0,
      'Beyond Repair': 0,
      Healthy: 0
        },
        departmentStats: {},
        recentActivity: {
          lastScans: [],
          lastSessions: []
        }
      }
    });
    return;
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
  try {
    console.log('🔄 Get all scans request received');
    
    // Connect to database
    const screensCollection = await databaseService.getCollection('screens');
    
    // Get all scans from database
    const scans = await screensCollection.find({}).toArray();
    
    console.log(`✅ Found ${scans.length} scans`);
    
    res.json({
      success: true,
      data: scans
    });
  } catch (error) {
    console.error('❌ Get all scans error:', error);
    return res.status(500).json({ error: 'Failed to fetch scans' });
  }
};

export const getScanById = async (req, res) => {
  try {
    const token = req.headers['mobile-token'];
    if (!token) {
      return res.status(401).json({ error: 'Mobile backend token required' });
    }

    const { id } = req.params;
    const result = await mobileApiService.getScanById(token, id);
    return res.json(result);
  } catch (error) {
    console.error('❌ Get scan error:', error);
    return res.status(500).json({ error: 'Failed to fetch scan' });
  }
};

export const updateScan = async (req, res) => {
  try {
    const token = req.headers['mobile-token'];
    if (!token) {
      return res.status(401).json({ error: 'Mobile backend token required' });
    }

    const { id } = req.params;
    const result = await mobileApiService.updateScan(token, id, req.body);
    return res.json(result);
  } catch (error) {
    console.error('❌ Update scan error:', error);
    return res.status(500).json({ error: 'Failed to update scan' });
  }
};

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

export const archiveScan = async (req, res) => {
  try {
    const token = req.headers['mobile-token'];
    if (!token) {
      return res.status(401).json({ error: 'Mobile backend token required' });
    }

    const { id } = req.params;
    const result = await mobileApiService.archiveScan(token, id);
    return res.json(result);
  } catch (error) {
    console.error('❌ Archive scan error:', error);
    return res.status(500).json({ error: 'Failed to archive scan' });
  }
};

// Session Management
export const getAllSessions = async (req, res) => {
  try {
    const token = req.headers['mobile-token'];
    if (!token) {
      return res.status(401).json({ error: 'Mobile backend token required' });
    }

    const { department, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const filters = { department, dateFrom, dateTo, page, limit };

    const result = await mobileApiService.getAllSessions(token, filters);
    return res.json(result);
  } catch (error) {
    console.error('❌ Get all sessions error:', error);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const token = req.headers['mobile-token'];
    if (!token) {
      return res.status(401).json({ error: 'Mobile backend token required' });
    }

    const { id } = req.params;
    const result = await mobileApiService.getSessionById(token, id);
    return res.json(result);
  } catch (error) {
    console.error('❌ Get session error:', error);
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
};

// Search and Filter
export const searchScans = async (req, res) => {
  try {
    const token = req.headers['mobile-token'];
    if (!token) {
      return res.status(401).json({ error: 'Mobile backend token required' });
    }

    const { q, status, department, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const filters = { q, status, department, dateFrom, dateTo, page, limit };

    const result = await mobileApiService.getAllScans(token, filters);
    return res.json(result);
  } catch (error) {
    console.error('❌ Search scans error:', error);
    return res.status(500).json({ error: 'Failed to search scans' });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const token = req.headers['mobile-token'];
    if (!token) {
      return res.status(401).json({ error: 'Mobile backend token required' });
    }

    const { q, department, page = 1, limit = 50 } = req.query;
    const filters = { q, department, page, limit };

    const result = await mobileApiService.getAllUsers(token, filters);
    return res.json(result);
  } catch (error) {
    console.error('❌ Search users error:', error);
    return res.status(500).json({ error: 'Failed to search users' });
  }
};
