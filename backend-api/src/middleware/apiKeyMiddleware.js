import { getPool } from '../config/db.js';

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
 * Middleware autentikasi endpoint GET read-only: HANYA menerima API key (x-api-key).
 * Endpoint tulis (POST/PUT/DELETE) tetap memakai authenticateToken (JWT) terpisah.
 */
export async function authenticateTokenOrApiKey(req, res, next) {
  if (req.headers['x-api-key']) {
    return authenticateApiKey(req, res, next);
  }

  return res.status(401).json({
    success: false,
    message: 'Autentikasi diperlukan. Gunakan header x-api-key.',
  });
}
