import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listVerificationHistory } from '../controllers/assetsController.js';
import { lookupTag, updateAssetStatus, verifyRoom } from '../controllers/rfidController.js';

const router = express.Router();

router.use(requireAuth);

router.post('/verify-room', verifyRoom);
router.get('/verification-history', listVerificationHistory);
router.get('/scan-history', listVerificationHistory);
router.patch('/asset-status', updateAssetStatus);
router.get('/lookup/:epc', lookupTag);
router.get('/tag/:epc', lookupTag);
router.get('/tags/:epc', lookupTag);

export default router;
