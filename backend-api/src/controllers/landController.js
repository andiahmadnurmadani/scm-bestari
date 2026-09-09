import { getPool } from '../config/db.js';
import { slugNama, tanggalKode, kodeUnik, buatCekAda } from '../utils/kodeUtil.js';

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
    jenisTanah: row.jenis_tanah || '',
    jumlahLubang: row.jumlah_lubang != null ? Number(row.jumlah_lubang) : 0,
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
  if (data.jumlahLubang != null && (isNaN(Number(data.jumlahLubang)) || Number(data.jumlahLubang) < 0)) return 'Jumlah lubang tidak valid.';
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
              varietas_sorgum, status_irigasi, jenis_tanah, jumlah_lubang, pemilik_kelompok_tani,
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
              varietas_sorgum, status_irigasi, jenis_tanah, jumlah_lubang, pemilik_kelompok_tani,
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

    // Buat kode lahan otomatis bila tidak disertakan: LUS-03092026 (3 huruf awal nama lahan + tgl daftar)
    let kodeLahan = String(data.kodeLahan || '').trim();
    if (!kodeLahan) {
      const slug = slugNama(data.namaLahan);
      const tgl = tanggalKode(new Date()); // tanggal daftar hari ini
      kodeLahan = await kodeUnik(
        (seq) => (seq === 1 ? `${slug}-${tgl}` : `${slug}-${tgl}-${String(seq).padStart(2, '0')}`),
        buatCekAda(pool, 'lands', 'kode_lahan')
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO lands
        (kode_lahan, nama_lahan, lokasi_desa, kecamatan, luas_hektar, varietas_sorgum,
         status_irigasi, jenis_tanah, jumlah_lubang, pemilik_kelompok_tani, status_kesiapan,
         status_badge, panen_lalu_ton, foto_url, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kodeLahan,
        String(data.namaLahan).trim(),
        String(data.lokasiDesa).trim(),
        String(data.kecamatan).trim(),
        Number(data.luasHektar),
        String(data.varietasSorgum || '').trim(),
        data.statusIrigasi || 'Irigasi Teknis',
        data.jenisTanah != null ? String(data.jenisTanah).trim() : null,
        data.jumlahLubang != null ? Number(data.jumlahLubang) : 0,
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
              varietas_sorgum, status_irigasi, jenis_tanah, jumlah_lubang, pemilik_kelompok_tani,
              status_kesiapan, status_badge, panen_lalu_ton, foto_url, latitude, longitude, created_at
       FROM lands WHERE id = ? LIMIT 1`,
      [result.insertId]
    );

    // Auto-create gudang untuk lahan baru (kode: GDG-<slug nama>-01)
    try {
      const [wg] = await pool.execute('SELECT id FROM warehouses WHERE lahan_id = ? LIMIT 1', [result.insertId]);
      if (wg.length === 0) {
        const slug = slugNama(data.namaLahan);
        const kodeGudang = await kodeUnik(
          (seq) => `GDG-${slug}-${String(seq).padStart(2, '0')}`,
          buatCekAda(pool, 'warehouses', 'kode_gudang')
        );
        await pool.execute(
          `INSERT INTO warehouses (kode_gudang, nama_gudang, lahan_id, lokasi)
           VALUES (?, ?, ?, ?)`,
          [kodeGudang, `Gudang ${String(data.namaLahan).trim()}`, result.insertId, String(data.lokasiDesa || '').trim()]
        );
        console.log(`✓ Gudang auto-create untuk lahan baru "${data.namaLahan}" (${kodeGudang}).`);
      }
    } catch (e) { console.warn('⚠ Auto-create gudang dilewati:', e.message); }

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
      jumlahLubang: 'jumlah_lubang',
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
              varietas_sorgum, status_irigasi, jenis_tanah, jumlah_lubang, pemilik_kelompok_tani,
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
    const { id } = req.params;

    // Cek lahan ada
    const [existing] = await pool.execute('SELECT id, nama_lahan FROM lands WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Data lahan tidak ditemukan.' });
    }

    // Cek lahan sedang ditanami (ada penanaman berstatus aktif)
    // Status "sedang ditanami": Ditanam, Tumbuh, Siap Panen — lahan tidak boleh dihapus
    const [activePl] = await pool.execute(
      `SELECT id, kode_tanam, status_tanam, tanggal_tanam
       FROM plantings
       WHERE lahan_id = ? AND status_tanam IN ('Ditanam', 'Tumbuh', 'Siap Panen')
       ORDER BY tanggal_tanam DESC
       LIMIT 1`,
      [id]
    );

    if (activePl.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Lahan "${existing[0].nama_lahan}" sedang ditanami (${activePl[0].kode_tanam} - ${activePl[0].status_tanam}). Selesaikan atau isi status panennya terlebih dahulu sebelum lahan dapat dihapus.`,
      });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Kumpulkan planting milik lahan ini (semua status, termasuk riwayat Dipanen/Gagal)
      const [plRows] = await conn.execute('SELECT id FROM plantings WHERE lahan_id = ?', [id]);
      const plantingIds = plRows.map((r) => r.id);
      const placeholders = plantingIds.length > 0 ? plantingIds.map(() => '?').join(',') : null;

      // Kumpulkan id harvest yang merujuk planting lahan ini SEBELUM referensi dikosongkan
      let harvestIds = [];
      if (placeholders) {
        const [hRows] = await conn.execute(
          `SELECT id FROM harvests WHERE planting_id IN (${placeholders})`,
          plantingIds
        );
        harvestIds = hRows.map((r) => r.id);
      }
      const harvestPh = harvestIds.length > 0 ? harvestIds.map(() => '?').join(',') : null;

      // Kosongkan referensi lahan/planting di harvests agar tidak jadi data menggantung
      if (placeholders) {
        await conn.execute(
          `UPDATE harvests SET lahan_id = NULL, planting_id = NULL WHERE planting_id IN (${placeholders})`,
          plantingIds
        );
      }
      await conn.execute('UPDATE harvests SET lahan_id = NULL WHERE lahan_id = ? AND planting_id IS NULL', [id]);

      // Kosongkan referensi lineage di production_batches (via harvest & planting lahan ini)
      if (harvestPh) {
        await conn.execute(
          `UPDATE production_batches SET lahan_id = NULL, planting_id = NULL, harvest_id = NULL WHERE harvest_id IN (${harvestPh})`,
          harvestIds
        );
      }
      if (placeholders) {
        await conn.execute(
          `UPDATE production_batches SET lahan_id = NULL, planting_id = NULL WHERE planting_id IN (${placeholders})`,
          plantingIds
        );
      }
      // production_batches yang hanya merujuk lahan (tanpa planting/harvest) juga dibersihkan
      await conn.execute('UPDATE production_batches SET lahan_id = NULL WHERE lahan_id = ?', [id]);

      // Hapus planting riwayat milik lahan ini agar tidak yatim
      if (placeholders) {
        await conn.execute(`DELETE FROM plantings WHERE lahan_id = ?`, [id]);
      }

      // Hapus gudang auto-create terkait lahan agar tidak yatim
      await conn.execute('DELETE FROM warehouses WHERE lahan_id = ?', [id]);

      // Hapus lahan
      const [result] = await conn.execute('DELETE FROM lands WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'Data lahan tidak ditemukan.' });
      }

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    return res.status(200).json({ success: true, message: 'Data lahan berhasil dihapus.' });
  } catch (error) {
    console.error('[deleteLand] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menghapus data lahan.' });
  }
}
