import { getPool } from '../config/db.js';
import { slugNama, tanggalKode, kodeUnik, buatCekAda, toISODate } from '../utils/kodeUtil.js';

// ── Helper ────────────────────────────────────────────────────────────────────

function mapRowToWarehouse(row) {
  return {
    id: String(row.id),
    kodeGudang: row.kode_gudang,
    namaGudang: row.nama_gudang,
    lahanId: row.lahan_id != null ? String(row.lahan_id) : null,
    lokasi: row.lokasi || '',
    totalStokKg: Number(row.total_stok_kg || 0),
    stokGabahKg: Number(row.stok_gabah_kg || 0),
    stokSorgumKg: Number(row.stok_sorgum_kg || 0),
    // lineage lahan
    lahan: row.lahan_id ? { id: String(row.lahan_id), kodeLahan: row.kode_lahan, namaLahan: row.l_nama_lahan, lokasiDesa: row.lokasi_desa, pemilikKelompokTani: row.pemilik_kelompok_tani || null } : null,
    createdAt: row.created_at,
  };
}

function mapRowToStock(row) {
  return {
    id: String(row.id),
    gudangId: String(row.gudang_id),
    harvestId: row.harvest_id != null ? String(row.harvest_id) : null,
    jenis: row.jenis || 'GABAH',
    asalBatchId: row.asal_batch_id != null ? String(row.asal_batch_id) : null,
    kodeBatchStok: row.kode_batch_stok,
    jumlahMasukKg: Number(row.jumlah_masuk_kg || 0),
    sisaKg: Number(row.sisa_kg || 0),
    tanggalMasuk: row.tanggal_masuk,
    tanggalSosoh: row.tanggal_sosoh,
    operatorSosoh: row.operator_sosoh || null,
    // rantai asal: untuk batch SORGUM → batch gabah asal
    asalBatch: row.asal_batch_id
      ? { id: String(row.asal_batch_id), kodeBatchStok: row.asal_kode_batch_stok || row.kode_batch_stok, jumlahMasukKg: row.asal_jumlah_masuk_kg != null ? Number(row.asal_jumlah_masuk_kg) : null }
      : null,
    harvest: row.harvest_id ? { id: String(row.harvest_id), kodePanen: row.kode_panen, tanggalPanen: toISODate(row.tanggal_panen), varietas: row.varietas } : null,
    createdAt: row.created_at,
  };
}

// Helper: konversi Date → string tanggal lokal (YYYY-MM-DD)
function toDateStr(v) {
  return toISODate(v);
}

function mapRowToMovement(row) {
  return {
    id: String(row.id),
    gudangId: String(row.gudang_id),
    tipe: row.tipe,
    jumlahKg: Number(row.jumlah_kg || 0),
    keterangan: row.keterangan || '',
    harvestId: row.harvest_id != null ? String(row.harvest_id) : null,
    productionId: row.production_id != null ? String(row.production_id) : null,
    stockBatchId: row.stock_batch_id != null ? String(row.stock_batch_id) : null,
    kodePanen: row.kode_panen || null,
    kodeBatch: row.kode_batch || null,
    kodeBatchStok: row.kode_batch_stok || null,
    namaProduk: row.nama_produk || null,
    createdAt: row.created_at,
  };
}

function validateWarehouse(data) {
  if (!data.namaGudang || !String(data.namaGudang).trim()) return 'Nama gudang wajib diisi.';
  return null;
}

// ── Controller: Daftar Gudang (dengan pagination + stok) ──────────────────────

/**
 * GET /api/warehouse?page=1&limit=10&search=...
 * Mengembalikan { data, pagination }
 */
export async function getWarehouses(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = String(req.query.search || '').trim();
    const offset = (page - 1) * limit;

    const whereClause = search
      ? `WHERE w.kode_gudang LIKE ? OR w.nama_gudang LIKE ? OR w.lokasi LIKE ?`
      : '';
    const searchPattern = `%${search}%`;
    const params = search ? [searchPattern, searchPattern, searchPattern] : [];

    const pool = getPool();

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM warehouses w ${whereClause}`,
      params
    );
    const total = Number(countRows[0].total);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const [rows] = await pool.query(
      `SELECT w.id, w.kode_gudang, w.nama_gudang, w.lahan_id, w.lokasi, w.total_stok_kg, w.created_at,
              l.kode_lahan, l.nama_lahan AS l_nama_lahan, l.lokasi_desa, l.pemilik_kelompok_tani,
              COALESCE((SELECT SUM(sb.sisa_kg) FROM warehouse_stock_batches sb WHERE sb.gudang_id = w.id AND sb.jenis = 'GABAH'), 0) AS stok_gabah_kg,
              COALESCE((SELECT SUM(sb.sisa_kg) FROM warehouse_stock_batches sb WHERE sb.gudang_id = w.id AND sb.jenis = 'SORGUM'), 0) AS stok_sorgum_kg
       FROM warehouses w
       LEFT JOIN lands l ON w.lahan_id = l.id
       ${whereClause}
       ORDER BY w.created_at DESC, w.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: rows.map(mapRowToWarehouse),
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
    console.error('[getWarehouses] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data gudang.' });
  }
}

// ── Controller: Detail Satu Gudang (termasuk batch stok FIFO) ─────────────────

