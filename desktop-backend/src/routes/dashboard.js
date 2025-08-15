import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  getDashboardOverview,
  getScanHistory,
  getUsers,
  getUserProfile,
  getSessions,
  getNotifications
} from '../controllers/dashboardController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);
router.use(requireAdmin);

// Dashboard data endpoints
router.get('/overview', getDashboardOverview);
router.get('/scan-history', getScanHistory);
router.get('/users', getUsers);
router.get('/profile', getUserProfile);
router.get('/sessions', getSessions);
router.get('/notifications', getNotifications);

export default router;
