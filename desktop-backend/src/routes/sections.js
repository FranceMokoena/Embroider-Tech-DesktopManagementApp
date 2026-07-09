import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createSection,
  deleteSection,
  getSection,
  listSectionOptions,
  listSections,
  updateSection
} from '../controllers/assetsController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', listSections);
router.get('/options', listSectionOptions);
router.post('/', createSection);
router.get('/:id', getSection);
router.patch('/:id', updateSection);
router.delete('/:id', deleteSection);

export default router;
