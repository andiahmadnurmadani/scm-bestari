import { getPool } from '../config/db.js';

// ── Helper ────────────────────────────────────────────────────────────────────

/** Konversi baris DB (snake_case) ke format frontend (camelCase). */
function mapRowToHarvest(row) {
  return {
    id: String(row.id),
    kodePanen: row.kode_panen,
    namaLahan: row.nama_lahan,
    varietas: row.varietas,
    tanggalPanen: row.tanggal_panen,
    jumlahHasilKg: Number(row.jumlah_hasil_kg),
    kualitasGrade: row.kualitas_grade,
    petaniPenanggungJawab: row.petani_penanggung_jawab,
    status: row.status,
    catatan: row.catatan || '',
    fotoUrl: row.foto_url || null,
    createdAt: row.created_at,
  };
}

/** Validasi field wajib & enum, mengembalikan pesan error atau null. */
function validateHarvest(data) {
  const gradeValues = ['Grade A (Premium)', 'Grade B (Standar)', 'Grade C (Pakan)'];
  const statusValues = ['Siap Panen', 'Dalam Proses', 'Selesai', 'Tersimpan di Gudang'];

  if (!data.namaLahan || !String(data.namaLahan).trim()) return 'Nama lahan wajib diisi.';
  if (!data.varietas || !String(data.varietas).trim()) return 'Varietas wajib diisi.';
  if (!data.tanggalPanen) return 'Tanggal panen wajib diisi.';
  if (data.jumlahHasilKg == null || Number(data.jumlahHasilKg) < 0) return 'Jumlah hasil panen tidak valid.';
  if (data.kualitasGrade && !gradeValues.includes(data.kualitasGrade)) return 'Kualitas grade tidak valid.';
  if (data.status && !statusValues.includes(data.status)) return 'Status tidak valid.';
  return null;
}

// ── Controller: Daftar Panen (dengan pagination) ──────────────────────────────

/**
 * GET /api/harvest?page=1&limit=10&search=...
 * Mengembalikan { data, pagination: { page, limit, total, totalPages, hasNext, hasPrev } }
 */
export async function getHarvests(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = String(req.query.search || '').trim();
    const offset = (page - 1) * limit;

    // Filter tambahan (semua opsional)
    const lahan = String(req.query.lahan || '').trim();
    const varietas = String(req.query.varietas || '').trim();
    const tanggalAwal = String(req.query.tanggalAwal || '').trim();
    const tanggalAkhir = String(req.query.tanggalAkhir || '').trim();
    const grade = String(req.query.grade || '').trim();
    const status = String(req.query.status || '').trim();

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(nama_lahan LIKE ? OR varietas LIKE ? OR kode_panen LIKE ? OR petani_penanggung_jawab LIKE ?)`);
      const sp = `%${search}%`;
      params.push(sp, sp, sp, sp);
    }
    if (lahan) {
      conditions.push(`nama_lahan LIKE ?`);
      params.push(`%${lahan}%`);
    }
    if (varietas) {
      conditions.push(`varietas LIKE ?`);
      params.push(`%${varietas}%`);
    }
    if (tanggalAwal) {
      conditions.push(`DATE(tanggal_panen) >= ?`);
      params.push(tanggalAwal);
    }
    if (tanggalAkhir) {
      conditions.push(`DATE(tanggal_panen) <= ?`);
      params.push(tanggalAkhir);
    }
    if (grade) {
      conditions.push(`kualitas_grade = ?`);
      params.push(grade);
    }
    if (status) {
      conditions.push(`status = ?`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const pool = getPool();

    // Total data (untuk pagination)
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM harvests ${whereClause}`,
      params
    );
    const total = Number(countRows[0].total);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Data halaman ini, urutkan terbaru dulu
    // NOTE: pakai pool.query() (bukan execute) karena MySQL 8.4 + mysql2
    // melempar "Incorrect arguments to mysqld_stmt_execute" pada LIMIT ? OFFSET ?
    // dengan prepared statement. Nilai limit/offset sudah divalidasi sebagai integer.
    const [rows] = await pool.query(
      `SELECT id, kode_panen, nama_lahan, varietas, DATE_FORMAT(tanggal_panen, '%Y-%m-%d') AS tanggal_panen, jumlah_hasil_kg,
              kualitas_grade, petani_penanggung_jawab, status, catatan, foto_url, created_at
       FROM harvests
       ${whereClause}
       ORDER BY tanggal_panen DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: rows.map(mapRowToHarvest),
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
    console.error('[getHarvests] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data panen.' });
  }
}

// ── Controller: Detail Satu Panen ─────────────────────────────────────────────

export async function getHarvestById(req, res) {
  try {
    const [rows] = await getPool().execute(
      `SELECT id, kode_panen, nama_lahan, varietas, DATE_FORMAT(tanggal_panen, '%Y-%m-%d') AS tanggal_panen, jumlah_hasil_kg,
              kualitas_grade, petani_penanggung_jawab, status, catatan, foto_url, created_at
       FROM harvests WHERE id = ? LIMIT 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data panen tidak ditemukan.' });
    }

    return res.status(200).json({ success: true, data: mapRowToHarvest(rows[0]) });
  } catch (error) {
    console.error('[getHarvestById] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail panen.' });
  }
}

