import { getPool } from '../config/db.js';

// ── Helper ────────────────────────────────────────────────────────────────────

function mapRowToProduct(row) {
  return {
    id: String(row.id),
    name: row.name,
    satuanHasil: row.satuan_hasil || 'Pouch',
    deskripsi: row.deskripsi || '',
    fotoUrl: row.foto_url || null,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

/** Validasi satuan hasil yang diizinkan (sama dengan opsi dropdown form olahan). */
const SATUAN_IZIN = ['Pouch', 'Kg', 'Botol', 'Box', 'Toples', 'Kemasan'];

// ── Controller: Daftar Produk (master data) ───────────────────────────────────

export async function getProducts(req, res) {
  try {
    const { isActive } = req.query;
    const params = [];
    let where = '';
    if (isActive !== undefined && String(isActive) !== '') {
      where = 'WHERE is_active = ?';
      params.push(isActive === '1' || isActive === 'true' ? 1 : 0);
    }
    const [rows] = await getPool().query(
      `SELECT id, name, satuan_hasil, deskripsi, foto_url, is_active, created_at
       FROM products ${where} ORDER BY name ASC`,
      params
    );
    return res.status(200).json({
      success: true,
      data: rows.map(mapRowToProduct),
    });
  } catch (error) {
    console.error('[getProducts] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data produk.' });
  }
}

// ── Controller: Detail Produk ─────────────────────────────────────────────────

export async function getProductById(req, res) {
  try {
    const [rows] = await getPool().execute(
      'SELECT id, name, satuan_hasil, deskripsi, foto_url, is_active, created_at FROM products WHERE id = ? LIMIT 1',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, data: mapRowToProduct(rows[0]) });
  } catch (error) {
    console.error('[getProductById] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail produk.' });
  }
}

// ── Controller: Buat Produk Baru ──────────────────────────────────────────────

export async function createProduct(req, res) {
  try {
    const { name, satuanHasil, deskripsi, fotoUrl } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Nama produk wajib diisi.' });
    }
    const satuan = SATUAN_IZIN.includes(satuanHasil) ? satuanHasil : 'Pouch';

    const [result] = await getPool().execute(
      'INSERT INTO products (name, satuan_hasil, deskripsi, foto_url) VALUES (?, ?, ?, ?)',
      [String(name).trim(), satuan, deskripsi || '', fotoUrl || null]
    );

    const [newRow] = await getPool().execute(
      'SELECT id, name, satuan_hasil, deskripsi, foto_url, is_active, created_at FROM products WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan.',
      data: mapRowToProduct(newRow[0]),
    });
  } catch (error) {
    console.error('[createProduct] Error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Nama produk sudah ada.' });
    }
    return res.status(500).json({ success: false, message: 'Gagal menambahkan produk.' });
  }
}

// ── Controller: Update Produk ─────────────────────────────────────────────────

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, satuanHasil, deskripsi, fotoUrl, isActive } = req.body || {};

    const pool = getPool();
    const [existing] = await pool.execute('SELECT id FROM products WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    const sets = [];
    const values = [];
    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ success: false, message: 'Nama produk tidak boleh kosong.' });
      }
      sets.push('name = ?');
      values.push(String(name).trim());
    }
    if (satuanHasil !== undefined) {
      sets.push('satuan_hasil = ?');
      values.push(SATUAN_IZIN.includes(satuanHasil) ? satuanHasil : 'Pouch');
    }
    if (deskripsi !== undefined) {
      sets.push('deskripsi = ?');
      values.push(deskripsi);
    }
    if (fotoUrl !== undefined) {
      sets.push('foto_url = ?');
      values.push(fotoUrl || null);
    }
    if (isActive !== undefined) {
      sets.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }

    if (sets.length > 0) {
      await pool.execute(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    }

    const [updatedRow] = await pool.execute(
      'SELECT id, name, satuan_hasil, deskripsi, foto_url, is_active, created_at FROM products WHERE id = ? LIMIT 1',
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Produk berhasil diperbarui.',
      data: mapRowToProduct(updatedRow[0]),
    });
  } catch (error) {
    console.error('[updateProduct] Error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Nama produk sudah ada.' });
    }
    return res.status(500).json({ success: false, message: 'Gagal memperbarui produk.' });
  }
}

// ── Controller: Hapus Produk ──────────────────────────────────────────────────

export async function deleteProduct(req, res) {
  try {
    const pool = getPool();

    // Cek apakah produk sedang dipakai di production_batches
    const [usage] = await pool.execute(
      'SELECT COUNT(*) AS total FROM production_batches WHERE product_id = ?',
      [req.params.id]
    );
    if (Number(usage[0].total) > 0) {
      return res.status(409).json({
        success: false,
        message: `Produk ini digunakan oleh ${usage[0].total} batch olahan. Nonaktifkan saja daripada menghapus.`,
      });
    }

    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    return res.status(200).json({ success: true, message: 'Produk berhasil dihapus.' });
  } catch (error) {
    console.error('[deleteProduct] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menghapus produk.' });
  }
}
