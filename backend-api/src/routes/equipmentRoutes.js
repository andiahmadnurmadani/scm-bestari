import { Router } from 'express';
import {
  getEquipmentList,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from '../controllers/equipmentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authenticateTokenOrApiKey } from '../middleware/apiKeyMiddleware.js';

const router = Router();

// GET: boleh JWT atau API key (read-only). Tulis (POST/PUT/DELETE): wajib JWT.
router.use((req, res, next) => {
  if (req.method === 'GET') return authenticateTokenOrApiKey(req, res, next);
  return authenticateToken(req, res, next);
});

// CRUD Sarana & Peralatan
router.get('/', getEquipmentList);           // GET /api/equipment?page=1&limit=10&search=...
router.get('/:id', getEquipmentById);        // GET /api/equipment/:id
router.post('/', createEquipment);           // POST /api/equipment
router.put('/:id', updateEquipment);         // PUT /api/equipment/:id
router.delete('/:id', deleteEquipment);      // DELETE /api/equipment/:id

export default router;
