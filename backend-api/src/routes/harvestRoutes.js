import { Router } from 'express';
import {
  getHarvests,
  getHarvestById,
  createHarvest,
  updateHarvest,
  deleteHarvest,
} from '../controllers/harvestController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authenticateTokenOrApiKey } from '../middleware/apiKeyMiddleware.js';

const router = Router();

// GET: boleh JWT atau API key (read-only). Tulis (POST/PUT/DELETE): wajib JWT.
router.use((req, res, next) => {
  if (req.method === 'GET') return authenticateTokenOrApiKey(req, res, next);
  return authenticateToken(req, res, next);
});

// CRUD Data Panen
router.get('/', getHarvests);           // GET /api/harvest?page=1&limit=10&search=...
router.get('/:id', getHarvestById);     // GET /api/harvest/:id
router.post('/', createHarvest);        // POST /api/harvest
router.put('/:id', updateHarvest);      // PUT /api/harvest/:id
router.delete('/:id', deleteHarvest);   // DELETE /api/harvest/:id

export default router;
