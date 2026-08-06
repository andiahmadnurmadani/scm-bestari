import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool, query } from '../config/db.js';

// ── Helper ────────────────────────────────────────────────────────────────────

/** Membersihkan objek user dari field sensitif (password_hash). */
function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    role: row.role || 'Anggota KWT',
    avatar: row.avatar || null,
    jabatan: row.jabatan || '',
    namaKWT: row.nama_kwt || '',
    alamat: row.alamat || '',
    kecamatan: row.kecamatan || '',
    kabupaten: row.kabupaten || '',
    bio: row.bio || '',
    createdAt: row.created_at,
  };
}

/** Membuat token JWT untuk user id. */
function signToken(userId) {
  return jwt.sign(
    { sub: String(userId) },
    process.env.JWT_SECRET || 'sorgum_scm_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '14d' }
  );
}

// ── Controller: Register ──────────────────────────────────────────────────────

export async function register(req, res) {
  try {
    const { fullName, email, phone, password } = req.body || {};

    // ── Validasi input ──
    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, message: 'Email wajib diisi.' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi minimal 6 karakter.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Format email tidak valid.' });
    }

    // ── Cek duplikat email ──
    const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (existing.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: 'Email sudah terdaftar. Silakan gunakan email lain.' });
    }

    // ── Hash password & simpan user ──
    const passwordHash = await bcrypt.hash(String(password), 10);
    const [result] = await getPool().execute(
      'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [String(fullName).trim(), normalizedEmail, String(phone || '').trim(), passwordHash]
    );

    const user = {
      id: String(result.insertId),
      name: String(fullName).trim(),
      email: normalizedEmail,
      phone: String(phone || '').trim(),
      role: 'Anggota KWT',
    };

    // Langsung berikan token agar bisa langsung masuk setelah daftar
    const token = signToken(result.insertId);

    return res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil! Silakan masuk dengan akun baru Anda.',
      token,
      user,
    });
  } catch (error) {
    console.error('[register] Error:', error.message);
    return res
      .status(500)
      .json({ success: false, message: 'Terjadi kesalahan pada server. Silakan coba lagi.' });
  }
}

// ── Controller: Login ─────────────────────────────────────────────────────────

export async function login(req, res) {
  try {
    const { usernameOrEmail, password } = req.body || {};

    if (!usernameOrEmail || !String(usernameOrEmail).trim()) {
      return res.status(400).json({ success: false, message: 'Email wajib diisi.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Kata sandi wajib diisi.' });
    }

    // Login menerima email (usernameOrEmail di FE sebenarnya berisi email)
    const identifier = String(usernameOrEmail).trim().toLowerCase();
    const rows = await query(
      `SELECT id, name, email, phone, password_hash, role, avatar, created_at
       FROM users WHERE email = ? LIMIT 1`,
      [identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau kata sandi salah.' });
    }

    const userRow = rows[0];
    const isMatch = await bcrypt.compare(String(password), userRow.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau kata sandi salah.' });
    }

    const token = signToken(userRow.id);

    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: sanitizeUser(userRow),
    });
  } catch (error) {
    console.error('[login] Error:', error.message);
    return res
      .status(500)
      .json({ success: false, message: 'Terjadi kesalahan pada server. Silakan coba lagi.' });
  }
}

// ── Controller: Me (profil user aktif) ────────────────────────────────────────

export async function me(req, res) {
  try {
    const rows = await query(
      `SELECT id, name, email, phone, password_hash, role, avatar,
              jabatan, nama_kwt, alamat, kecamatan, kabupaten, bio, created_at
       FROM users WHERE id = ? LIMIT 1`,
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    return res.status(200).json({
      success: true,
      user: sanitizeUser(rows[0]),
    });
  } catch (error) {
    console.error('[me] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
}

// ── Controller: Update Profil ──────────────────────────────────────────────────

export async function updateProfile(req, res) {
  try {
    const data = req.body || {};
    const pool = getPool();

    const [existing] = await pool.execute('SELECT id FROM users WHERE id = ? LIMIT 1', [req.userId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    const fieldMap = {
      name: 'name',
      phone: 'phone',
      jabatan: 'jabatan',
      namaKWT: 'nama_kwt',
      alamat: 'alamat',
      kecamatan: 'kecamatan',
      kabupaten: 'kabupaten',
      bio: 'bio',
      avatar: 'avatar',
    };

    // Validasi ukuran avatar (base64 data URL, maks 2 MB file → ±2.7 MB base64)
    if (data.avatar !== undefined && data.avatar !== null && data.avatar !== '') {
      const avatarStr = String(data.avatar);
      const isDataUrl = avatarStr.startsWith('data:image/');
      const estimatedBytes = isDataUrl
        ? Math.floor((avatarStr.length - avatarStr.indexOf(',') - 1) * 0.75)
        : avatarStr.length;
      const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
      if (estimatedBytes > MAX_AVATAR_BYTES) {
        return res.status(400).json({
          success: false,
          message: 'Ukuran foto profil terlalu besar! Maksimal 2 MB.',
        });
      }
      if (!/^data:image\/(jpeg|png|webp|jpg);base64,/i.test(avatarStr)) {
        return res.status(400).json({
          success: false,
          message: 'Format foto profil tidak didukung! Gunakan JPG, PNG, atau WebP.',
        });
      }
    }

    const sets = [];
    const values = [];
    for (const [key, column] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        sets.push(`${column} = ?`);
        values.push(data[key] === '' ? null : data[key]);
      }
    }

    if (sets.length > 0) {
      await pool.execute(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...values, req.userId]);
    }

    const [updated] = await pool.execute(
      `SELECT id, name, email, phone, password_hash, role, avatar,
              jabatan, nama_kwt, alamat, kecamatan, kabupaten, bio, created_at
       FROM users WHERE id = ? LIMIT 1`,
      [req.userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      user: sanitizeUser(updated[0]),
    });
  } catch (error) {
    console.error('[updateProfile] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui profil.' });
  }
}

// ── Controller: Ganti Kata Sandi ──────────────────────────────────────────────

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const pool = getPool();

    if (!currentPassword || !String(currentPassword).trim()) {
      return res.status(400).json({ success: false, message: 'Kata sandi saat ini wajib diisi.' });
    }
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'Kata sandi baru minimal 6 karakter.' });
    }

    const [rows] = await pool.execute('SELECT id, password_hash FROM users WHERE id = ? LIMIT 1', [req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Kata sandi saat ini salah.' });
    }

    const newHash = await bcrypt.hash(String(newPassword), 10);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.userId]);

    return res.status(200).json({ success: true, message: 'Kata sandi berhasil diganti.' });
  } catch (error) {
    console.error('[changePassword] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengganti kata sandi.' });
  }
}

// ── Controller: Logout ────────────────────────────────────────────────────────
// JWT bersifat stateless; logout cukup dilakukan di sisi klien dengan
// menghapus token. Endpoint ini disediakan untuk kompatibilitas frontend.

export async function logout(_req, res) {
  return res.status(200).json({ success: true, message: 'Logout berhasil.' });
}
