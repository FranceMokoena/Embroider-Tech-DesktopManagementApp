import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getTransfer,
  listLifecycleHistory,
  transferAssets
} from '../controllers/assetsController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', listLifecycleHistory);
router.post('/', transferAssets);
router.get('/:id', getTransfer);

export default router;
