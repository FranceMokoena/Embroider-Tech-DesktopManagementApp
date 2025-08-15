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

  // Get admin token for accessing mobile API
  async getAdminToken() {
    try {
      // Use the JWT_SECRET from mobile app as admin token
      return this.apiKey || 'franceman99';
    } catch (error) {
      throw this.handleError(error, 'Failed to get admin token');
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

  // Get all users (technicians) - using scan history to extract user info
  async getAllUsers(token, filters = {}) {
    try {
      // Get all scans to extract unique technicians
      const allScans = await this.getAllScans(token, filters);
      const users = new Map();
      
      allScans.data?.forEach(scan => {
        if (scan.technician && !users.has(scan.technician)) {
          users.set(scan.technician, {
            _id: scan.technician,
            name: scan.technician.split(' ')[0] || '',
            surname: scan.technician.split(' ').slice(1).join(' ') || '',
            department: scan.department || 'Unknown',
            role: 'technician'
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

  // Scan management methods
  async getAllScans(token, filters = {}) {
    try {
      const response = await this.client.get('/scan/history/all', {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      return response.data;
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

  // Session management methods - using scan data to group by sessions
  async getAllSessions(token, filters = {}) {
    try {
      // Get all scans and group them by session
      const allScans = await this.getAllScans(token, filters);
      const sessions = new Map();
      
      allScans.data?.forEach(scan => {
        const sessionKey = scan.sessionId || scan._id;
        if (!sessions.has(sessionKey)) {
          sessions.set(sessionKey, {
            _id: sessionKey,
            technician: scan.technician,
            department: scan.department,
            startTime: scan.timestamp,
            endTime: null, // Will be calculated
            scanCount: 0,
            scans: []
          });
        }
        
        const session = sessions.get(sessionKey);
        session.scans.push(scan);
        session.scanCount = session.scans.length;
        
        // Update end time to latest scan
        if (!session.endTime || new Date(scan.timestamp) > new Date(session.endTime)) {
          session.endTime = scan.timestamp;
        }
      });
      
      return {
        success: true,
        data: Array.from(sessions.values())
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
