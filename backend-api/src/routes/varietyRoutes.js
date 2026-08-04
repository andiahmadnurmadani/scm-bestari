import { Router } from 'express';
import {
  getVarieties,
  createVariety,
  updateVariety,
  deleteVariety,
} from '../controllers/varietyController.js';

const router = Router();

// Master Data Varietas Sorgum
router.get('/', getVarieties);          // GET /api/varieties
router.post('/', createVariety);        // POST /api/varieties
router.put('/:id', updateVariety);      // PUT /api/varieties/:id
router.delete('/:id', deleteVariety);   // DELETE /api/varieties/:id

export default router;
