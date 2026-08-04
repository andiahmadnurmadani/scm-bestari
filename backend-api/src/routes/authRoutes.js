import { Router } from 'express';
import { register, login, me, logout, updateProfile, changePassword } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Rute publik
router.post('/register', register); // Daftar akun baru
router.post('/login', login);       // Login (email + password)
router.post('/logout', logout);     // Logout (stateless, untuk kompatibilitas)

// Rute terproteksi
router.get('/me', authenticateToken, me);                         // Profil user aktif
router.put('/me', authenticateToken, updateProfile);              // Update profil user
router.put('/me/password', authenticateToken, changePassword);    // Ganti kata sandi

export default router;
