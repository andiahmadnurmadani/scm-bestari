import { Router } from 'express';
import { getCmsContent, saveCmsContent, resetCmsContent } from '../controllers/cmsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Baca konten CMS — publik (landing page butuh data tanpa login)
router.get('/', getCmsContent);

// Tulis & reset konten CMS — hanya untuk user terautentikasi (admin)
router.put('/', authenticateToken, saveCmsContent);
router.delete('/', authenticateToken, resetCmsContent);

export default router;
