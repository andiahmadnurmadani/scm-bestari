import { Router } from 'express';
import { getPlantings, getPlantingById, createPlanting, updatePlanting, deletePlanting } from '../controllers/plantingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authenticateTokenOrApiKey } from '../middleware/apiKeyMiddleware.js';

const router = Router();

router.use((req, res, next) => {
  if (req.method === 'GET') return authenticateTokenOrApiKey(req, res, next);
  return authenticateToken(req, res, next);
});

router.get('/', getPlantings);
router.get('/:id', getPlantingById);
router.post('/', createPlanting);
router.put('/:id', updatePlanting);
router.delete('/:id', deletePlanting);

export default router;