export async function getWarehouseById(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT w.id, w.kode_gudang, w.nama_gudang, w.lahan_id, w.lokasi, w.total_stok_kg, w.created_at,
              l.kode_lahan, l.nama_lahan AS l_nama_lahan, l.lokasi_desa, l.pemilik_kelompok_tani
       FROM warehouses w
       LEFT JOIN lands l ON w.lahan_id = l.id
       WHERE w.id = ? LIMIT 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data gudang tidak ditemukan.' });
    }

    const warehouse = mapRowToWarehouse(rows[0]);

    // Batch stok FIFO — semua batch (termasuk habis) + rantai asal gabah
    const [stocks] = await pool.execute(
      `SELECT s.id, s.gudang_id, s.harvest_id, s.kode_batch_stok, s.jumlah_masuk_kg, s.sisa_kg,
              DATE_FORMAT(s.tanggal_masuk, '%Y-%m-%d %H:%i:%s') AS tanggal_masuk,
              s.jenis, s.asal_batch_id,
              DATE_FORMAT(s.tanggal_sosoh, '%Y-%m-%d %H:%i:%s') AS tanggal_sosoh, s.operator_sosoh,
              s.created_at,
              h.kode_panen, DATE_FORMAT(h.tanggal_panen, '%Y-%m-%d') AS tanggal_panen, h.varietas,
              ab.kode_batch_stok AS asal_kode_batch_stok, ab.jumlah_masuk_kg AS asal_jumlah_masuk_kg
       FROM warehouse_stock_batches s
       LEFT JOIN harvests h ON s.harvest_id = h.id
       LEFT JOIN warehouse_stock_batches ab ON s.asal_batch_id = ab.id
       WHERE s.gudang_id = ?
       ORDER BY s.tanggal_masuk DESC, s.id DESC`,
      [req.params.id]
    );

    // Riwayat pergerakan
    const [movements] = await pool.execute(
      `SELECT m.id, m.gudang_id, m.tipe, m.jumlah_kg, m.keterangan, m.harvest_id, m.production_id, m.stock_batch_id,
              DATE_FORMAT(m.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
              h.kode_panen, p.kode_batch, p.nama_produk, sb.kode_batch_stok
       FROM warehouse_movements m
       LEFT JOIN harvests h ON m.harvest_id = h.id
       LEFT JOIN production_batches p ON m.production_id = p.id
       LEFT JOIN warehouse_stock_batches sb ON m.stock_batch_id = sb.id
       WHERE m.gudang_id = ?
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT 50`,
      [req.params.id]
    );

    // Jejak sosoh (ringkas, 10 terbaru)
    const [sosohs] = await pool.execute(
      `SELECT sp.id, sp.kode_sosoh, sp.gudang_id, sp.batch_gabah_id, sp.batch_sorgum_id,
              sp.kg_gabah_dipakai, sp.kg_sorgum_hasil, sp.rendemen_persen, sp.operator, sp.keterangan,
              DATE_FORMAT(sp.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
              gb.kode_batch_stok AS kode_batch_gabah, sg.kode_batch_stok AS kode_batch_sorgum
       FROM sosoh_processes sp
       LEFT JOIN warehouse_stock_batches gb ON sp.batch_gabah_id = gb.id
       LEFT JOIN warehouse_stock_batches sg ON sp.batch_sorgum_id = sg.id
       WHERE sp.gudang_id = ?
       ORDER BY sp.created_at DESC, sp.id DESC
       LIMIT 10`,
      [req.params.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...warehouse,
        stockBatches: stocks.map(mapRowToStock),
        movements: movements.map(mapRowToMovement),
        sosohList: sosohs.map((r) => ({
          id: String(r.id),
          kodeSosoh: r.kode_sosoh,
          kodeBatchGabah: r.kode_batch_gabah || null,
          kodeBatchSorgum: r.kode_batch_sorgum || null,
          kgGabah: Number(r.kg_gabah_dipakai || 0),
          kgSorgum: Number(r.kg_sorgum_hasil || 0),
          rendemen: Number(r.rendemen_persen || 0),
          operator: r.operator || null,
          keterangan: r.keterangan || null,
          createdAt: r.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('[getWarehouseById] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail gudang.' });
  }
}

// ── Controller: Buat Gudang (manual, selain auto-create dari lahan) ───────────

export async function createWarehouse(req, res) {
  try {
    const data = req.body || {};
    const validationError = validateWarehouse(data);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const pool = getPool();

    const lahanId = data.lahanId ? Number(data.lahanId) : null;
    let namaLahan = null;
    if (lahanId) {
      const [lr] = await pool.execute('SELECT id, nama_lahan FROM lands WHERE id=? LIMIT 1', [lahanId]);
      if (!lr.length) return res.status(400).json({ success: false, message: 'Lahan tidak ditemukan.' });
      namaLahan = lr[0].nama_lahan;
    }

    // Kode gudang: GDG-<slug nama lahan>-XX (contoh GDG-LUS-01) / GDG-UMUM-01 (tanpa lahan)
    let kodeGudang = String(data.kodeGudang || '').trim();
    if (!kodeGudang) {
      const slug = namaLahan ? slugNama(namaLahan) : 'UMUM';
      kodeGudang = await kodeUnik(
        (seq) => `GDG-${slug}-${String(seq).padStart(2, '0')}`,
        buatCekAda(pool, 'warehouses', 'kode_gudang')
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO warehouses (kode_gudang, nama_gudang, lahan_id, lokasi)
       VALUES (?, ?, ?, ?)`,
      [
        kodeGudang,
        String(data.namaGudang).trim(),
        lahanId,
        data.lokasi || '',
      ]
    );

    const [newRow] = await pool.execute(
      `SELECT w.id, w.kode_gudang, w.nama_gudang, w.lahan_id, w.lokasi, w.total_stok_kg, w.created_at,
              l.kode_lahan, l.nama_lahan AS l_nama_lahan, l.lokasi_desa, l.pemilik_kelompok_tani
       FROM warehouses w LEFT JOIN lands l ON w.lahan_id = l.id
       WHERE w.id = ? LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Data gudang berhasil ditambahkan.',
      data: mapRowToWarehouse(newRow[0]),
    });
  } catch (error) {
    console.error('[createWarehouse] Error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Kode gudang sudah digunakan.' });
    }
    return res.status(500).json({ success: false, message: 'Gagal menambahkan data gudang.' });
  }
}

// ── Controller: Update Gudang ──────────────────────────────────────────────────

export async function updateWarehouse(req, res) {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const pool = getPool();

    const [existing] = await pool.execute('SELECT id FROM warehouses WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Data gudang tidak ditemukan.' });
    }

    const fieldMap = {
      kodeGudang: 'kode_gudang',
      namaGudang: 'nama_gudang',
      lahanId: 'lahan_id',
      lokasi: 'lokasi',
    };

    const sets = [];
    const values = [];
    for (const [key, column] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        sets.push(`${column} = ?`);
        values.push(data[key] === '' && ['lahanId', 'lokasi'].includes(key) ? null : data[key]);
      }
    }

    if (sets.length > 0) {
      await pool.execute(`UPDATE warehouses SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    }

    const [updatedRow] = await pool.execute(
      `SELECT w.id, w.kode_gudang, w.nama_gudang, w.lahan_id, w.lokasi, w.total_stok_kg, w.created_at,
              l.kode_lahan, l.nama_lahan AS l_nama_lahan, l.lokasi_desa, l.pemilik_kelompok_tani
       FROM warehouses w LEFT JOIN lands l ON w.lahan_id = l.id
       WHERE w.id = ? LIMIT 1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Data gudang berhasil diperbarui.',
      data: mapRowToWarehouse(updatedRow[0]),
    });
  } catch (error) {
    console.error('[updateWarehouse] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data gudang.' });
  }
}

