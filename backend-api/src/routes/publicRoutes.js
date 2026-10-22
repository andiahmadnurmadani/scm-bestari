import { Router } from 'express';
import { getPublicBatchTrace } from '../controllers/publicTraceController.js';
import { getPublicKemasan, getQrTrace, getQrKemasan, getPublicProduk, getQrProduk } from '../controllers/publicKemasanController.js';

const router = Router();

// Endpoint publik — TANPA auth
// GET /api/public/trace/:kodeBatchStok        → riwayat batch (halaman /trace)
router.get('/trace/:kodeBatchStok', getPublicBatchTrace);
// GET /api/public/kemasan/:kodeKemasan        → info produk dari kemasan (halaman /kemasan)
router.get('/kemasan/:kodeKemasan', getPublicKemasan);
// GET /api/public/qr/trace/:kodeBatchStok     → gambar QR (PNG/SVG) ke halaman lacak batch
router.get('/qr/trace/:kodeBatchStok', getQrTrace);
// GET /api/public/qr/kemasan/:kodeKemasan     → gambar QR (PNG/SVG) ke halaman kemasan
router.get('/qr/kemasan/:kodeKemasan', getQrKemasan);

// GET /api/public/produk/:kodeBatch           → cerita satu batch olahan (halaman /produk) — 1 olahan = 1 QR
router.get('/produk/:kodeBatch', getPublicProduk);
// GET /api/public/qr/produk/:kodeBatch        → gambar QR (PNG/SVG) ke halaman produk batch
router.get('/qr/produk/:kodeBatch', getQrProduk);

export default router;
