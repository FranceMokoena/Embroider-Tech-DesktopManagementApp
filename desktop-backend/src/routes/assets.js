import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  archiveAsset,
  assetMetrics,
  bulkCreateAssets,
  createAsset,
  createSection,
  createTechnician,
  deleteSection,
  deleteTechnician,
  getAsset,
  getSection,
  getTechnician,
  getTransfer,
  listAssets,
  listSectionOptions,
  listSectionSummary,
  listSections,
  listTechnicians,
  listLifecycleHistory,
  listTransfers,
  listVerificationHistory,
  transferAssets,
  transferAsset,
  updateSection,
  updateTechnician,
  updateAsset
} from '../controllers/assetsController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', listAssets);
router.post('/', createAsset);
router.post('/bulk-create', bulkCreateAssets);
router.get('/metrics', assetMetrics);
router.get('/summary', assetMetrics);
router.get('/dashboard', assetMetrics);
router.get('/statistics', assetMetrics);
router.get('/sections/options', listSectionOptions);
router.get('/sections/summary', listSectionSummary);
router.get('/sections', listSections);
router.post('/sections', createSection);
router.get('/sections/:id', getSection);
router.patch('/sections/:id', updateSection);
router.delete('/sections/:id', deleteSection);
router.get('/transfers', listTransfers);
router.post('/transfers', transferAssets);
router.get('/transfers/:id', getTransfer);
router.get('/lifecycle/history', listLifecycleHistory);
router.get('/technicians', listTechnicians);
router.post('/technicians', createTechnician);
router.get('/technicians/:id', getTechnician);
router.patch('/technicians/:id', updateTechnician);
router.delete('/technicians/:id', deleteTechnician);
router.get('/history', listVerificationHistory);
router.get('/verifications', listVerificationHistory);
router.get('/rfid-activity', listVerificationHistory);
router.get('/verification-history', listVerificationHistory);
router.get('/:id', getAsset);
router.put('/:id', updateAsset);
router.patch('/:id', updateAsset);
router.delete('/:id', archiveAsset);
router.post('/:id/transfer', transferAsset);

export default router;