// ── Controller: Hapus Gudang (hanya jika stok kosong) ─────────────────────────

export async function deleteWarehouse(req, res) {
  try {
    const pool = getPool();
    const [existing] = await pool.execute(
      'SELECT id, total_stok_kg FROM warehouses WHERE id = ? LIMIT 1',
      [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Data gudang tidak ditemukan.' });
    }
    if (Number(existing[0].total_stok_kg) > 0) {
      return res.status(400).json({ success: false, message: 'Gudang masih memiliki stok, tidak bisa dihapus.' });
    }

    await pool.execute('DELETE FROM warehouses WHERE id = ?', [req.params.id]);
    return res.status(200).json({ success: true, message: 'Data gudang berhasil dihapus.' });
  } catch (error) {
    console.error('[deleteWarehouse] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menghapus data gudang.' });
  }
}

// ── Controller: Daftar Batch Stok per Gudang (untuk dropdown bahan produksi) ──

export async function getStockBatchesByWarehouse(req, res) {
  try {
    const [rows] = await getPool().execute(
      `SELECT s.id, s.gudang_id, s.harvest_id, s.kode_batch_stok, s.jumlah_masuk_kg, s.sisa_kg,
              DATE_FORMAT(s.tanggal_masuk, '%Y-%m-%d %H:%i:%s') AS tanggal_masuk,
              s.jenis, s.asal_batch_id,
              h.kode_panen, ab.kode_batch_stok AS asal_kode_batch_stok
       FROM warehouse_stock_batches s
       LEFT JOIN harvests h ON s.harvest_id = h.id
       LEFT JOIN warehouse_stock_batches ab ON s.asal_batch_id = ab.id
       WHERE s.gudang_id = ? AND s.sisa_kg > 0 AND s.jenis = 'SORGUM'
       ORDER BY s.tanggal_masuk ASC, s.id ASC`,
      [req.params.id]
    );
    return res.status(200).json({
      success: true,
      data: rows.map((r) => ({
        id: String(r.id),
        gudangId: String(r.gudang_id),
        harvestId: r.harvest_id != null ? String(r.harvest_id) : null,
        kodeBatchStok: r.kode_batch_stok,
        jenis: r.jenis || 'SORGUM',
        asalBatch: r.asal_batch_id ? { id: String(r.asal_batch_id), kodeBatchStok: r.asal_kode_batch_stok } : null,
        kodePanen: r.kode_panen || null,
        jumlahMasukKg: Number(r.jumlah_masuk_kg || 0),
        sisaKg: Number(r.sisa_kg || 0),
        tanggalMasuk: r.tanggal_masuk,
      })),
    });
  } catch (error) {
    console.error('[getStockBatchesByWarehouse] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar batch stok.' });
  }
}

// ── Controller: Semua Batch Stok SORGUM lintas gudang (untuk dropdown bahan produksi 1 tahap) ──

export async function getAllStockSorgum(req, res) {
  try {
    const [rows] = await getPool().execute(
      `SELECT s.id, s.gudang_id, s.harvest_id, s.kode_batch_stok, s.jumlah_masuk_kg, s.sisa_kg,
              DATE_FORMAT(s.tanggal_masuk, '%Y-%m-%d %H:%i:%s') AS tanggal_masuk,
              s.jenis, s.asal_batch_id,
              w.kode_gudang, w.nama_gudang,
              l.nama_lahan AS l_nama_lahan,
              h.kode_panen, h.varietas AS h_varietas,
              ab.kode_batch_stok AS asal_kode_batch_stok
       FROM warehouse_stock_batches s
       LEFT JOIN warehouses w ON s.gudang_id = w.id
       LEFT JOIN lands l ON w.lahan_id = l.id
       LEFT JOIN harvests h ON s.harvest_id = h.id
       LEFT JOIN warehouse_stock_batches ab ON s.asal_batch_id = ab.id
       WHERE s.sisa_kg > 0 AND s.jenis = 'SORGUM'
       ORDER BY w.nama_gudang ASC, s.tanggal_masuk ASC, s.id ASC`
    );
    return res.status(200).json({
      success: true,
      data: rows.map((r) => ({
        id: String(r.id),
        gudangId: String(r.gudang_id),
        kodeGudang: r.kode_gudang,
        namaGudang: r.nama_gudang,
        namaLahan: r.l_nama_lahan || null,
        harvestId: r.harvest_id != null ? String(r.harvest_id) : null,
        kodeBatchStok: r.kode_batch_stok,
        jenis: r.jenis || 'SORGUM',
        asalBatch: r.asal_batch_id ? { id: String(r.asal_batch_id), kodeBatchStok: r.asal_kode_batch_stok } : null,
        kodePanen: r.kode_panen || null,
        varietas: r.h_varietas || null,
        jumlahMasukKg: Number(r.jumlah_masuk_kg || 0),
        sisaKg: Number(r.sisa_kg || 0),
        tanggalMasuk: r.tanggal_masuk,
      })),
    });
  } catch (error) {
    console.error('[getAllStockSorgum] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar stok sorgum.' });
  }
}

// ── Controller: Stok Masuk (WAJIB dari panen yang belum penuh masuk) ──────────

