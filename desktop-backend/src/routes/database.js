import express from 'express';
import databaseService from '../services/databaseService.js';

const router = express.Router();

// Test database connection
router.get('/test', async (req, res) => {
  try {
    const result = await databaseService.testConnection();
    return res.json(result);
  } catch (error) {
    console.error('❌ Database test error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Test collections access
router.get('/collections', async (req, res) => {
  try {
    const db = await databaseService.getDb();
    const collections = await db.listCollections().toArray();
    
    return res.json({
      success: true,
      data: collections.map(col => col.name)
    });
  } catch (error) {
    console.error('❌ Collections test error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
