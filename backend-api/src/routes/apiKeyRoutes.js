import { Router } from 'express';
import {
  getApiKeys,
  createApiKey,
  updateApiKey,
  deleteApiKey,
} from '../controllers/apiKeyController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Semua endpoint API key wajib login admin (JWT) — bukan via API key
router.use(authenticateToken);

// CRUD API Key (read-only untuk konsumen API, tapi CRUD key di sini)
router.get('/', getApiKeys);          // GET /api/keys
router.post('/', createApiKey);       // POST /api/keys
router.put('/:id', updateApiKey);     // PUT /api/keys/:id
router.delete('/:id', deleteApiKey);  // DELETE /api/keys/:id

export default router;
