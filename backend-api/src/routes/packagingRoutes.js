import { Router } from 'express';
import {
  getPackagingList,
  getPackagingById,
  createPackaging,
  updatePackaging,
  deletePackaging,
} from '../controllers/packagingController.js';

const router = Router();

// CRUD Kelola Kemasan
router.get('/', getPackagingList);           // GET /api/packaging?page=1&limit=10&search=...
router.get('/:id', getPackagingById);        // GET /api/packaging/:id
router.post('/', createPackaging);           // POST /api/packaging
router.put('/:id', updatePackaging);         // PUT /api/packaging/:id
router.delete('/:id', deletePackaging);      // DELETE /api/packaging/:id

export default router;
