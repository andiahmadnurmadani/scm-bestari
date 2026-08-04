import { getPool } from '../config/db.js';

// ── Helper ────────────────────────────────────────────────────────────────────

/** Konversi baris DB (snake_case) ke format frontend (camelCase). */
function mapRowToEquipment(row) {
  return {
    id: String(row.id),
    kodeAlat: row.kode_alat,
    namaPeralatan: row.nama_peralatan,
    kategori: row.kategori,
    jumlahStok: Number(row.jumlah_stok),
    kondisi: row.kondisi,
    status: row.status,
    lokasiPenyimpanan: row.lokasi_penyimpanan,
    tanggalPengadaan: row.tanggal_pengadaan || '',
    spesifikasi: row.spesifikasi || '',
    fotoUrl: row.foto_url || '',
    terakhirServis: row.terakhir_servis || '',
    createdAt: row.created_at,
  };
}

/** Validasi field wajib & enum, mengembalikan pesan error atau null. */
function validateEquipment(data) {
  const kondisiValues = ['Sangat Baik', 'Baik', 'Perlu Perbaikan', 'Rusak'];
  const statusValues = ['Tersedia', 'Sedang Digunakan', 'Dalam Perawatan', 'Diarsipkan'];

  if (!data.namaPeralatan || !String(data.namaPeralatan).trim()) return 'Nama peralatan wajib diisi.';
  if (!data.kategori || !String(data.kategori).trim()) return 'Kategori wajib diisi.';
  if (data.jumlahStok == null || Number(data.jumlahStok) < 0) return 'Jumlah stok tidak valid.';
  if (data.kondisi && !kondisiValues.includes(data.kondisi)) return 'Kondisi tidak valid.';
  if (data.status && !statusValues.includes(data.status)) return 'Status tidak valid.';
  return null;
}

// ── Controller: Daftar Peralatan (dengan pagination) ──────────────────────────

/**
 * GET /api/equipment?page=1&limit=10&search=...
 * Mengembalikan { data, pagination }
 */
export async function getEquipmentList(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = String(req.query.search || '').trim();
    const offset = (page - 1) * limit;

    const whereClause = search
      ? `WHERE kode_alat LIKE ? OR nama_peralatan LIKE ? OR kategori LIKE ? OR lokasi_penyimpanan LIKE ?`
      : '';
    const searchPattern = `%${search}%`;
    const params = search ? [searchPattern, searchPattern, searchPattern, searchPattern] : [];

    const pool = getPool();

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM equipment ${whereClause}`,
      params
    );
    const total = Number(countRows[0].total);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // NOTE: pakai pool.query() (bukan execute) karena MySQL 8.4 + mysql2
    // melempar "Incorrect arguments to mysqld_stmt_execute" pada LIMIT ? OFFSET ?
    const [rows] = await pool.query(
      `SELECT id, kode_alat, nama_peralatan, kategori, jumlah_stok, kondisi, status,
              lokasi_penyimpanan, tanggal_pengadaan, spesifikasi, foto_url, terakhir_servis, created_at
       FROM equipment
       ${whereClause}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: rows.map(mapRowToEquipment),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('[getEquipmentList] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data peralatan.' });
  }
}

// ── Controller: Detail Satu Peralatan ─────────────────────────────────────────

