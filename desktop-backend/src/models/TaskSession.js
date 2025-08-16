import databaseService from '../services/databaseService.js';

class TaskSession {
  static async getAllSessions(filters = {}) {
    try {
      const collection = await databaseService.getCollection('tasksessions');
      
      // Build query based on filters
      const query = {};
      
      // Date range filter
      if (filters.startDate && filters.endDate) {
        query.startTime = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }
      
      // Department filter
      if (filters.department) {
        query.department = filters.department;
      }
      
      // Technician filter
      if (filters.technician) {
        query.technician = filters.technician;
      }
      
      const sessions = await collection.find(query).toArray();
      
      return {
        success: true,
        data: sessions,
        count: sessions.length
      };
    } catch (error) {
      console.error('❌ Error fetching sessions:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  static async getSessionById(id) {
    try {
      const collection = await databaseService.getCollection('tasksessions');
      const session = await collection.findOne({ _id: id });
      
      return {
        success: true,
        data: session
      };
    } catch (error) {
      console.error('❌ Error fetching session by ID:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  static async getSessionStats() {
    try {
      const collection = await databaseService.getCollection('tasksessions');
      
      // Get total count
      const totalSessions = await collection.countDocuments();
      
      // Get today's sessions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaySessions = await collection.countDocuments({
        startTime: { $gte: today }
      });
      
      // Get this week's sessions
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weeklySessions = await collection.countDocuments({
        startTime: { $gte: weekStart }
      });
      
      // Get active sessions (no endTime)
      const activeSessions = await collection.countDocuments({
        endTime: { $exists: false }
      });
      
      return {
        success: true,
        data: {
          totalSessions,
          todaySessions,
          weeklySessions,
          activeSessions
        }
      };
    } catch (error) {
      console.error('❌ Error fetching session stats:', error);
      return {
        success: false,
        error: error.message,
        data: {
          totalSessions: 0,
          todaySessions: 0,
          weeklySessions: 0,
          activeSessions: 0
        }
      };
    }
  }

  static async getActiveSessions() {
    try {
      const collection = await databaseService.getCollection('tasksessions');
      
      // Get sessions that don't have an endTime (active sessions)
      const activeSessions = await collection.find({
        endTime: { $exists: false }
      }).toArray();
      
      return {
        success: true,
        data: activeSessions,
        count: activeSessions.length
      };
    } catch (error) {
      console.error('❌ Error fetching active sessions:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
}

export default TaskSession;
