import { Router } from 'express';
import { getPublicBatchTrace } from '../controllers/publicTraceController.js';

const router = Router();

// Endpoint publik — TANPA auth (untuk QR trace batch stok)
// GET /api/public/trace/:kodeBatchStok
router.get('/trace/:kodeBatchStok', getPublicBatchTrace);

export default router;
