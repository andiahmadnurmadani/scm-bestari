import { Router } from 'express';
import {
  getEquipmentList,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from '../controllers/equipmentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Semua endpoint wajib login (JWT)
router.use(authenticateToken);

// CRUD Sarana & Peralatan
router.get('/', getEquipmentList);           // GET /api/equipment?page=1&limit=10&search=...
router.get('/:id', getEquipmentById);        // GET /api/equipment/:id
router.post('/', createEquipment);           // POST /api/equipment
router.put('/:id', updateEquipment);         // PUT /api/equipment/:id
router.delete('/:id', deleteEquipment);      // DELETE /api/equipment/:id

export default router;
