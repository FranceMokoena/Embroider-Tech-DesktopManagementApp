import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createTechnician,
  deleteTechnician,
  getTechnician,
  listTechnicians,
  updateTechnician
} from '../controllers/assetsController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', listTechnicians);
router.post('/', createTechnician);
router.get('/:id', getTechnician);
router.patch('/:id', updateTechnician);
router.delete('/:id', deleteTechnician);

export default router;
