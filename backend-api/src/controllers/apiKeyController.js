import crypto from 'crypto';
import { getPool } from '../config/db.js';

/** Konversi baris DB ke format respons FE (tampilkan key sebagian saja). */
function mapRowToApiKey(row) {
  return {
    id: String(row.id),
    nama: row.nama,
    // Tampilkan prefix saja — key penuh tidak bisa dibaca lagi setelah dibuat
    keyPreview: `${row.key_value.slice(0, 12)}...${row.key_value.slice(-4)}`,
    isActive: Boolean(row.is_active),
    lastUsedAt: row.last_used_at || null,
    createdAt: row.created_at,
    revokedAt: row.revoked_at || null,
  };
}

/** Membuat nilai key baru: sk-<48 hex>. */
function generateKeyValue() {
  return `sk-${crypto.randomBytes(24).toString('hex')}`;
}

// ── Controller: Daftar API Key ─────────────────────────────────────────────────

export async function getApiKeys(_req, res) {
  try {
    const [rows] = await getPool().query(
      `SELECT id, nama, key_value, is_active, last_used_at, created_at, revoked_at
       FROM api_keys
       ORDER BY created_at DESC, id DESC`
    );
    return res.status(200).json({
      success: true,
      data: rows.map(mapRowToApiKey),
    });
  } catch (error) {
    console.error('[getApiKeys] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar API key.' });
  }
}

// ── Controller: Buat API Key Baru ──────────────────────────────────────────────

export async function createApiKey(req, res) {
  try {
    const nama = String(req.body?.nama || '').trim();
    if (!nama) {
      return res.status(400).json({ success: false, message: 'Nama API key wajib diisi.' });
    }

    const keyValue = generateKeyValue();
    const [result] = await getPool().execute(
      `INSERT INTO api_keys (nama, key_value) VALUES (?, ?)`,
      [nama, keyValue]
    );

    // Kembalikan key PENUH sekali saja saat pembuatan
    return res.status(201).json({
      success: true,
      message: 'API key berhasil dibuat. Simpan key ini — tidak akan ditampilkan lagi.',
      data: {
        id: String(result.insertId),
        nama,
        keyValue, // full key, hanya sekali ini
        isActive: true,
      },
    });
  } catch (error) {
    console.error('[createApiKey] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal membuat API key.' });
  }
}

// ── Controller: Aktif / Nonaktifkan API Key ────────────────────────────────────

export async function updateApiKey(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};

    const pool = getPool();
    const [existing] = await pool.execute('SELECT id FROM api_keys WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'API key tidak ditemukan.' });
    }

    if (typeof isActive === 'boolean') {
      await pool.execute('UPDATE api_keys SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
    }

    const [row] = await pool.execute(
      `SELECT id, nama, key_value, is_active, last_used_at, created_at, revoked_at
       FROM api_keys WHERE id = ? LIMIT 1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: isActive === false ? 'API key dinonaktifkan.' : 'API key diaktifkan.',
      data: mapRowToApiKey(row[0]),
    });
  } catch (error) {
    console.error('[updateApiKey] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui API key.' });
  }
}

// ── Controller: Hapus API Key ──────────────────────────────────────────────────

export async function deleteApiKey(req, res) {
  try {
    const [result] = await getPool().execute('DELETE FROM api_keys WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'API key tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, message: 'API key berhasil dihapus.' });
  } catch (error) {
    console.error('[deleteApiKey] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menghapus API key.' });
  }
}
