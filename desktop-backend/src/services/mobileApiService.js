import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class MobileApiService {
  constructor() {
    this.baseURL = process.env.MOBILE_API_URL || 'https://embroider-scann-app.onrender.com/api';
    this.apiKey = process.env.MOBILE_API_KEY;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`📡 Mobile API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Mobile API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ Mobile API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ Mobile API Response Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.response?.data?.error || error.message
        });
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async login(credentials) {
    try {
      const response = await this.client.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Login failed');
    }
  }

  // Get JWT token for mobile app access
  async getMobileJWTToken(adminCredentials) {
    try {
      // Login to mobile app to get JWT token
      const loginResponse = await this.login(adminCredentials);
      return loginResponse.token || loginResponse.accessToken;
    } catch (error) {
      throw this.handleError(error, 'Failed to get mobile JWT token');
    }
  }

  // Get desktop service token for accessing mobile API
  async getAdminToken() {
    try {
      // Use desktop service token for full access
      const desktopToken = process.env.MOBILE_ADMIN_TOKEN || 'franceman99';
      console.log('🔑 Using desktop service token for full access');
      return desktopToken;
    } catch (error) {
      throw this.handleError(error, 'Failed to get desktop service token');
    }
  }

  // Get dashboard statistics
  async getDashboardStats(token) {
    try {
      // Get all scans for statistics
      const allScans = await this.getAllScans(token);
      const allUsers = await this.getAllUsers(token);
      const allSessions = await this.getAllSessions(token);

      // Calculate statistics
      const totalScans = allScans.data?.length || 0;
      const totalUsers = allUsers.data?.length || 0;
      const totalSessions = allSessions.data?.length || 0;

      // Status breakdown
      const statusBreakdown = {
        Reparable: 0,
        'Beyond Repair': 0,
        Healthy: 0
      };

      allScans.data?.forEach(scan => {
        if (statusBreakdown[scan.status] !== undefined) {
          statusBreakdown[scan.status]++;
        }
      });

      // Today's activity
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayScans = allScans.data?.filter(scan => 
        new Date(scan.timestamp) >= today
      ) || [];

      // Weekly activity
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weeklyScans = allScans.data?.filter(scan => 
        new Date(scan.timestamp) >= weekStart
      ) || [];

      // Department breakdown
      const departmentStats = {};
      allUsers.data?.forEach(user => {
        if (!departmentStats[user.department]) {
          departmentStats[user.department] = { users: 0, scans: 0 };
        }
        departmentStats[user.department].users++;
      });

      // Count scans by department
      allScans.data?.forEach(scan => {
        const user = allUsers.data?.find(u => u._id === scan.technician);
        if (user && departmentStats[user.department]) {
          departmentStats[user.department].scans++;
        }
      });

      return {
        overview: {
          totalScans,
          totalUsers,
          totalSessions,
          todayScans: todayScans.length,
          weeklyScans: weeklyScans.length
        },
        statusBreakdown,
        departmentStats,
        recentActivity: {
          lastScans: allScans.data?.slice(0, 10) || [],
          lastSessions: allSessions.data?.slice(0, 5) || []
        }
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to get dashboard stats');
    }
  }

  async getProfile(token) {
    try {
      const response = await this.client.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get profile');
    }
  }

  // Get all users (technicians) - extract from session data
  async getAllUsers(token, filters = {}) {
    try {
      // Get all sessions to extract unique technicians
      const sessionsResponse = await this.getAllSessions(token, filters);
      const users = new Map();
      
      sessionsResponse.data?.forEach(session => {
        if (session.technician && !users.has(session.technician)) {
          users.set(session.technician, {
            _id: session.technician,
            username: session.technician, // Mobile app uses username
            department: session.department || 'Unknown',
            role: 'technician',
            // Note: Mobile app doesn't have name/surname fields
            name: session.technician.split(' ')[0] || '',
            surname: session.technician.split(' ').slice(1).join(' ') || ''
          });
        }
      });
      
      return {
        success: true,
        data: Array.from(users.values())
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch users');
    }
  }

  async createUser(token, userData) {
    try {
      const response = await this.client.post('/auth/users', userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create user');
    }
  }

  async updateUser(token, userId, userData) {
    try {
      const response = await this.client.put(`/auth/users/${userId}`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update user');
    }
  }

  async deleteUser(token, userId) {
    try {
      const response = await this.client.delete(`/auth/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete user');
    }
  }

  // Scan management methods - extract scans from session data
  async getAllScans(token, filters = {}) {
    try {
      const response = await this.client.get('/scan/history/all', {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      
      // Extract all scans from all sessions
      const allScans = [];
      response.data.sessions?.forEach(session => {
        if (session.scans) {
          session.scans.forEach(scan => {
            allScans.push({
              ...scan,
              sessionId: session.id,
              technician: session.technician,
              department: session.department
            });
          });
        }
      });
      
      return {
        success: true,
        data: allScans,
        stats: {
          totalScans: response.data.totalScans,
          totalReparable: response.data.totalReparable,
          totalBeyondRepair: response.data.totalBeyondRepair,
          totalHealthy: response.data.totalHealthy
        }
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch scans');
    }
  }

  async getScanById(token, scanId) {
    try {
      const response = await this.client.get(`/scan/${scanId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch scan');
    }
  }

  async updateScan(token, scanId, scanData) {
    try {
      const response = await this.client.put(`/scan/${scanId}`, scanData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update scan');
    }
  }

  async deleteScan(token, scanId) {
    try {
      const response = await this.client.delete(`/scan/${scanId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete scan');
    }
  }

  async archiveScan(token, scanId) {
    try {
      const response = await this.client.post(`/scan/${scanId}/archive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to archive scan');
    }
  }

  // Session management methods - using the actual session data from mobile app
  async getAllSessions(token, filters = {}) {
    try {
      // Get all scan history which includes session data
      const response = await this.client.get('/scan/history/all', {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      
      // The mobile app returns sessions with their scans
      const sessions = response.data.sessions || [];
      
      // Transform to match our expected format
      const transformedSessions = sessions.map(session => ({
        _id: session.id,
        technician: session.technician,
        department: session.department || 'Unknown',
        startTime: session.startTime,
        endTime: session.endTime,
        scanCount: session.scans ? session.scans.length : 0,
        scans: session.scans || []
      }));
      
      return {
        success: true,
        data: transformedSessions
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch sessions');
    }
  }

  async getSessionById(token, sessionId) {
    try {
      const response = await this.client.get(`/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch session');
    }
  }

  // Dashboard statistics - calculate from scan data
  async getDashboardStats(token) {
    try {
      const allScans = await this.getAllScans(token);
      const scans = allScans.data || [];
      
      // Calculate statistics
      const stats = {
        totalScans: scans.length,
        reparable: scans.filter(scan => scan.status === 'Reparable').length,
        beyondRepair: scans.filter(scan => scan.status === 'Beyond Repair').length,
        healthy: scans.filter(scan => scan.status === 'Healthy').length,
        todayScans: scans.filter(scan => {
          const today = new Date().toDateString();
          return new Date(scan.timestamp).toDateString() === today;
        }).length,
        weeklyScans: scans.filter(scan => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(scan.timestamp) >= weekAgo;
        }).length
      };
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch dashboard stats');
    }
  }

  // Error handling helper
  handleError(error, defaultMessage) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.error || defaultMessage;
      
      return {
        status,
        message,
        details: error.response.data
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        status: 503,
        message: 'Mobile backend is unavailable',
        details: error.request
      };
    } else {
      // Something else happened
      return {
        status: 500,
        message: defaultMessage,
        details: error.message
      };
    }
  }
}

export default new MobileApiService();
