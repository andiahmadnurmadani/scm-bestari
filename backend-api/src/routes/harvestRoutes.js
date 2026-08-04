import { Router } from 'express';
import {
  getHarvests,
  getHarvestById,
  createHarvest,
  updateHarvest,
  deleteHarvest,
} from '../controllers/harvestController.js';

const router = Router();

// CRUD Data Panen
router.get('/', getHarvests);           // GET /api/harvest?page=1&limit=10&search=...
router.get('/:id', getHarvestById);     // GET /api/harvest/:id
router.post('/', createHarvest);        // POST /api/harvest
router.put('/:id', updateHarvest);      // PUT /api/harvest/:id
router.delete('/:id', deleteHarvest);   // DELETE /api/harvest/:id

export default router;
