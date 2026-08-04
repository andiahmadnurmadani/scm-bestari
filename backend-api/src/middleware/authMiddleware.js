import jwt from 'jsonwebtoken';

/**
 * Middleware: verifikasi token JWT dari header Authorization: Bearer <token>.
 * Jika valid, user id dilekatkan ke req.userId dan lanjut ke handler berikutnya.
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Tidak ada token. Silakan login terlebih dahulu.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sorgum_scm_secret');
    req.userId = decoded.sub;
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau sudah kedaluwarsa.',
    });
  }
}
