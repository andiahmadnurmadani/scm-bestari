import { Router } from 'express';
import {
  getLands,
  getLandById,
  createLand,
  updateLand,
  deleteLand,
} from '../controllers/landController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authenticateTokenOrApiKey } from '../middleware/apiKeyMiddleware.js';

const router = Router();

// GET: boleh JWT atau API key (read-only). Tulis (POST/PUT/DELETE): wajib JWT.
router.use((req, res, next) => {
  if (req.method === 'GET') return authenticateTokenOrApiKey(req, res, next);
  return authenticateToken(req, res, next);
});

// CRUD Kelola Lahan
router.get('/', getLands);           // GET /api/land?page=1&limit=10&search=...
router.get('/:id', getLandById);     // GET /api/land/:id
router.post('/', createLand);        // POST /api/land
router.put('/:id', updateLand);      // PUT /api/land/:id
router.delete('/:id', deleteLand);   // DELETE /api/land/:id

export default router;
