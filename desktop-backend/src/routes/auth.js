import express from 'express';
import { login, getProfile, requireAuth, registerAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin registration
router.post('/register', registerAdmin);

// Admin login
router.post('/login', login);

// Get admin profile
router.get('/profile', requireAuth, getProfile);

export default router;
