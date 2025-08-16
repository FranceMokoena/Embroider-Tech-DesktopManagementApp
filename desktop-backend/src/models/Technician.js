import databaseService from '../services/databaseService.js';

class Technician {
  static async getAllTechnicians(filters = {}) {
    try {
      const collection = await databaseService.getCollection('users');
      
      // Build query based on filters
      const query = {};
      if (filters.department) {
        query.department = filters.department;
      }
      
      const technicians = await collection.find(query).toArray();
      
      return {
        success: true,
        data: technicians,
        count: technicians.length
      };
    } catch (error) {
      console.error('❌ Error fetching technicians:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  static async getTechnicianById(id) {
    try {
      const collection = await databaseService.getCollection('users');
      
      const technician = await collection.findOne({ _id: id });
      
      return {
        success: true,
        data: technician
      };
    } catch (error) {
      console.error('❌ Error fetching technician by ID:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  static async getTechnicianStats() {
    try {
      const collection = await databaseService.getCollection('users');
      
      // Get total count
      const totalTechnicians = await collection.countDocuments();
      
      // Get department breakdown
      const departmentStats = await collection.aggregate([
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 }
          }
        }
      ]).toArray();
      
      // Convert to object format
      const departmentBreakdown = {};
      departmentStats.forEach(stat => {
        departmentBreakdown[stat._id] = stat.count;
      });
      
      return {
        success: true,
        data: {
          totalTechnicians,
          departmentStats: departmentBreakdown
        }
      };
    } catch (error) {
      console.error('❌ Error fetching technician stats:', error);
      return {
        success: false,
        error: error.message,
        data: {
          totalTechnicians: 0,
          departmentStats: {}
        }
      };
    }
  }
}

export default Technician;