// ── Controller: Buat Panen Baru ───────────────────────────────────────────────

export async function createHarvest(req, res) {
  try {
    const data = req.body || {};
    const validationError = validateHarvest(data);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const pool = getPool();

    // Buat kode panen otomatis bila tidak disertakan
    let kodePanen = String(data.kodePanen || '').trim();
    if (!kodePanen) {
      const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM harvests');
      const seq = Number(countRows[0].total) + 1;
      kodePanen = `PANEN-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;
    }

    const [result] = await pool.execute(
      `INSERT INTO harvests
        (kode_panen, nama_lahan, varietas, tanggal_panen, jumlah_hasil_kg,
         kualitas_grade, petani_penanggung_jawab, status, catatan, foto_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kodePanen,
        String(data.namaLahan).trim(),
        String(data.varietas).trim(),
        data.tanggalPanen,
        Number(data.jumlahHasilKg),
        data.kualitasGrade || 'Grade A (Premium)',
        String(data.petaniPenanggungJawab || '').trim(),
        data.status || 'Selesai',
        data.catatan || '',
        data.fotoUrl || null,
      ]
    );

    const [newRow] = await pool.execute(
      `SELECT id, kode_panen, nama_lahan, varietas, DATE_FORMAT(tanggal_panen, '%Y-%m-%d') AS tanggal_panen, jumlah_hasil_kg,
              kualitas_grade, petani_penanggung_jawab, status, catatan, foto_url, created_at
       FROM harvests WHERE id = ? LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Data panen berhasil ditambahkan.',
      data: mapRowToHarvest(newRow[0]),
    });
  } catch (error) {
    console.error('[createHarvest] Error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Kode panen sudah digunakan.' });
    }
    return res.status(500).json({ success: false, message: 'Gagal menambahkan data panen.' });
  }
}

// ── Controller: Update Panen ──────────────────────────────────────────────────

export async function updateHarvest(req, res) {
  try {
    const { id } = req.params;
    const data = req.body || {};

    const pool = getPool();

    // Pastikan data ada
    const [existing] = await pool.execute('SELECT id FROM harvests WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Data panen tidak ditemukan.' });
    }

    // Bangun SET clause dinamis dari field yang dikirim
    const fieldMap = {
      kodePanen: 'kode_panen',
      namaLahan: 'nama_lahan',
      varietas: 'varietas',
      tanggalPanen: 'tanggal_panen',
      jumlahHasilKg: 'jumlah_hasil_kg',
      kualitasGrade: 'kualitas_grade',
      petaniPenanggungJawab: 'petani_penanggung_jawab',
      status: 'status',
      catatan: 'catatan',
      fotoUrl: 'foto_url',
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
      await pool.execute(`UPDATE harvests SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    }

    const [updatedRow] = await pool.execute(
      `SELECT id, kode_panen, nama_lahan, varietas, DATE_FORMAT(tanggal_panen, '%Y-%m-%d') AS tanggal_panen, jumlah_hasil_kg,
              kualitas_grade, petani_penanggung_jawab, status, catatan, foto_url, created_at
       FROM harvests WHERE id = ? LIMIT 1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Data panen berhasil diperbarui.',
      data: mapRowToHarvest(updatedRow[0]),
    });
  } catch (error) {
    console.error('[updateHarvest] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data panen.' });
  }
}

// ── Controller: Hapus Panen ───────────────────────────────────────────────────

export async function deleteHarvest(req, res) {
  try {
    const pool = getPool();
    const [result] = await pool.execute('DELETE FROM harvests WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data panen tidak ditemukan.' });
    }

    return res.status(200).json({ success: true, message: 'Data panen berhasil dihapus.' });
  } catch (error) {
    console.error('[deleteHarvest] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menghapus data panen.' });
  }
}
