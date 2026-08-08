import { Router } from 'express';
import {
  getCertificates,
  getCertificateById,
  createCertificate,
  updateCertificate,
  deleteCertificate,
} from '../controllers/certificateController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authenticateTokenOrApiKey } from '../middleware/apiKeyMiddleware.js';

const router = Router();

// GET: boleh JWT atau API key (read-only). Tulis (POST/PUT/DELETE): wajib JWT.
router.use((req, res, next) => {
  if (req.method === 'GET') return authenticateTokenOrApiKey(req, res, next);
  return authenticateToken(req, res, next);
});

// CRUD Kelola Sertifikat
router.get('/', getCertificates);           // GET /api/certificates?page=1&limit=10&search=...
router.get('/:id', getCertificateById);     // GET /api/certificates/:id
router.post('/', createCertificate);        // POST /api/certificates
router.put('/:id', updateCertificate);      // PUT /api/certificates/:id
router.delete('/:id', deleteCertificate);   // DELETE /api/certificates/:id

export default router;