export async function stockIn(req, res) {
  try {
    const { harvestId, jumlahKg, tanggalMasuk, keterangan } = req.body || {};
    const pool = getPool();

    const qty = Number(jumlahKg);
    if (!qty || qty <= 0) return res.status(400).json({ success: false, message: 'Jumlah stok masuk tidak valid.' });

    const hid = harvestId ? Number(harvestId) : null;
    if (!hid) return res.status(400).json({ success: false, message: 'Pilih dulu dari panen mana stok masuk.' });

    // Ambil data panen (validasi & tentukan gudang lahan otomatis)
    const [hr] = await pool.execute(
      `SELECT h.id, h.kode_panen, h.lahan_id, h.jumlah_hasil_kg,
              COALESCE((SELECT SUM(sb.jumlah_masuk_kg) FROM warehouse_stock_batches sb WHERE sb.harvest_id = h.id), 0) AS sudah_masuk_kg
       FROM harvests h WHERE h.id = ? LIMIT 1`,
      [hid]
    );
    if (hr.length === 0) return res.status(404).json({ success: false, message: 'Data panen tidak ditemukan.' });

    const sisaBelumMasuk = Math.max(0, Number(hr[0].jumlah_hasil_kg || 0) - Number(hr[0].sudah_masuk_kg || 0));
    if (qty > sisaBelumMasuk) {
      return res.status(400).json({
        success: false,
        message: `Melebihi sisa panen ${hr[0].kode_panen}. Sisa belum masuk gudang hanya ${sisaBelumMasuk} kg.`,
      });
    }

    // Gudang = gudang lahan dari panen (auto)
    const [wg] = await pool.execute('SELECT id FROM warehouses WHERE lahan_id = ? LIMIT 1', [hr[0].lahan_id]);
    if (wg.length === 0) return res.status(400).json({ success: false, message: 'Lahan panen belum punya gudang.' });
    const gudangId = wg[0].id;

    // Buat batch stok GABAH — hasil panen masuk sebagai gabah.
    // Kode: GAB-<kode panen> (contoh GAB-GRT-10092026-01); bila panen yg sama masuk
    // lebih dari 1x (pecahan), tambah -02, -03 dst.
    const kodeBatchStok = await kodeUnik(
      (seq) => (seq === 1
        ? `GAB-${hr[0].kode_panen}`
        : `GAB-${hr[0].kode_panen}-${String(seq).padStart(2, '0')}`),
      buatCekAda(pool, 'warehouse_stock_batches', 'kode_batch_stok')
    );

    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const tanggal = tanggalMasuk
      ? toISODate(tanggalMasuk) + ` ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
      : `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;

    await pool.execute(
      `INSERT INTO warehouse_stock_batches (gudang_id, harvest_id, kode_batch_stok, jumlah_masuk_kg, sisa_kg, tanggal_masuk, jenis)
       VALUES (?, ?, ?, ?, ?, ?, 'GABAH')`,
      [gudangId, hid, kodeBatchStok, qty, qty, tanggal]
    );

    // Update total stok gudang
    await pool.execute(
      `UPDATE warehouses SET total_stok_kg = total_stok_kg + ? WHERE id = ?`,
      [qty, gudangId]
    );

    // Catat riwayat
    await pool.execute(
      `INSERT INTO warehouse_movements (gudang_id, tipe, jumlah_kg, keterangan, harvest_id)
       VALUES (?, 'MASUK', ?, ?, ?)`,
      [gudangId, qty, keterangan || `Hasil panen ${hr[0].kode_panen}`, hid]
    );

    return res.status(201).json({
      success: true,
      message: 'Stok berhasil masuk ke gudang.',
      data: { gudangId: String(gudangId), harvestId: String(hid), kodeBatchStok, jumlahKg: qty },
    });
  } catch (error) {
    console.error('[stockIn] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mencatat stok masuk.' });
  }
}

// ── Controller: Proses Sosoh (GABAH → SORGUM) ─────────────────────────────────
// Input: pilih batch gabah, kg gabah disosoh, kg sorgum hasil.
// Efek: sisa batch gabah berkurang; batch SORGUM baru dibuat; total stok gudang disesuaikan.

