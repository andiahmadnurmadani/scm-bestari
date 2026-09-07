import { getPool } from '../config/db.js';
import { slugNama, tanggalKode, kodeUnik, buatCekAda, toISODate } from '../utils/kodeUtil.js';

// ── Helper ────────────────────────────────────────────────────────────────────

/** Konversi baris DB (snake_case) ke format frontend (camelCase) + lineage. */
function mapRowToHarvest(row) {
  return {
    id: String(row.id),
    kodePanen: row.kode_panen,
    namaLahan: row.nama_lahan,
    varietas: row.varietas,
    tanggalPanen: toISODate(row.tanggal_panen),
    jumlahHasilKg: Number(row.jumlah_hasil_kg),
    kualitasGrade: row.kualitas_grade,
    petaniPenanggungJawab: row.petani_penanggung_jawab,
    status: row.status,
    catatan: row.catatan || '',
    fotoUrl: row.foto_url || null,
    lahanId: row.lahan_id != null ? String(row.lahan_id) : null,
    plantingId: row.planting_id != null ? String(row.planting_id) : null,
    periodeHari: row.periode_hari != null ? Number(row.periode_hari) : null,
    // lineage tambahan (jika JOIN)
    lahan: row.lahan_id ? { id: String(row.lahan_id), kodeLahan: row.kode_lahan, namaLahan: row.l_nama_lahan, lokasiDesa: row.lokasi_desa, luasHektar: row.luas_hektar != null ? Number(row.luas_hektar) : null } : null,
    planting: row.planting_id ? { id: String(row.planting_id), kodeTanam: row.kode_tanam, tanggalTanam: toISODate(row.tanggal_tanam), estimasiPanen: toISODate(row.estimasi_panen), varietas: row.p_varietas, jumlahLubang: row.jumlah_lubang != null ? Number(row.jumlah_lubang) : null, petugas: row.petugas } : null,
    // status stok gudang
    sudahMasukKg: row.sudah_masuk_kg != null ? Number(row.sudah_masuk_kg) : 0,
    sisaBelumMasukKg: row.sisa_belum_masuk_kg != null ? Number(row.sisa_belum_masuk_kg) : null,
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
  if (data.lahanId && isNaN(Number(data.lahanId))) return 'Lahan tidak valid.';
  if (data.plantingId && isNaN(Number(data.plantingId))) return 'Data penanaman tidak valid.';
  return null;
}

function calcPeriode(tanam, panen) {
  if (!tanam || !panen) return null;
  const d1 = new Date(tanam); const d2 = new Date(panen);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
  return Math.round((d2 - d1) / (1000*60*60*24));
}

/** Format tanggal aman → 'YYYY-MM-DD'. Tangani string ('2026-09-01') DAN Date object (dari MySQL). */
function fmtTanggalStok(t) {
  if (!t) return new Date().toISOString().slice(0, 10);
  if (typeof t === 'string' && t.trim()) {
    const s = t.trim().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s;
  }
  const d = new Date(t);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Format DATETIME lokal 'YYYY-MM-DD HH:mm:ss' (jam masuk = waktu sekarang jika kosong)
function fmtDateTimeStok(t) {
  const d = t ? new Date(t) : new Date();
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/**
 * Sinkronkan stok gudang lahan untuk sebuah panen (Opsi B: 1 panen → banyak batch).
 * - Hapus batch stok lama milik panen ini & kembalikan sisa ke stok gudang.
 * - Buat batch baru sesuai array `stokBatch` [{ jumlahKg, keterangan }].
 * - Jika `stokBatch` kosong/tidak dikirim → otomatis 1 batch penuh.
 */
async function replaceHarvestStockBatches(pool, { harvestId, lahanId, kodePanen, tanggalPanen, stokBatch, qtyPanenKg, gudangId }) {
  if (!lahanId && !gudangId) return;
  // Default: gudang sesuai lahan. Bila user pilih gudang lain → pakai pilihan itu.
  let gudangTujuan = gudangId ? Number(gudangId) : null;
  if (!gudangTujuan && lahanId) {
    const [wg] = await pool.execute('SELECT id FROM warehouses WHERE lahan_id = ? LIMIT 1', [lahanId]);
    if (!wg.length) return;
    gudangTujuan = wg[0].id;
  }
  if (!gudangTujuan) return;
  const gudangIdAkhir = gudangTujuan;

  // 1. Hapus batch lama milik panen ini & kembalikan sisa stok
  const [oldBatches] = await pool.execute(
    'SELECT id, sisa_kg FROM warehouse_stock_batches WHERE harvest_id = ?',
    [harvestId]
  );
  let totalDikembalikan = 0;
  for (const b of oldBatches) {
    totalDikembalikan += Number(b.sisa_kg || 0);
    await pool.execute('DELETE FROM warehouse_stock_batches WHERE id = ?', [b.id]);
  }
  if (totalDikembalikan > 0) {
    await pool.execute('UPDATE warehouses SET total_stok_kg = total_stok_kg - ? WHERE id = ?', [totalDikembalikan, gudangId]);
  }
  await pool.execute('DELETE FROM warehouse_movements WHERE harvest_id = ?', [harvestId]);

  // 2. Buat batch baru HANYA jika stokBatch berisi (kosong/undefined → tidak masuk gudang, bisa diisi nanti via Gudang → Stok Masuk)
  const rows = Array.isArray(stokBatch)
    ? stokBatch.filter((r) => Number(r.jumlahKg) > 0)
    : [];
  if (rows.length === 0) {
    console.log(`✓ ${kodePanen}: tidak ada batch stok (belum masuk gudang).`);
    return;
  }

  for (const r of rows) {
    const qty = Number(r.jumlahKg);
    if (!qty || qty <= 0) continue;
    // Kode batch gabah bermakna: GAB-<kode panen> (pecahan → -02, -03, dst), konsisten dgn Stok Masuk
    const kodeBatchStok = await kodeUnik(
      (seq) => (seq === 1
        ? `GAB-${kodePanen}`
        : `GAB-${kodePanen}-${String(seq).padStart(2, '0')}`),
      buatCekAda(pool, 'warehouse_stock_batches', 'kode_batch_stok')
    );
    const tgl = fmtDateTimeStok(null); // jam masuk = waktu input sekarang
    await pool.execute(
      `INSERT INTO warehouse_stock_batches (gudang_id, harvest_id, kode_batch_stok, jumlah_masuk_kg, sisa_kg, tanggal_masuk, jenis)
       VALUES (?, ?, ?, ?, ?, ?, 'GABAH')`,
      [gudangIdAkhir, harvestId, kodeBatchStok, qty, qty, tgl]
    );
    await pool.execute(
      'UPDATE warehouses SET total_stok_kg = total_stok_kg + ? WHERE id = ?',
      [qty, gudangIdAkhir]
    );
    await pool.execute(
      `INSERT INTO warehouse_movements (gudang_id, tipe, jumlah_kg, keterangan, harvest_id)
       VALUES (?, 'MASUK', ?, ?, ?)`,
      [gudangIdAkhir, qty, `${r.keterangan ? r.keterangan + ' — ' : ''}${kodePanen}`, harvestId]
    );
  }
  console.log(`✓ Stok gudang ${gudangIdAkhir} disinkronkan untuk ${kodePanen} (${rows.length} batch).`);
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
    const lahanId = String(req.query.lahanId || req.query.lahan_id || '').trim();
    const plantingId = String(req.query.plantingId || req.query.planting_id || '').trim();
    const varietas = String(req.query.varietas || '').trim();
    const tanggalAwal = String(req.query.tanggalAwal || '').trim();
    const tanggalAkhir = String(req.query.tanggalAkhir || '').trim();
    const grade = String(req.query.grade || '').trim();
    const status = String(req.query.status || '').trim();

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(h.nama_lahan LIKE ? OR h.varietas LIKE ? OR h.kode_panen LIKE ? OR h.petani_penanggung_jawab LIKE ?)`);
      const sp = `%${search}%`;
      params.push(sp, sp, sp, sp);
    }
    if (lahan) {
      conditions.push(`h.nama_lahan LIKE ?`);
      params.push(`%${lahan}%`);
    }
    if (lahanId) { conditions.push(`h.lahan_id = ?`); params.push(lahanId); }
    if (plantingId) { conditions.push(`h.planting_id = ?`); params.push(plantingId); }
    if (varietas) {
      conditions.push(`h.varietas LIKE ?`);
      params.push(`%${varietas}%`);
    }
    if (tanggalAwal) {
      conditions.push(`DATE(h.tanggal_panen) >= ?`);
      params.push(tanggalAwal);
    }
    if (tanggalAkhir) {
      conditions.push(`DATE(h.tanggal_panen) <= ?`);
      params.push(tanggalAkhir);
    }
    if (grade) {
      conditions.push(`h.kualitas_grade = ?`);
      params.push(grade);
    }
    if (status) {
      conditions.push(`h.status = ?`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const pool = getPool();

    // Total data (untuk pagination)
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM harvests h ${whereClause}`,
      params
    );
    const total = Number(countRows[0].total);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const [rows] = await pool.query(
      `SELECT h.id, h.kode_panen, h.nama_lahan, h.varietas, DATE_FORMAT(h.tanggal_panen, '%Y-%m-%d') AS tanggal_panen, h.jumlah_hasil_kg,
              h.kualitas_grade, h.petani_penanggung_jawab, h.status, h.catatan, h.foto_url, h.lahan_id, h.planting_id, h.periode_hari, h.created_at,
              l.kode_lahan, l.nama_lahan AS l_nama_lahan, l.lokasi_desa, l.luas_hektar,
              p.kode_tanam, DATE_FORMAT(p.tanggal_tanam, '%Y-%m-%d') AS tanggal_tanam, DATE_FORMAT(p.estimasi_panen, '%Y-%m-%d') AS estimasi_panen, p.varietas AS p_varietas, p.jumlah_lubang, p.petugas,
              COALESCE((SELECT SUM(sb.jumlah_masuk_kg) FROM warehouse_stock_batches sb WHERE sb.harvest_id = h.id), 0) AS sudah_masuk_kg
       FROM harvests h
       LEFT JOIN lands l ON h.lahan_id = l.id
       LEFT JOIN plantings p ON h.planting_id = p.id
        ${whereClause}
        ORDER BY h.tanggal_panen DESC, h.id DESC
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
      `SELECT h.id, h.kode_panen, h.nama_lahan, h.varietas, DATE_FORMAT(h.tanggal_panen, '%Y-%m-%d') AS tanggal_panen, h.jumlah_hasil_kg,
              h.kualitas_grade, h.petani_penanggung_jawab, h.status, h.catatan, h.foto_url, h.lahan_id, h.planting_id, h.periode_hari, h.created_at,
              l.kode_lahan, l.nama_lahan AS l_nama_lahan, l.lokasi_desa, l.luas_hektar,
              p.kode_tanam, DATE_FORMAT(p.tanggal_tanam, '%Y-%m-%d') AS tanggal_tanam, DATE_FORMAT(p.estimasi_panen, '%Y-%m-%d') AS estimasi_panen, p.varietas AS p_varietas, p.jumlah_lubang, p.petugas
       FROM harvests h
       LEFT JOIN lands l ON h.lahan_id = l.id
       LEFT JOIN plantings p ON h.planting_id = p.id
       WHERE h.id = ? LIMIT 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data panen tidak ditemukan.' });
    }

    const data = mapRowToHarvest(rows[0]);

    // Sertakan batch stok gudang milik panen ini (untuk prefill edit & info gudang)
    const [stocks] = await getPool().execute(
      `SELECT sb.id, sb.gudang_id, sb.harvest_id, sb.kode_batch_stok, sb.jenis, sb.jumlah_masuk_kg, sb.sisa_kg, sb.tanggal_masuk,
              w.kode_gudang, w.nama_gudang
       FROM warehouse_stock_batches sb
       LEFT JOIN warehouses w ON sb.gudang_id = w.id
       WHERE sb.harvest_id = ? ORDER BY sb.id ASC`,
      [req.params.id]
    );
    data.stockBatches = stocks.map((s) => ({
      id: String(s.id),
      gudangId: String(s.gudang_id),
      gudang: s.gudang_id ? { id: String(s.gudang_id), kodeGudang: s.kode_gudang, namaGudang: s.nama_gudang } : null,
      harvestId: s.harvest_id != null ? String(s.harvest_id) : null,
      kodeBatchStok: s.kode_batch_stok,
      jenis: s.jenis || 'GABAH',
      jumlahMasukKg: Number(s.jumlah_masuk_kg || 0),
      sisaKg: Number(s.sisa_kg || 0),
      tanggalMasuk: toISODate(s.tanggal_masuk),
    }));

    return res.status(200).json({ success: true, data });
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

    // validasi FK jika dikirim
    let lahanId = data.lahanId ? Number(data.lahanId) : null;
    let plantingId = data.plantingId ? Number(data.plantingId) : null;
    let tanggalTanamForPeriode = null;
    if (plantingId) {
      const [pr] = await pool.execute('SELECT id, lahan_id, tanggal_tanam FROM plantings WHERE id=? LIMIT 1', [plantingId]);
      if (!pr.length) return res.status(400).json({ success: false, message: 'Data penanaman tidak ditemukan.' });
      tanggalTanamForPeriode = pr[0].tanggal_tanam;
      // jika lahanId tidak dikirim, ambil dari planting
      if (!lahanId) lahanId = pr[0].lahan_id;
      // validasi planting milik lahan
      if (lahanId && Number(pr[0].lahan_id) !== Number(lahanId)) return res.status(400).json({ success: false, message: 'Penanaman tidak sesuai dengan lahan yang dipilih.' });
    }
    // ambil nama lahan dari lahan (untuk kode panen bermakna)
    let namaLahan = null;
    if (lahanId) {
      const [lr] = await pool.execute('SELECT id, nama_lahan FROM lands WHERE id=? LIMIT 1', [lahanId]);
      if (!lr.length) return res.status(400).json({ success: false, message: 'Lahan tidak ditemukan.' });
      namaLahan = lr[0].nama_lahan;
    }

    // Buat kode panen otomatis bila tidak disertakan: LUS-10092026-01 (slug nama lahan)
    let kodePanen = String(data.kodePanen || '').trim();
    if (!kodePanen) {
      const slug = slugNama(namaLahan);
      const tgl = tanggalKode(data.tanggalPanen);
      kodePanen = await kodeUnik(
        (seq) => `${slug}-${tgl}-${String(seq).padStart(2, '0')}`,
        buatCekAda(pool, 'harvests', 'kode_panen')
      );
    }

    const periodeHari = calcPeriode(tanggalTanamForPeriode, data.tanggalPanen);

    const [result] = await pool.execute(
      `INSERT INTO harvests
        (kode_panen, nama_lahan, varietas, tanggal_panen, jumlah_hasil_kg,
         kualitas_grade, petani_penanggung_jawab, status, catatan, foto_url, lahan_id, planting_id, periode_hari)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        lahanId,
        plantingId,
        periodeHari,
      ]
    );

    // update planting status jadi Dipanen jika panen berhasil
    if (plantingId) {
      try { await pool.execute(`UPDATE plantings SET status_tanam='Dipanen' WHERE id=?`, [plantingId]); } catch {}
    }

    const [newRow] = await pool.execute(
      `SELECT h.id, h.kode_panen, h.nama_lahan, h.varietas, DATE_FORMAT(h.tanggal_panen, '%Y-%m-%d') AS tanggal_panen, h.jumlah_hasil_kg,
              h.kualitas_grade, h.petani_penanggung_jawab, h.status, h.catatan, h.foto_url, h.lahan_id, h.planting_id, h.periode_hari, h.created_at,
              l.kode_lahan, l.nama_lahan AS l_nama_lahan, l.lokasi_desa, l.luas_hektar,
              p.kode_tanam, DATE_FORMAT(p.tanggal_tanam, '%Y-%m-%d') AS tanggal_tanam, DATE_FORMAT(p.estimasi_panen, '%Y-%m-%d') AS estimasi_panen, p.varietas AS p_varietas, p.jumlah_lubang, p.petugas
       FROM harvests h LEFT JOIN lands l ON h.lahan_id=l.id LEFT JOIN plantings p ON h.planting_id=p.id WHERE h.id = ? LIMIT 1`,
      [result.insertId]
    );

    // Masukkan stok ke gudang lahan terkait (Opsi B: 1 panen → banyak batch)
    try {
      await replaceHarvestStockBatches(pool, {
        harvestId: result.insertId,
        lahanId,
        kodePanen,
        tanggalPanen: data.tanggalPanen,
        stokBatch: data.stokBatch,
        qtyPanenKg: Number(data.jumlahHasilKg),
        gudangId: data.gudangId || undefined,
      });
    } catch (e) { console.warn('⚠ Stok masuk gudang dilewati:', e.message); }

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
    const [existing] = await pool.execute('SELECT id, lahan_id, planting_id FROM harvests WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Data panen tidak ditemukan.' });
    }

    // jika update planting/lahan, hitung ulang periode
    let lahanId = data.lahanId !== undefined ? (data.lahanId ? Number(data.lahanId) : null) : undefined;
    let plantingId = data.plantingId !== undefined ? (data.plantingId ? Number(data.plantingId) : null) : undefined;
    let periodeHari = undefined;
    if (plantingId !== undefined || data.tanggalPanen) {
      const effPlantingId = plantingId !== undefined ? plantingId : existing[0].planting_id;
      const effTanggalPanen = data.tanggalPanen || (await pool.execute('SELECT tanggal_panen FROM harvests WHERE id=?', [id]))[0][0]?.tanggal_panen;
      if (effPlantingId) {
        const [pr] = await pool.execute('SELECT tanggal_tanam FROM plantings WHERE id=? LIMIT 1', [effPlantingId]);
        if (pr.length) periodeHari = calcPeriode(pr[0].tanggal_tanam, effTanggalPanen);
      }
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
      lahanId: 'lahan_id',
      plantingId: 'planting_id',
    };

    const sets = [];
    const values = [];
    for (const [key, column] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        sets.push(`${column} = ?`);
        values.push(data[key]);
      }
    }
    if (periodeHari !== undefined) { sets.push(`periode_hari = ?`); values.push(periodeHari); }

    if (sets.length > 0) {
      await pool.execute(`UPDATE harvests SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    }

    // Sinkronkan stok gudang (Opsi B) — pakai lahanId efektif
    try {
      const effLahanId = lahanId !== undefined ? lahanId : existing[0].lahan_id;
      const [cur] = await pool.execute('SELECT kode_panen, tanggal_panen, jumlah_hasil_kg FROM harvests WHERE id = ?', [id]);
      await replaceHarvestStockBatches(pool, {
        harvestId: id,
        lahanId: effLahanId,
        kodePanen: cur[0]?.kode_panen || '',
        tanggalPanen: cur[0]?.tanggal_panen,
        stokBatch: data.stokBatch,
        qtyPanenKg: Number(cur[0]?.jumlah_hasil_kg || 0),
        gudangId: data.gudangId || undefined,
      });
    } catch (e) { console.warn('⚠ Sinkron stok gudang saat update dilewati:', e.message); }

    const [updatedRow] = await pool.execute(
      `SELECT h.id, h.kode_panen, h.nama_lahan, h.varietas, DATE_FORMAT(h.tanggal_panen, '%Y-%m-%d') AS tanggal_panen, h.jumlah_hasil_kg,
              h.kualitas_grade, h.petani_penanggung_jawab, h.status, h.catatan, h.foto_url, h.lahan_id, h.planting_id, h.periode_hari, h.created_at,
              l.kode_lahan, l.nama_lahan AS l_nama_lahan, l.lokasi_desa, l.luas_hektar,
              p.kode_tanam, DATE_FORMAT(p.tanggal_tanam, '%Y-%m-%d') AS tanggal_tanam, DATE_FORMAT(p.estimasi_panen, '%Y-%m-%d') AS estimasi_panen, p.varietas AS p_varietas, p.jumlah_lubang, p.petugas
       FROM harvests h LEFT JOIN lands l ON h.lahan_id=l.id LEFT JOIN plantings p ON h.planting_id=p.id WHERE h.id = ? LIMIT 1`,
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
    const [existing] = await pool.execute('SELECT id, lahan_id FROM harvests WHERE id = ? LIMIT 1', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Data panen tidak ditemukan.' });
    }

    // Hapus batch stok panen ini & kurangi stok gudang
    try {
      await replaceHarvestStockBatches(pool, {
        harvestId: req.params.id,
        lahanId: existing[0].lahan_id,
        kodePanen: 'HAPUS',
        tanggalPanen: null,
        stokBatch: [], // kosong → hapus semua batch
        qtyPanenKg: 0,
      });
    } catch (e) { console.warn('⚠ Hapus stok gudang dilewati:', e.message); }

    const [result] = await pool.execute('DELETE FROM harvests WHERE id = ?', [req.params.id]);

    return res.status(200).json({ success: true, message: 'Data panen berhasil dihapus.' });
  } catch (error) {
    console.error('[deleteHarvest] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menghapus data panen.' });
  }
}
