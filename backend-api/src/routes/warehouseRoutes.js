import { Router } from 'express';
import {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  stockIn,
  stockOut,
  processSosoh,
  getWarehouseOptions,
  getHarvestOptions,
  getStockBatchesByWarehouse,
  getAllStockSorgum,
  getWarehouseHistory,
  getBatchTrace,
} from '../controllers/warehouseController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authenticateTokenOrApiKey } from '../middleware/apiKeyMiddleware.js';

const router = Router();

// GET: boleh JWT atau API key (read-only). Tulis (POST/PUT/DELETE): wajib JWT.
router.use((req, res, next) => {
  if (req.method === 'GET') return authenticateTokenOrApiKey(req, res, next);
  return authenticateToken(req, res, next);
});

// Opsi gudang (untuk dropdown olahan) — HARUS sebelum /:id
router.get('/options', getWarehouseOptions);
router.get('/harvest-options', getHarvestOptions);
// Semua batch stok SORGUM lintas gudang (dropdown bahan produksi 1 tahap) — HARUS sebelum /:id
router.get('/stock-sorgum/all', getAllStockSorgum);

// CRUD gudang
router.get('/', getWarehouses);
router.get('/:id', getWarehouseById);
router.post('/', createWarehouse);
router.put('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);

// Pergerakan stok (FIFO)
router.get('/:id/stock-batches', getStockBatchesByWarehouse);
router.post('/stock/in', stockIn);
router.post('/stock/out', stockOut);
router.post('/stock/sosoh', processSosoh);

// Riwayat aktivitas gudang (masuk / keluar / sosoh) — filter bulan & cari
router.get('/:id/history', getWarehouseHistory);
// Trace lengkap batch stok (tanam → panen → gudang → olahan → logistik)
router.get('/:gudangId/trace/:batchId', getBatchTrace);

export default router;
