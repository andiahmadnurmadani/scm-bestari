import { Router } from 'express';
import {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
} from '../controllers/productionController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authenticateTokenOrApiKey } from '../middleware/apiKeyMiddleware.js';

const router = Router();

// GET: boleh JWT atau API key (read-only). Tulis (POST/PUT/DELETE): wajib JWT.
router.use((req, res, next) => {
  if (req.method === 'GET') return authenticateTokenOrApiKey(req, res, next);
  return authenticateToken(req, res, next);
});

// CRUD Kelola Produksi
router.get('/', getBatches);           // GET /api/production?page=1&limit=10&search=...
router.get('/:id', getBatchById);      // GET /api/production/:id
router.post('/', createBatch);         // POST /api/production
router.put('/:id', updateBatch);       // PUT /api/production/:id
router.delete('/:id', deleteBatch);    // DELETE /api/production/:id

export default router;