export async function processSosoh(req, res) {
  try {
    const { gudangId, batchGabahId, kgGabah, kgHasilSorgum, operator, keterangan } = req.body || {};
    const pool = getPool();

    const gid = gudangId ? Number(gudangId) : null;
    const bid = batchGabahId ? Number(batchGabahId) : null;
    if (!gid) return res.status(400).json({ success: false, message: 'Gudang tidak valid.' });
    if (!bid) return res.status(400).json({ success: false, message: 'Pilih dulu batch gabah yang akan disosoh.' });

    const kgPakai = Number(kgGabah);
    const kgHasil = Number(kgHasilSorgum);
    if (!kgPakai || kgPakai <= 0) return res.status(400).json({ success: false, message: 'Jumlah gabah yang disosoh tidak valid.' });
    if (!kgHasil || kgHasil <= 0) return res.status(400).json({ success: false, message: 'Jumlah hasil sorgum sosoh tidak valid.' });
    if (kgHasil > kgPakai) {
      return res.status(400).json({ success: false, message: 'Hasil sorgum tidak bisa melebihi gabah yang disosoh (sekam terbuang).' });
    }

    const [wg] = await pool.execute('SELECT id, total_stok_kg FROM warehouses WHERE id = ? LIMIT 1', [gid]);
    if (wg.length === 0) return res.status(404).json({ success: false, message: 'Gudang tidak ditemukan.' });

    // Ambil batch gabah
    const [batch] = await pool.execute(
      `SELECT s.id, s.jenis, s.sisa_kg, s.kode_batch_stok, s.harvest_id
       FROM warehouse_stock_batches s
       WHERE s.id = ? AND s.gudang_id = ? LIMIT 1`,
      [bid, gid]
    );
    if (batch.length === 0) return res.status(404).json({ success: false, message: 'Batch tidak ditemukan di gudang ini.' });
    if (batch[0].jenis !== 'GABAH') return res.status(400).json({ success: false, message: 'Hanya batch GABAH yang bisa disosoh.' });

    const sisaGabah = Number(batch[0].sisa_kg || 0);
    if (kgPakai > sisaGabah) {
      return res.status(400).json({ success: false, message: `Gabah tidak cukup. Sisa batch ${batch[0].kode_batch_stok} hanya ${sisaGabah} kg.` });
    }

    // Kurangi batch gabah
    await pool.execute(`UPDATE warehouse_stock_batches SET sisa_kg = sisa_kg - ? WHERE id = ?`, [kgPakai, bid]);

    // Ambil kode panen asal dari harvest batch gabah (untuk kode SRG bermakna)
    let kodePanenAsal = null;
    if (batch[0].harvest_id) {
      const [hrow] = await pool.execute('SELECT kode_panen FROM harvests WHERE id=? LIMIT 1', [batch[0].harvest_id]);
      kodePanenAsal = hrow[0]?.kode_panen || null;
    }

    // Kode batch sorgum: SRG-<kode panen asal> (contoh SRG-GRT-10092026-01);
    // sosoh kedua dari panen yg sama → -02 dst.
    const kodeSorgum = await kodeUnik(
      (seq) => (seq === 1
        ? `SRG-${kodePanenAsal || 'SOSOH'}`
        : `SRG-${kodePanenAsal || 'SOSOH'}-${String(seq).padStart(2, '0')}`),
      buatCekAda(pool, 'warehouse_stock_batches', 'kode_batch_stok')
    );

    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const tanggalSekarang = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;

    // Buat batch sorgum — asal_batch_id menunjuk batch gabah
    const [ins] = await pool.execute(
      `INSERT INTO warehouse_stock_batches (gudang_id, harvest_id, kode_batch_stok, jumlah_masuk_kg, sisa_kg, tanggal_masuk, jenis, asal_batch_id, tanggal_sosoh, operator_sosoh)
       VALUES (?, ?, ?, ?, ?, ?, 'SORGUM', ?, ?, ?)`,
      [gid, batch[0].harvest_id, kodeSorgum, kgHasil, kgHasil, tanggalSekarang, bid, tanggalSekarang, operator || null]
    );
    const sorgumBatchId = ins.insertId;

    // Update total stok gudang: berkurang kgPakai, bertambah kgHasil
    const delta = kgHasil - kgPakai;
    await pool.execute(`UPDATE warehouses SET total_stok_kg = total_stok_kg + ? WHERE id = ?`, [delta, gid]);

    // Catat jejak sosoh — kode SOS lanjut dari MAX(id), bukan COUNT(*) (yg bisa duplikat saat baris dihapus)
    const [sMax] = await pool.execute('SELECT COALESCE(MAX(id), 0) AS mx FROM sosoh_processes');
    const kodeSosoh = await kodeUnik(
      (seq) => `SOS-${String(seq).padStart(3, '0')}`,
      buatCekAda(pool, 'sosoh_processes', 'kode_sosoh'),
      Number(sMax[0].mx) + 1
    );
    const rendemen = kgPakai > 0 ? Math.round((kgHasil / kgPakai) * 1000) / 10 : 0;
    await pool.execute(
      `INSERT INTO sosoh_processes (kode_sosoh, gudang_id, batch_gabah_id, batch_sorgum_id, kg_gabah_dipakai, kg_sorgum_hasil, rendemen_persen, operator, keterangan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [kodeSosoh, gid, bid, sorgumBatchId, kgPakai, kgHasil, rendemen, operator || null, keterangan || null]
    );

    // Riwayat internal (tidak ditampilkan detail di UI, hanya integritas)
    await pool.execute(
      `INSERT INTO warehouse_movements (gudang_id, tipe, jumlah_kg, keterangan, stock_batch_id, harvest_id)
       VALUES (?, 'KELUAR', ?, ?, ?, ?)`,
      [gid, kgPakai, `Gabah ${batch[0].kode_batch_stok} disosoh menjadi ${kodeSorgum}`, bid, batch[0].harvest_id]
    );
    await pool.execute(
      `INSERT INTO warehouse_movements (gudang_id, tipe, jumlah_kg, keterangan, stock_batch_id, harvest_id)
       VALUES (?, 'MASUK', ?, ?, ?, ?)`,
      [gid, kgHasil, `Hasil sosoh ${batch[0].kode_batch_stok} → ${kodeSorgum}`, sorgumBatchId, batch[0].harvest_id]
    );

    return res.status(201).json({
      success: true,
      message: `Proses sosoh berhasil: ${kgPakai} kg gabah → ${kgHasil} kg sorgum (rendemen ${rendemen}%).`,
      data: {
        kodeSosoh,
        batchGabahId: String(bid),
        kodeBatchGabah: batch[0].kode_batch_stok,
        kodeBatchSorgum: kodeSorgum,
        batchSorgumId: String(sorgumBatchId),
        kgGabah: kgPakai,
        kgHasil,
        rendemen,
      },
    });
  } catch (error) {
    console.error('[processSosoh] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memproses sosoh.' });
  }
}

// ── Controller: Stok Keluar (WAJIB pilih dari batch stok yang mana) ───────────

export async function stockOut(req, res) {
  try {
    const { gudangId, stockBatchId, jumlahKg, productionId, keterangan } = req.body || {};
    const pool = getPool();

    const [wg] = await pool.execute('SELECT id, total_stok_kg FROM warehouses WHERE id = ? LIMIT 1', [gudangId]);
    if (wg.length === 0) return res.status(404).json({ success: false, message: 'Gudang tidak ditemukan.' });

    const qty = Number(jumlahKg);
    if (!qty || qty <= 0) return res.status(400).json({ success: false, message: 'Jumlah stok keluar tidak valid.' });

    // WAJIB pilih batch stok tertentu (bukan otomatis FIFO)
    const bid = stockBatchId ? Number(stockBatchId) : null;
    if (!bid) return res.status(400).json({ success: false, message: 'Pilih dulu dari stok batch mana yang dikeluarkan.' });

    const [batch] = await pool.execute(
      `SELECT s.id, s.jenis, s.sisa_kg, s.harvest_id, s.kode_batch_stok,
              h.kode_panen
       FROM warehouse_stock_batches s
       LEFT JOIN harvests h ON s.harvest_id = h.id
       WHERE s.id = ? AND s.gudang_id = ? LIMIT 1`,
      [bid, gudangId]
    );
    if (batch.length === 0) return res.status(404).json({ success: false, message: 'Batch stok tidak ditemukan di gudang ini.' });
    if (batch[0].jenis !== 'SORGUM') {
      return res.status(400).json({ success: false, message: `Batch ${batch[0].kode_batch_stok} masih gabah. Proses sosoh dulu sebelum dipakai untuk olahan.` });
    }

    const sisaBatch = Number(batch[0].sisa_kg || 0);
    if (qty > sisaBatch) {
      return res.status(400).json({
        success: false,
        message: `Melebihi sisa batch ${batch[0].kode_panen ? 'panen ' + batch[0].kode_panen + ' ' : ''}— tersisa ${sisaBatch} kg.`,
      });
    }

    // Kurangi batch stok terpilih
    await pool.execute(
      `UPDATE warehouse_stock_batches SET sisa_kg = sisa_kg - ? WHERE id = ?`,
      [qty, bid]
    );

    // Update total stok gudang
    await pool.execute(
      `UPDATE warehouses SET total_stok_kg = total_stok_kg - ? WHERE id = ?`,
      [qty, gudangId]
    );

    const pid = productionId ? Number(productionId) : null;
    const asalBatch = batch[0].kode_panen ? ` (dari panen ${batch[0].kode_panen})` : '';
    await pool.execute(
      `INSERT INTO warehouse_movements (gudang_id, tipe, jumlah_kg, keterangan, production_id, harvest_id, stock_batch_id)
       VALUES (?, 'KELUAR', ?, ?, ?, ?, ?)`,
      [gudangId, qty, (keterangan || 'Stok keluar') + asalBatch, pid, batch[0].harvest_id, bid]
    );

    return res.status(200).json({
      success: true,
      message: 'Stok berhasil dikeluarkan.',
      data: { gudangId: String(gudangId), stockBatchId: String(bid), jumlahKg: qty },
    });
  } catch (error) {
    console.error('[stockOut] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mencatat stok keluar.' });
  }
}

// ── Controller: Ringkasan Stok Semua Gudang (untuk dropdown olahan) ───────────

export async function getWarehouseOptions(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT w.id, w.kode_gudang, w.nama_gudang, w.total_stok_kg, w.lahan_id,
              l.nama_lahan AS l_nama_lahan
       FROM warehouses w LEFT JOIN lands l ON w.lahan_id = l.id
       ORDER BY w.nama_gudang ASC`
    );
    return res.status(200).json({
      success: true,
      data: rows.map((r) => ({
        id: String(r.id),
        kodeGudang: r.kode_gudang,
        namaGudang: r.nama_gudang,
        totalStokKg: Number(r.total_stok_kg || 0),
        lahanId: r.lahan_id != null ? String(r.lahan_id) : null,
        namaLahan: r.l_nama_lahan || null,
      })),
    });
  } catch (error) {
    console.error('[getWarehouseOptions] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil opsi gudang.' });
  }
}

