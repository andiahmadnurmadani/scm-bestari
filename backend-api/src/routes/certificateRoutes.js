import { Router } from 'express';
import {
  getCertificates,
  getCertificateById,
  createCertificate,
  updateCertificate,
  deleteCertificate,
} from '../controllers/certificateController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Semua endpoint wajib login (JWT)
router.use(authenticateToken);

// CRUD Kelola Sertifikat
router.get('/', getCertificates);           // GET /api/certificates?page=1&limit=10&search=...
router.get('/:id', getCertificateById);     // GET /api/certificates/:id
router.post('/', createCertificate);        // POST /api/certificates
router.put('/:id', updateCertificate);      // PUT /api/certificates/:id
router.delete('/:id', deleteCertificate);   // DELETE /api/certificates/:id

export default router;
