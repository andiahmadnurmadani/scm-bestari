import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authenticateTokenOrApiKey } from '../middleware/apiKeyMiddleware.js';

const router = Router();

// GET: boleh JWT atau API key (read-only). Tulis (POST/PUT/DELETE): wajib JWT.
router.use((req, res, next) => {
  if (req.method === 'GET') return authenticateTokenOrApiKey(req, res, next);
  return authenticateToken(req, res, next);
});

// Master Data Produk Olahan
router.get('/', getProducts);            // GET /api/products
router.get('/:id', getProductById);      // GET /api/products/:id
router.post('/', createProduct);         // POST /api/products
router.put('/:id', updateProduct);       // PUT /api/products/:id
router.delete('/:id', deleteProduct);    // DELETE /api/products/:id

export default router;
