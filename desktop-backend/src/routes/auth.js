import express from 'express';
import { login, getProfile, refreshToken, requireAuth, registerAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin registration
router.post('/register', registerAdmin);

// Admin login
router.post('/login', login);

// Refresh short-lived access token
router.post('/refresh', refreshToken);

// Get admin profile
router.get('/profile', requireAuth, getProfile);

export default router;
