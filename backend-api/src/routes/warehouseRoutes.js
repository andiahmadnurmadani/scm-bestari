import { Router } from 'express';
import {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  stockIn,
  stockOut,
  getWarehouseOptions,
} from '../controllers/warehouseController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Semua route warehouse butuh autentikasi
router.use(authenticateToken);

// Opsi gudang (untuk dropdown olahan) — HARUS sebelum /:id
router.get('/options', getWarehouseOptions);

// CRUD gudang
router.get('/', getWarehouses);
router.get('/:id', getWarehouseById);
router.post('/', createWarehouse);
router.put('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);

// Pergerakan stok (FIFO)
router.post('/stock/in', stockIn);
router.post('/stock/out', stockOut);

export default router;
