import { Router } from 'express';
import {
  getVarieties,
  createVariety,
  updateVariety,
  deleteVariety,
} from '../controllers/varietyController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Semua endpoint wajib login (JWT)
router.use(authenticateToken);

// Master Data Varietas Sorgum
router.get('/', getVarieties);          // GET /api/varieties
router.post('/', createVariety);        // POST /api/varieties
router.put('/:id', updateVariety);      // PUT /api/varieties/:id
router.delete('/:id', deleteVariety);   // DELETE /api/varieties/:id

export default router;
