import { Router } from 'express';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/logisticsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authenticateTokenOrApiKey } from '../middleware/apiKeyMiddleware.js';

const router = Router();

// GET: boleh JWT atau API key (read-only). Tulis (POST/PUT/DELETE): wajib JWT.
router.use((req, res, next) => {
  if (req.method === 'GET') return authenticateTokenOrApiKey(req, res, next);
  return authenticateToken(req, res, next);
});

// CRUD Logistik & Keuangan
router.get('/', getExpenses);           // GET /api/logistics?page=1&limit=10&search=...
router.get('/:id', getExpenseById);     // GET /api/logistics/:id
router.post('/', createExpense);        // POST /api/logistics
router.put('/:id', updateExpense);      // PUT /api/logistics/:id
router.delete('/:id', deleteExpense);   // DELETE /api/logistics/:id

// Kompatibilitas endpoint lama yang dipakai frontend (expenses)
router.get('/expenses', getExpenses);            // GET /api/logistics/expenses
router.post('/expenses', createExpense);         // POST /api/logistics/expenses

export default router;
