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
  getWarehouseHistory,
  getBatchTrace,
} from '../controllers/warehouseController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Semua route warehouse butuh autentikasi
router.use(authenticateToken);

// Opsi gudang (untuk dropdown olahan) — HARUS sebelum /:id
router.get('/options', getWarehouseOptions);
router.get('/harvest-options', getHarvestOptions);

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
