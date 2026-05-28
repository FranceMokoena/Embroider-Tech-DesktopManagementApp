import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  archiveAsset,
  assetMetrics,
  getAsset,
  listAssets,
  listSections,
  listTransfers,
  listVerificationHistory,
  transferAsset,
  updateAsset
} from '../controllers/assetsController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', listAssets);
router.get('/metrics', assetMetrics);
router.get('/sections', listSections);
router.get('/transfers', listTransfers);
router.get('/verification-history', listVerificationHistory);
router.get('/:id', getAsset);
router.put('/:id', updateAsset);
router.delete('/:id', archiveAsset);
router.post('/:id/transfer', transferAsset);

export default router;
