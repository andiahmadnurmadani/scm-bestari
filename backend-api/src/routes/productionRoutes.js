import { Router } from 'express';
import {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
} from '../controllers/productionController.js';

const router = Router();

// CRUD Kelola Produksi
router.get('/', getBatches);           // GET /api/production?page=1&limit=10&search=...
router.get('/:id', getBatchById);      // GET /api/production/:id
router.post('/', createBatch);         // POST /api/production
router.put('/:id', updateBatch);       // PUT /api/production/:id
router.delete('/:id', deleteBatch);    // DELETE /api/production/:id

export default router;
