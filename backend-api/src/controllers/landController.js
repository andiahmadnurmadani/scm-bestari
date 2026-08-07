import { getPool } from '../config/db.js';

// ── Helper ────────────────────────────────────────────────────────────────────

/** Konversi baris DB (snake_case) ke format frontend (camelCase). */
function mapRowToLand(row) {
  return {
    id: String(row.id),
    kodeLahan: row.kode_lahan,
    namaLahan: row.nama_lahan,
    lokasiDesa: row.lokasi_desa,
    kecamatan: row.kecamatan,
    luasHektar: Number(row.luas_hektar),
    varietasSorgum: row.varietas_sorgum,
    statusIrigasi: row.status_irigasi,
    jenisTanah: row.jenis_tanah,
    pemilikKelompokTani: row.pemilik_kelompok_tani,
    statusKesiapan: row.status_kesiapan,
    statusBadge: row.status_badge || '',
    panenLaluTon: row.panen_lalu_ton != null ? Number(row.panen_lalu_ton) : 0,
    fotoUrl: row.foto_url || '',
    latitude: row.latitude != null ? Number(row.latitude) : undefined,
    longitude: row.longitude != null ? Number(row.longitude) : undefined,
    createdAt: row.created_at,
  };
}

/** Validasi field wajib & enum, mengembalikan pesan error atau null. */
function validateLand(data) {
  const irigasiValues = ['Irigasi Teknis', 'Tadah Hujan', 'Semi Teknis'];
  const kesiapanValues = ['Siap Tanam', 'Masa Pertumbuhan', 'Masa Panen', 'Bera (Istirahat)'];

  if (!data.namaLahan || !String(data.namaLahan).trim()) return 'Nama lahan wajib diisi.';
  if (!data.lokasiDesa || !String(data.lokasiDesa).trim()) return 'Lokasi desa wajib diisi.';
  if (!data.kecamatan || !String(data.kecamatan).trim()) return 'Kecamatan wajib diisi.';
  if (data.luasHektar == null || Number(data.luasHektar) < 0) return 'Luas lahan tidak valid.';
  if (!data.fotoUrl || !String(data.fotoUrl).trim()) return 'Foto lahan wajib diisi.';
  if (data.statusIrigasi && !irigasiValues.includes(data.statusIrigasi)) return 'Status irigasi tidak valid.';
  if (data.statusKesiapan && !kesiapanValues.includes(data.statusKesiapan)) return 'Status kesiapan tidak valid.';
  return null;
}

// ── Controller: Daftar Lahan (dengan pagination) ──────────────────────────────

/**
 * GET /api/land?page=1&limit=10&search=...
 * Mengembalikan { data, pagination }
 */
export async function getLands(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = String(req.query.search || '').trim();
    const offset = (page - 1) * limit;

    const whereClause = search
      ? `WHERE kode_lahan LIKE ? OR nama_lahan LIKE ? OR lokasi_desa LIKE ? OR varietas_sorgum LIKE ? OR pemilik_kelompok_tani LIKE ?`
      : '';
    const searchPattern = `%${search}%`;
    const params = search ? [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern] : [];

    const pool = getPool();

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM lands ${whereClause}`,
      params
    );
    const total = Number(countRows[0].total);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // NOTE: pakai pool.query() (bukan execute) karena MySQL 8.4 + mysql2
    // melempar "Incorrect arguments to mysqld_stmt_execute" pada LIMIT ? OFFSET ?
    const [rows] = await pool.query(
      `SELECT id, kode_lahan, nama_lahan, lokasi_desa, kecamatan, luas_hektar,
              varietas_sorgum, status_irigasi, jenis_tanah, pemilik_kelompok_tani,
              status_kesiapan, status_badge, panen_lalu_ton, foto_url, latitude, longitude, created_at
       FROM lands
       ${whereClause}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: rows.map(mapRowToLand),
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
    console.error('[getLands] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data lahan.' });
  }
}

// ── Controller: Detail Satu Lahan ─────────────────────────────────────────────

