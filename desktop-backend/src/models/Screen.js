import databaseService from '../services/databaseService.js';

class Screen {
  static async getAllScans(filters = {}) {
    try {
      const collection = await databaseService.getCollection('screens');
      
      // Build query based on filters
      const query = {};
      
      // Date range filter
      if (filters.startDate && filters.endDate) {
        query.timestamp = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }
      
      // Status filter
      if (filters.status) {
        query.status = filters.status;
      }
      
      // Session filter
      if (filters.session) {
        query.session = filters.session;
      }
      
      const scans = await collection.find(query).toArray();
      
      return {
        success: true,
        data: scans,
        count: scans.length
      };
    } catch (error) {
      console.error('❌ Error fetching scans:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  static async getScanStats() {
    try {
      const collection = await databaseService.getCollection('screens');
      
      // Get total count
      const totalScans = await collection.countDocuments();
      
      // Status breakdown
      const statusBreakdown = await collection.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]).toArray();
      
      // Convert to object format
      const statusStats = {};
      statusBreakdown.forEach(stat => {
        statusStats[stat._id] = stat.count;
      });
      
      // Today's scans
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayScans = await collection.countDocuments({
        timestamp: { $gte: today }
      });
      
      // This week's scans
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weeklyScans = await collection.countDocuments({
        timestamp: { $gte: weekStart }
      });
      
      return {
        success: true,
        data: {
          totalScans,
          todayScans,
          weeklyScans,
          statusBreakdown: statusStats
        }
      };
    } catch (error) {
      console.error('❌ Error fetching scan stats:', error);
      return {
        success: false,
        error: error.message,
        data: {
          totalScans: 0,
          todayScans: 0,
          weeklyScans: 0,
          statusBreakdown: {}
        }
      };
    }
  }

  static async getScanById(id) {
    try {
      const collection = await databaseService.getCollection('screens');
      
      const scan = await collection.findOne({ _id: id });
      
      if (!scan) {
        return {
          success: false,
          error: 'Scan not found',
          data: null
        };
      }
      
      return {
        success: true,
        data: scan
      };
    } catch (error) {
      console.error('❌ Error fetching scan by ID:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}

export default Screen;