// ── Controller: Opsi Panen untuk Stok Masuk (hanya yang belum penuh masuk) ────

/**
 * GET /api/warehouse/harvest-options
 * Mengembalikan daftar panen yang BELUM sepenuhnya masuk gudang:
 * sisa = jumlah_hasil_kg - SUM(jumlah_masuk_kg batch stok milik panen itu).
 */
export async function getHarvestOptions(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT h.id, h.kode_panen, h.varietas, DATE_FORMAT(h.tanggal_panen, '%Y-%m-%d') AS tanggal_panen,
              h.jumlah_hasil_kg, h.lahan_id, l.nama_lahan AS l_nama_lahan,
              COALESCE((SELECT SUM(sb.jumlah_masuk_kg) FROM warehouse_stock_batches sb WHERE sb.harvest_id = h.id), 0) AS sudah_masuk_kg
       FROM harvests h
       LEFT JOIN lands l ON h.lahan_id = l.id
       WHERE h.jumlah_hasil_kg > 0
       ORDER BY h.tanggal_panen DESC, h.id DESC`
    );

    const data = rows
      .map((r) => ({
        id: String(r.id),
        kodePanen: r.kode_panen,
        varietas: r.varietas,
        tanggalPanen: toISODate(r.tanggal_panen),
        jumlahHasilKg: Number(r.jumlah_hasil_kg || 0),
        lahanId: r.lahan_id != null ? String(r.lahan_id) : null,
        namaLahan: r.l_nama_lahan || null,
        sudahMasukKg: Number(r.sudah_masuk_kg || 0),
        sisaBelumMasukKg: Math.max(0, Number(r.jumlah_hasil_kg || 0) - Number(r.sudah_masuk_kg || 0)),
      }))
      .filter((x) => x.sisaBelumMasukKg > 0); // hanya panen yang masih ada sisa belum masuk

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[getHarvestOptions] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil opsi panen.' });
  }
}

// ── Controller: Riwayat Gudang (masuk, keluar, sosoh) dengan filter ─────────

/**
 * GET /api/warehouse/:id/history?bulan=YYYY-MM&search=...&page=1&limit=10
 * Riwayat aktivitas gudang:
 *  - MASUK  : stok hasil panen masuk gudang
 *  - KELUAR : stok keluar (dipakai olahan / keperluan lain)
 *  - SOSOH  : proses pengolahan gabah → sorgum (1 baris, tidak duplikat)
 * Bisa difilter per bulan & dicari (kode batch, keterangan, operator).
 */
export async function getWarehouseHistory(req, res) {
  try {
    const pool = getPool();
    const gudangId = Number(req.params.id);
    if (!gudangId) return res.status(400).json({ success: false, message: 'Gudang tidak valid.' });

    const bulan = String(req.query.bulan || '').trim(); // YYYY-MM
    const search = String(req.query.search || '').trim();
    const tipe = String(req.query.tipe || '').trim().toUpperCase(); // MASUK / KELUAR / SOSOH / ''
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    // ── Kondisi filter dinamis (dipakai di query data & count) ──
    const kondisi = [];
    const params = [];
    if (bulan && /^\d{4}-\d{2}$/.test(bulan)) {
      kondisi.push("DATE_FORMAT(created_at, '%Y-%m') = ?");
      params.push(bulan);
    }
    if (search) {
      kondisi.push(
        '(kode_batch LIKE ? OR COALESCE(keterangan, \'\') LIKE ? OR COALESCE(operator, \'\') LIKE ? OR COALESCE(kode_sosoh, \'\') LIKE ? OR COALESCE(kode_batch_gabah, \'\') LIKE ? OR COALESCE(kode_batch_sorgum, \'\') LIKE ?)'
      );
      const like = `%${search}%`;
      params.push(like, like, like, like, like, like);
    }
    if (tipe === 'MASUK' || tipe === 'KELUAR' || tipe === 'SOSOH') {
      kondisi.push('tipe = ?');
      params.push(tipe);
    }
    const whereSql = kondisi.length ? `WHERE ${kondisi.join(' AND ')}` : '';

    // ── Data gabungan: movement (masuk/keluar non-sosoh) + proses sosoh ──
    const [rows] = await pool.query(
      `SELECT * FROM (
         SELECT CONCAT('M-', m.id) AS id,
                m.tipe,
                m.jumlah_kg,
                m.keterangan,
                DATE_FORMAT(m.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                sb.kode_batch_stok AS kode_batch,
                NULL AS kode_sosoh,
                NULL AS kode_batch_gabah,
                NULL AS kode_batch_sorgum,
                NULL AS kg_gabah,
                NULL AS kg_sorgum,
                NULL AS rendemen,
                NULL AS operator
         FROM warehouse_movements m
         LEFT JOIN warehouse_stock_batches sb ON m.stock_batch_id = sb.id
         WHERE m.gudang_id = ?
           AND LOWER(COALESCE(m.keterangan, '')) NOT LIKE '%sosoh%'
         UNION ALL
         SELECT CONCAT('S-', sp.id) AS id,
                'SOSOH' AS tipe,
                sp.kg_sorgum_hasil AS jumlah_kg,
                sp.keterangan,
                DATE_FORMAT(sp.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                sg.kode_batch_stok AS kode_batch,
                sp.kode_sosoh,
                gb.kode_batch_stok AS kode_batch_gabah,
                sg.kode_batch_stok AS kode_batch_sorgum,
                sp.kg_gabah_dipakai AS kg_gabah,
                sp.kg_sorgum_hasil AS kg_sorgum,
                sp.rendemen_persen AS rendemen,
                sp.operator
         FROM sosoh_processes sp
         LEFT JOIN warehouse_stock_batches gb ON sp.batch_gabah_id = gb.id
         LEFT JOIN warehouse_stock_batches sg ON sp.batch_sorgum_id = sg.id
         WHERE sp.gudang_id = ?
       ) riwayat
       ${whereSql}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [gudangId, gudangId, ...params, limit, offset]
    );

    // ── Total akurat: query sama tanpa LIMIT/OFFSET ──
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM (
         SELECT CONCAT('M-', m.id) AS id, m.tipe,
                DATE_FORMAT(m.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                sb.kode_batch_stok AS kode_batch, m.keterangan,
                NULL AS operator, NULL AS kode_sosoh,
                NULL AS kode_batch_gabah, NULL AS kode_batch_sorgum
         FROM warehouse_movements m
         LEFT JOIN warehouse_stock_batches sb ON m.stock_batch_id = sb.id
         WHERE m.gudang_id = ?
           AND LOWER(COALESCE(m.keterangan, '')) NOT LIKE '%sosoh%'
         UNION ALL
         SELECT CONCAT('S-', sp.id) AS id, 'SOSOH',
                DATE_FORMAT(sp.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                sg.kode_batch_stok AS kode_batch, sp.keterangan,
                sp.operator, sp.kode_sosoh,
                gb.kode_batch_stok AS kode_batch_gabah, sg.kode_batch_stok AS kode_batch_sorgum
         FROM sosoh_processes sp
         LEFT JOIN warehouse_stock_batches gb ON sp.batch_gabah_id = gb.id
         LEFT JOIN warehouse_stock_batches sg ON sp.batch_sorgum_id = sg.id
         WHERE sp.gudang_id = ?
       ) riwayat
       ${whereSql}`,
      [gudangId, gudangId, ...params]
    );
    const total = Number(countRows[0]?.total || 0);

    const data = rows.map((r) => ({
      id: String(r.id),
      tipe: r.tipe,
      jumlahKg: Number(r.jumlah_kg || 0),
      keterangan: r.keterangan || null,
      createdAt: r.created_at,
      kodeBatch: r.kode_batch || null,
      kodeSosoh: r.kode_sosoh || null,
      kodeBatchGabah: r.kode_batch_gabah || null,
      kodeBatchSorgum: r.kode_batch_sorgum || null,
      kgGabah: r.kg_gabah != null ? Number(r.kg_gabah) : null,
      kgSorgum: r.kg_sorgum != null ? Number(r.kg_sorgum) : null,
      rendemen: r.rendemen != null ? Number(r.rendemen) : null,
      operator: r.operator || null,
    }));

    return res.status(200).json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[getWarehouseHistory] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil riwayat gudang.' });
  }
}

// ── Controller: Trace Lengkap Satu Batch Stok (tanam → panen → gudang → olahan → logistik) ──

/**
 * GET /api/warehouse/:gudangId/trace/:batchId
 * Mengembalikan riwayat hidup batch: lahan, tanam, panen, masuk gudang, keluar (olahan), logistik.
 */
export async function getBatchTrace(req, res) {
  try {
    const pool = getPool();
    const { gudangId, batchId } = req.params;

    // 1. Batch stok + lahan + harvest
    const [bs] = await pool.execute(
      `SELECT s.id, s.gudang_id, s.harvest_id, s.kode_batch_stok, s.jumlah_masuk_kg, s.sisa_kg,
              DATE_FORMAT(s.tanggal_masuk, '%Y-%m-%d %H:%i:%s') AS tanggal_masuk,
              s.jenis, s.asal_batch_id, DATE_FORMAT(s.tanggal_sosoh, '%Y-%m-%d %H:%i:%s') AS tanggal_sosoh,
              w.kode_gudang, w.nama_gudang,
              l.kode_lahan, l.nama_lahan AS l_nama_lahan, l.lokasi_desa, l.luas_hektar, l.varietas_sorgum,
              h.kode_panen, h.nama_lahan AS h_nama_lahan, h.varietas AS h_varietas,
              DATE_FORMAT(h.tanggal_panen, '%Y-%m-%d') AS tanggal_panen,
              h.jumlah_hasil_kg, h.kualitas_grade, h.petani_penanggung_jawab, h.status AS h_status, h.periode_hari,
              p.kode_tanam, DATE_FORMAT(p.tanggal_tanam, '%Y-%m-%d') AS tanggal_tanam,
              DATE_FORMAT(p.estimasi_panen, '%Y-%m-%d') AS estimasi_panen, p.petugas AS petugas_tanam, p.status_tanam,
              ab.kode_batch_stok AS asal_kode_batch_stok, ab.jumlah_masuk_kg AS asal_jumlah_masuk_kg,
              ab.sisa_kg AS asal_sisa_kg, DATE_FORMAT(ab.tanggal_masuk, '%Y-%m-%d %H:%i:%s') AS asal_tanggal_masuk
       FROM warehouse_stock_batches s
       LEFT JOIN warehouses w ON s.gudang_id = w.id
       LEFT JOIN lands l ON w.lahan_id = l.id
       LEFT JOIN harvests h ON s.harvest_id = h.id
       LEFT JOIN plantings p ON h.planting_id = p.id
       LEFT JOIN warehouse_stock_batches ab ON s.asal_batch_id = ab.id
       WHERE s.id = ? AND s.gudang_id = ?
       LIMIT 1`,
      [batchId, gudangId]
    );
    if (bs.length === 0) {
      return res.status(404).json({ success: false, message: 'Batch stok tidak ditemukan di gudang ini.' });
    }
    const b = bs[0];

    // 1b. Info proses sosoh bila batch ini hasil sosoh (SORGUM)
    let sosohInfo = null;
    if (b.asal_batch_id) {
      const [sos] = await pool.execute(
        `SELECT sp.kg_gabah_dipakai, sp.kg_sorgum_hasil, sp.rendemen_persen, sp.operator, sp.keterangan,
                DATE_FORMAT(sp.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
         FROM sosoh_processes sp
         WHERE sp.batch_sorgum_id = ?
         ORDER BY sp.id DESC LIMIT 1`,
        [b.id]
      );
      if (sos.length) {
        const s = sos[0];
        sosohInfo = {
          kgGabahDipakai: Number(s.kg_gabah_dipakai || 0),
          kgSorgumHasil: Number(s.kg_sorgum_hasil || 0),
          rendemenPersen: Number(s.rendemen_persen || 0),
          operator: s.operator || null,
          createdAt: s.created_at,
        };
      }
    }

    // 2. Pergerakan batch ini (masuk & keluar)
    const [movs] = await pool.execute(
      `SELECT m.id, m.tipe, m.jumlah_kg, m.keterangan,
              DATE_FORMAT(m.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
              p.kode_batch, p.nama_produk
       FROM warehouse_movements m
       LEFT JOIN production_batches p ON m.production_id = p.id
       WHERE m.stock_batch_id = ? OR (m.harvest_id = ? AND m.gudang_id = ?)
       ORDER BY m.created_at ASC, m.id ASC`,
      [batchId, b.harvest_id, gudangId]
    );

    // 3. Batch olahan yang memakai batch stok ini (dari production_batches.stock_batch_id)
    const [productions] = await pool.execute(
      `SELECT b.id, b.kode_batch, b.nama_produk, b.kategori, b.tanggal_produksi, b.tanggal_kadaluarsa,
              b.jumlah_hasil, b.satuan, b.bahan_digunakan, b.operator_produksi, b.status_qc, b.lokasi_gudang,
              DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
       FROM production_batches b
       WHERE b.stock_batch_id = ?
       ORDER BY b.created_at ASC, b.id ASC`,
      [batchId]
    );

    // 4. Logistik terkait (kategori Kemasan/Transportasi/Bahan Baku — opsional, terkait panen via keterangan)
    const [logistics] = await pool.execute(
      `SELECT id, kode_transaksi, tanggal, kategori, keterangan_vendor, total_biaya_rp,
              status_pembayaran, metode_pembayaran, nomor_nota_receipt
       FROM logistics_expenses
       ORDER BY created_at DESC
       LIMIT 10`
    );

    const harvestInfo = b.harvest_id ? {
      id: String(b.harvest_id),
      kodePanen: b.kode_panen,
      namaLahan: b.l_nama_lahan || b.h_nama_lahan || '',
      varietas: b.h_varietas || b.varietas_sorgum || '',
      tanggalPanen: b.tanggal_panen,
      jumlahHasilKg: Number(b.jumlah_hasil_kg || 0),
      kualitasGrade: b.kualitas_grade,
      petaniPenanggungJawab: b.petani_penanggung_jawab,
      status: b.h_status,
      periodeHari: b.periode_hari,
    } : null;

    const landInfo = b.kode_lahan ? {
      kodeLahan: b.kode_lahan,
      namaLahan: b.l_nama_lahan,
      lokasiDesa: b.lokasi_desa,
    } : null;

    const plantingInfo = b.kode_tanam ? {
      kodeTanam: b.kode_tanam,
      tanggalTanam: b.tanggal_tanam,
      estimasiPanen: b.estimasi_panen ? toDateStr(b.estimasi_panen) : null,
      petugas: b.petugas_tanam,
      statusTanam: b.status_tanam,
    } : null;

    const masuk = movs.find((m) => m.tipe === 'MASUK');
    const keluar = movs.filter((m) => m.tipe === 'KELUAR');

    return res.status(200).json({
      success: true,
      data: {
        batch: {
          id: String(b.id),
          kodeBatchStok: b.kode_batch_stok,
          jenis: b.jenis || 'GABAH',
          asalBatch: b.asal_batch_id
            ? {
                id: String(b.asal_batch_id),
                kodeBatchStok: b.asal_kode_batch_stok,
                jumlahMasukKg: b.asal_jumlah_masuk_kg != null ? Number(b.asal_jumlah_masuk_kg) : null,
                sisaKg: b.asal_sisa_kg != null ? Number(b.asal_sisa_kg) : null,
                tanggalMasuk: b.asal_tanggal_masuk || null,
              }
            : null,
          sosoh: sosohInfo,
          tanggalSosoh: b.tanggal_sosoh,
          jumlahMasukKg: Number(b.jumlah_masuk_kg || 0),
          sisaKg: Number(b.sisa_kg || 0),
          tanggalMasuk: b.tanggal_masuk,
        },
        gudang: {
          id: String(b.gudang_id),
          kodeGudang: b.kode_gudang,
          namaGudang: b.nama_gudang,
        },
        lahan: landInfo,
        tanam: plantingInfo,
        panen: harvestInfo,
        movements: movs.map((m) => ({
          id: String(m.id),
          tipe: m.tipe,
          jumlahKg: Number(m.jumlah_kg || 0),
          keterangan: m.keterangan || '',
          createdAt: m.created_at,
          kodeBatch: m.kode_batch || null,
          namaProduk: m.nama_produk || null,
        })),
        produksi: productions.map((p) => ({
          id: String(p.id),
          kodeBatch: p.kode_batch,
          namaProduk: p.nama_produk,
          kategori: p.kategori,
          tanggalProduksi: p.tanggal_produksi,
          jumlahHasil: Number(p.jumlah_hasil || 0),
          satuan: p.satuan,
          bahanDigunakan: p.bahan_digunakan != null ? Number(p.bahan_digunakan) : null,
          operatorProduksi: p.operator_produksi,
          statusQC: p.status_qc,
          createdAt: p.created_at,
        })),
        // Logistik terkait (umum — catat di modal trace)
        logistik: logistics.map((lg) => ({
          id: String(lg.id),
          kodeTransaksi: lg.kode_transaksi,
          tanggal: lg.tanggal,
          kategori: lg.kategori,
          keteranganVendor: lg.keterangan_vendor,
          totalBiayaRp: Number(lg.total_biaya_rp || 0),
          statusPembayaran: lg.status_pembayaran,
        })),
      },
    });
  } catch (error) {
    console.error('[getBatchTrace] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil riwayat batch.' });
  }
}
