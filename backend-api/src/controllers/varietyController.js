import { getPool } from '../config/db.js';

// ── Helper ────────────────────────────────────────────────────────────────────

function mapRowToVariety(row) {
  return {
    id: String(row.id),
    name: row.name,
    description: row.description || '',
    imageUrl: row.image_url || null,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

// ── Controller: Daftar Varietas (master data) ─────────────────────────────────

export async function getVarieties(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, name, description, image_url, is_active, created_at FROM varieties ORDER BY name ASC'
    );
    return res.status(200).json({
      success: true,
      data: rows.map(mapRowToVariety),
    });
  } catch (error) {
    console.error('[getVarieties] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data varietas.' });
  }
}

// ── Controller: Buat Varietas Baru ────────────────────────────────────────────

export async function createVariety(req, res) {
  try {
    const { name, description, imageUrl } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Nama varietas wajib diisi.' });
    }

    const [result] = await getPool().execute(
      'INSERT INTO varieties (name, description, image_url) VALUES (?, ?, ?)',
      [String(name).trim(), description || '', imageUrl || null]
    );

    const [newRow] = await getPool().execute(
      'SELECT id, name, description, image_url, is_active, created_at FROM varieties WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Varietas berhasil ditambahkan.',
      data: mapRowToVariety(newRow[0]),
    });
  } catch (error) {
    console.error('[createVariety] Error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Nama varietas sudah ada.' });
    }
    return res.status(500).json({ success: false, message: 'Gagal menambahkan varietas.' });
  }
}

// ── Controller: Update Varietas ────────────────────────────────────────────────

export async function updateVariety(req, res) {
  try {
    const { id } = req.params;
    const { name, description, isActive, imageUrl } = req.body || {};

    const pool = getPool();
    const [existing] = await pool.execute('SELECT id FROM varieties WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Varietas tidak ditemukan.' });
    }

    // Bangun SET dinamis dari field yang dikirim
    const sets = [];
    const values = [];
    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ success: false, message: 'Nama varietas tidak boleh kosong.' });
      }
      sets.push('name = ?');
      values.push(String(name).trim());
    }
    if (description !== undefined) {
      sets.push('description = ?');
      values.push(description);
    }
    if (isActive !== undefined) {
      sets.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }
    if (imageUrl !== undefined) {
      sets.push('image_url = ?');
      values.push(imageUrl);
    }

    if (sets.length > 0) {
      await pool.execute(`UPDATE varieties SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    }

    const [updatedRow] = await pool.execute(
      'SELECT id, name, description, image_url, is_active, created_at FROM varieties WHERE id = ? LIMIT 1',
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Varietas berhasil diperbarui.',
      data: mapRowToVariety(updatedRow[0]),
    });
  } catch (error) {
    console.error('[updateVariety] Error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Nama varietas sudah ada.' });
    }
    return res.status(500).json({ success: false, message: 'Gagal memperbarui varietas.' });
  }
}

// ── Controller: Hapus Varietas ────────────────────────────────────────────────

export async function deleteVariety(req, res) {
  try {
    const pool = getPool();

    // Cek apakah varietas sedang dipakai di tabel harvests
    const [usage] = await pool.execute(
      'SELECT COUNT(*) AS total FROM harvests WHERE varietas = (SELECT name FROM varieties WHERE id = ?)',
      [req.params.id]
    );
    if (Number(usage[0].total) > 0) {
      return res.status(409).json({
        success: false,
        message: `Varietas ini digunakan oleh ${usage[0].total} data panen. Nonaktifkan saja daripada menghapus.`,
      });
    }

    const [result] = await pool.execute('DELETE FROM varieties WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Varietas tidak ditemukan.' });
    }

    return res.status(200).json({ success: true, message: 'Varietas berhasil dihapus.' });
  } catch (error) {
    console.error('[deleteVariety] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menghapus varietas.' });
  }
}