export async function getEquipmentById(req, res) {
  try {
    const [rows] = await getPool().execute(
      `SELECT id, kode_alat, nama_peralatan, kategori, jumlah_stok, kondisi, status,
              lokasi_penyimpanan, tanggal_pengadaan, spesifikasi, foto_url, terakhir_servis, created_at
       FROM equipment WHERE id = ? LIMIT 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data peralatan tidak ditemukan.' });
    }

    return res.status(200).json({ success: true, data: mapRowToEquipment(rows[0]) });
  } catch (error) {
    console.error('[getEquipmentById] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail peralatan.' });
  }
}

// ── Controller: Buat Peralatan Baru ───────────────────────────────────────────

export async function createEquipment(req, res) {
  try {
    const data = req.body || {};
    const validationError = validateEquipment(data);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const pool = getPool();

    // Buat kode alat otomatis bila tidak disertakan
    let kodeAlat = String(data.kodeAlat || '').trim();
    if (!kodeAlat) {
      const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM equipment');
      const seq = Number(countRows[0].total) + 1;
      kodeAlat = `S-${String(seq).padStart(3, '0')}`;
    }

    const [result] = await pool.execute(
      `INSERT INTO equipment
        (kode_alat, nama_peralatan, kategori, jumlah_stok, kondisi, status,
         lokasi_penyimpanan, tanggal_pengadaan, spesifikasi, foto_url, terakhir_servis)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kodeAlat,
        String(data.namaPeralatan).trim(),
        String(data.kategori).trim(),
        Number(data.jumlahStok),
        data.kondisi || 'Baik',
        data.status || 'Tersedia',
        String(data.lokasiPenyimpanan || '').trim(),
        data.tanggalPengadaan || '',
        data.spesifikasi || '',
        data.fotoUrl || null,
        data.terakhirServis || '',
      ]
    );

    const [newRow] = await pool.execute(
      `SELECT id, kode_alat, nama_peralatan, kategori, jumlah_stok, kondisi, status,
              lokasi_penyimpanan, tanggal_pengadaan, spesifikasi, foto_url, terakhir_servis, created_at
       FROM equipment WHERE id = ? LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Data peralatan berhasil ditambahkan.',
      data: mapRowToEquipment(newRow[0]),
    });
  } catch (error) {
    console.error('[createEquipment] Error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Kode alat sudah digunakan.' });
    }
    return res.status(500).json({ success: false, message: 'Gagal menambahkan data peralatan.' });
  }
}

// ── Controller: Update Peralatan ──────────────────────────────────────────────

export async function updateEquipment(req, res) {
  try {
    const { id } = req.params;
    const data = req.body || {};

    const pool = getPool();

    const [existing] = await pool.execute('SELECT id FROM equipment WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Data peralatan tidak ditemukan.' });
    }

    const fieldMap = {
      kodeAlat: 'kode_alat',
      namaPeralatan: 'nama_peralatan',
      kategori: 'kategori',
      jumlahStok: 'jumlah_stok',
      kondisi: 'kondisi',
      status: 'status',
      lokasiPenyimpanan: 'lokasi_penyimpanan',
      tanggalPengadaan: 'tanggal_pengadaan',
      spesifikasi: 'spesifikasi',
      fotoUrl: 'foto_url',
      terakhirServis: 'terakhir_servis',
    };

    const sets = [];
    const values = [];
    for (const [key, column] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        sets.push(`${column} = ?`);
        values.push(data[key]);
      }
    }

    if (sets.length > 0) {
      await pool.execute(`UPDATE equipment SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    }

    const [updatedRow] = await pool.execute(
      `SELECT id, kode_alat, nama_peralatan, kategori, jumlah_stok, kondisi, status,
              lokasi_penyimpanan, tanggal_pengadaan, spesifikasi, foto_url, terakhir_servis, created_at
       FROM equipment WHERE id = ? LIMIT 1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Data peralatan berhasil diperbarui.',
      data: mapRowToEquipment(updatedRow[0]),
    });
  } catch (error) {
    console.error('[updateEquipment] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data peralatan.' });
  }
}

// ── Controller: Hapus Peralatan ───────────────────────────────────────────────

export async function deleteEquipment(req, res) {
  try {
    const pool = getPool();
    const [result] = await pool.execute('DELETE FROM equipment WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data peralatan tidak ditemukan.' });
    }

    return res.status(200).json({ success: true, message: 'Data peralatan berhasil dihapus.' });
  } catch (error) {
    console.error('[deleteEquipment] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menghapus data peralatan.' });
  }
}