export async function getLandById(req, res) {
  try {
    const [rows] = await getPool().execute(
      `SELECT id, kode_lahan, nama_lahan, lokasi_desa, kecamatan, luas_hektar,
              varietas_sorgum, status_irigasi, jenis_tanah, pemilik_kelompok_tani,
              status_kesiapan, status_badge, panen_lalu_ton, foto_url, latitude, longitude, created_at
       FROM lands WHERE id = ? LIMIT 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data lahan tidak ditemukan.' });
    }

    return res.status(200).json({ success: true, data: mapRowToLand(rows[0]) });
  } catch (error) {
    console.error('[getLandById] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail lahan.' });
  }
}

// ── Controller: Buat Lahan Baru ───────────────────────────────────────────────

export async function createLand(req, res) {
  try {
    const data = req.body || {};
    const validationError = validateLand(data);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const pool = getPool();

    // Buat kode lahan otomatis bila tidak disertakan
    let kodeLahan = String(data.kodeLahan || '').trim();
    if (!kodeLahan) {
      const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM lands');
      const seq = Number(countRows[0].total) + 1;
      kodeLahan = `BLK-LHN-${String(seq).padStart(2, '0')}`;
    }

    const [result] = await pool.execute(
      `INSERT INTO lands
        (kode_lahan, nama_lahan, lokasi_desa, kecamatan, luas_hektar, varietas_sorgum,
         status_irigasi, jenis_tanah, pemilik_kelompok_tani, status_kesiapan,
         status_badge, panen_lalu_ton, foto_url, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kodeLahan,
        String(data.namaLahan).trim(),
        String(data.lokasiDesa).trim(),
        String(data.kecamatan).trim(),
        Number(data.luasHektar),
        String(data.varietasSorgum || '').trim(),
        data.statusIrigasi || 'Irigasi Teknis',
        String(data.jenisTanah || '').trim(),
        String(data.pemilikKelompokTani || '').trim(),
        data.statusKesiapan || 'Siap Tanam',
        data.statusBadge || null,
        data.panenLaluTon != null ? Number(data.panenLaluTon) : 0,
        data.fotoUrl || null,
        data.latitude != null ? Number(data.latitude) : null,
        data.longitude != null ? Number(data.longitude) : null,
      ]
    );

    const [newRow] = await pool.execute(
      `SELECT id, kode_lahan, nama_lahan, lokasi_desa, kecamatan, luas_hektar,
              varietas_sorgum, status_irigasi, jenis_tanah, pemilik_kelompok_tani,
              status_kesiapan, status_badge, panen_lalu_ton, foto_url, latitude, longitude, created_at
       FROM lands WHERE id = ? LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Data lahan berhasil ditambahkan.',
      data: mapRowToLand(newRow[0]),
    });
  } catch (error) {
    console.error('[createLand] Error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Kode lahan sudah digunakan.' });
    }
    return res.status(500).json({ success: false, message: 'Gagal menambahkan data lahan.' });
  }
}

// ── Controller: Update Lahan ──────────────────────────────────────────────────

export async function updateLand(req, res) {
  try {
    const { id } = req.params;
    const data = req.body || {};

    const pool = getPool();

    const [existing] = await pool.execute('SELECT id FROM lands WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Data lahan tidak ditemukan.' });
    }

    // Foto lahan wajib — tolak jika dikirim kosong (menghapus foto)
    if (data.fotoUrl !== undefined && !String(data.fotoUrl).trim()) {
      return res.status(400).json({ success: false, message: 'Foto lahan wajib diisi.' });
    }

    const fieldMap = {
      kodeLahan: 'kode_lahan',
      namaLahan: 'nama_lahan',
      lokasiDesa: 'lokasi_desa',
      kecamatan: 'kecamatan',
      luasHektar: 'luas_hektar',
      varietasSorgum: 'varietas_sorgum',
      statusIrigasi: 'status_irigasi',
      jenisTanah: 'jenis_tanah',
      pemilikKelompokTani: 'pemilik_kelompok_tani',
      statusKesiapan: 'status_kesiapan',
      statusBadge: 'status_badge',
      panenLaluTon: 'panen_lalu_ton',
      fotoUrl: 'foto_url',
      latitude: 'latitude',
      longitude: 'longitude',
    };

    const sets = [];
    const values = [];
    for (const [key, column] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        sets.push(`${column} = ?`);
        values.push(data[key] === '' && ['latitude', 'longitude', 'statusBadge'].includes(key) ? null : data[key]);
      }
    }

    if (sets.length > 0) {
      await pool.execute(`UPDATE lands SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    }

    const [updatedRow] = await pool.execute(
      `SELECT id, kode_lahan, nama_lahan, lokasi_desa, kecamatan, luas_hektar,
              varietas_sorgum, status_irigasi, jenis_tanah, pemilik_kelompok_tani,
              status_kesiapan, status_badge, panen_lalu_ton, foto_url, latitude, longitude, created_at
       FROM lands WHERE id = ? LIMIT 1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Data lahan berhasil diperbarui.',
      data: mapRowToLand(updatedRow[0]),
    });
  } catch (error) {
    console.error('[updateLand] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data lahan.' });
  }
}

// ── Controller: Hapus Lahan ───────────────────────────────────────────────────

export async function deleteLand(req, res) {
  try {
    const pool = getPool();
    const [result] = await pool.execute('DELETE FROM lands WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data lahan tidak ditemukan.' });
    }

    return res.status(200).json({ success: true, message: 'Data lahan berhasil dihapus.' });
  } catch (error) {
    console.error('[deleteLand] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menghapus data lahan.' });
  }
}
