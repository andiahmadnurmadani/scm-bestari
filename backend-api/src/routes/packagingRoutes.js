import { Router } from 'express';
import {
  getPackagingList,
  getPackagingById,
  createPackaging,
  updatePackaging,
  deletePackaging,
} from '../controllers/packagingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authenticateTokenOrApiKey } from '../middleware/apiKeyMiddleware.js';

const router = Router();

// GET: boleh JWT atau API key (read-only). Tulis (POST/PUT/DELETE): wajib JWT.
router.use((req, res, next) => {
  if (req.method === 'GET') return authenticateTokenOrApiKey(req, res, next);
  return authenticateToken(req, res, next);
});

// CRUD Kelola Kemasan
router.get('/', getPackagingList);           // GET /api/packaging?page=1&limit=10&search=...
router.get('/:id', getPackagingById);        // GET /api/packaging/:id
router.post('/', createPackaging);           // POST /api/packaging
router.put('/:id', updatePackaging);         // PUT /api/packaging/:id
router.delete('/:id', deletePackaging);      // DELETE /api/packaging/:id

export default router;
