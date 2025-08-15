import express from 'express';
import { login, getProfile, requireAuth } from '../middleware/auth.js';
import { getMobileToken } from '../controllers/adminController.js';

const router = express.Router();

// Admin login
router.post('/login', login);

// Get admin profile
router.get('/profile', requireAuth, getProfile);

// Get mobile token for desktop frontend
router.get('/mobile-token', requireAuth, getMobileToken);

export default router;
