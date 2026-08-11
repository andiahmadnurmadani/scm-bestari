import { getPool } from '../config/db.js';
import jwt from 'jsonwebtoken';

/**
 * Middleware: verifikasi API key dari header `x-api-key` (read-only).
 * Jika valid, id key dilekatkan ke req.apiKeyId dan lanjut ke handler.
 * Key harus: ada di tabel api_keys, is_active = 1, dan belum di-revoke.
 */
export async function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || '';

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key tidak ditemukan. Sertakan header x-api-key.',
    });
  }

  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT id, nama, is_active, revoked_at FROM api_keys WHERE key_value = ? LIMIT 1`,
      [apiKey]
    );

    if (rows.length === 0 || Number(rows[0].is_active) !== 1 || rows[0].revoked_at) {
      return res.status(401).json({
        success: false,
        message: 'API key tidak valid atau sudah dinonaktifkan.',
      });
    }

    // Catat waktu terakhir dipakai
    await pool.execute(`UPDATE api_keys SET last_used_at = NOW() WHERE id = ?`, [rows[0].id]);

    req.apiKeyId = rows[0].id;
    return next();
  } catch (err) {
    console.error('[authenticateApiKey] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
}

/**
 * Middleware autentikasi endpoint GET read-only:
 * menerima JWT Bearer (login admin) ATAU API key (x-api-key).
 * Endpoint tulis (POST/PUT/DELETE) tetap memakai authenticateToken (JWT) terpisah.
 */
export async function authenticateTokenOrApiKey(req, res, next) {
  // 1) Prioritas: JWT Bearer (login admin)
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(
        authHeader.slice(7),
        process.env.JWT_SECRET || 'sorgum_scm_secret'
      );
      req.userId = decoded.sub;
      return next();
    } catch {
      // Token invalid → coba API key; jika tidak ada, 401
    }
  }

  // 2) Fallback: API key (x-api-key)
  if (req.headers['x-api-key']) {
    return authenticateApiKey(req, res, next);
  }

  return res.status(401).json({
    success: false,
    message: 'Autentikasi diperlukan. Gunakan token login (Bearer) atau header x-api-key.',
  });
}
