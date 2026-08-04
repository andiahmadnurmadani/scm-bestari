import { Router } from 'express';
import {
  getLands,
  getLandById,
  createLand,
  updateLand,
  deleteLand,
} from '../controllers/landController.js';

const router = Router();

// CRUD Kelola Lahan
router.get('/', getLands);           // GET /api/land?page=1&limit=10&search=...
router.get('/:id', getLandById);     // GET /api/land/:id
router.post('/', createLand);        // POST /api/land
router.put('/:id', updateLand);      // PUT /api/land/:id
router.delete('/:id', deleteLand);   // DELETE /api/land/:id

export default router;
