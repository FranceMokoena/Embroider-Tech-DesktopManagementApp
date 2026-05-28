import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { lookupTag, verifyRoom } from '../controllers/rfidController.js';

const router = express.Router();

router.use(requireAuth);

router.post('/verify-room', verifyRoom);
router.get('/lookup/:epc', lookupTag);
router.get('/tag/:epc', lookupTag);

export default router;
