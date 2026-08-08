import { Router } from 'express';
import {
  getVarieties,
  createVariety,
  updateVariety,
  deleteVariety,
} from '../controllers/varietyController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authenticateTokenOrApiKey } from '../middleware/apiKeyMiddleware.js';

const router = Router();

// GET: boleh JWT atau API key (read-only). Tulis (POST/PUT/DELETE): wajib JWT.
router.use((req, res, next) => {
  if (req.method === 'GET') return authenticateTokenOrApiKey(req, res, next);
  return authenticateToken(req, res, next);
});

// Master Data Varietas Sorgum
router.get('/', getVarieties);          // GET /api/varieties
router.post('/', createVariety);        // POST /api/varieties
router.put('/:id', updateVariety);      // PUT /api/varieties/:id
router.delete('/:id', deleteVariety);   // DELETE /api/varieties/:id

export default router;
