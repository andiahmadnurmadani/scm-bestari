import { getPool } from '../config/db.js';

// ── Helper ────────────────────────────────────────────────────────────────────

function mapRowToWarehouse(row) {
  return {
    id: String(row.id),
    kodeGudang: row.kode_gudang,
    namaGudang: row.nama_gudang,
    lahanId: row.lahan_id != null ? String(row.lahan_id) : null,
    lokasi: row.lokasi || '',
    kapasitasKg: row.kapasitas_kg != null ? Number(row.kapasitas_kg) : null,
    totalStokKg: Number(row.total_stok_kg || 0),
    // lineage lahan
    lahan: row.lahan_id ? { id: String(row.lahan_id), kodeLahan: row.kode_lahan, namaLahan: row.l_nama_lahan, lokasiDesa: row.lokasi_desa } : null,
    createdAt: row.created_at,
  };
}

function mapRowToStock(row) {
  return {
    id: String(row.id),
    gudangId: String(row.gudang_id),
    harvestId: row.harvest_id != null ? String(row.harvest_id) : null,
    kodeBatchStok: row.kode_batch_stok,
    jumlahMasukKg: Number(row.jumlah_masuk_kg || 0),
    sisaKg: Number(row.sisa_kg || 0),
    tanggalMasuk: row.tanggal_masuk ? String(row.tanggal_masuk).slice(0, 10) : null,
    harvest: row.harvest_id ? { id: String(row.harvest_id), kodePanen: row.kode_panen, tanggalPanen: row.tanggal_panen ? String(row.tanggal_panen).slice(0, 10) : null, varietas: row.varietas } : null,
    createdAt: row.created_at,
  };
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
    kodePanen: row.kode_panen || null,
    kodeBatch: row.kode_batch || null,
    namaProduk: row.nama_produk || null,
    createdAt: row.created_at,
  };
}

function validateWarehouse(data) {
  if (!data.namaGudang || !String(data.namaGudang).trim()) return 'Nama gudang wajib diisi.';
  if (data.kapasitasKg != null && Number(data.kapasitasKg) < 0) return 'Kapasitas gudang tidak valid.';
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
      `SELECT w.id, w.kode_gudang, w.nama_gudang, w.lahan_id, w.lokasi, w.kapasitas_kg, w.total_stok_kg, w.created_at,
              l.kode_lahan, l.nama_lahan AS l_nama_lahan, l.lokasi_desa
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
      `SELECT w.id, w.kode_gudang, w.nama_gudang, w.lahan_id, w.lokasi, w.kapasitas_kg, w.total_stok_kg, w.created_at,
              l.kode_lahan, l.nama_lahan AS l_nama_lahan, l.lokasi_desa
       FROM warehouses w
       LEFT JOIN lands l ON w.lahan_id = l.id
       WHERE w.id = ? LIMIT 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data gudang tidak ditemukan.' });
    }

    const warehouse = mapRowToWarehouse(rows[0]);

    // Batch stok FIFO (urutan masuk terlama dulu — untuk konsumsi)
    const [stocks] = await pool.execute(
      `SELECT s.id, s.gudang_id, s.harvest_id, s.kode_batch_stok, s.jumlah_masuk_kg, s.sisa_kg,
              s.tanggal_masuk, s.created_at,
              h.kode_panen, h.tanggal_panen, h.varietas
       FROM warehouse_stock_batches s
       LEFT JOIN harvests h ON s.harvest_id = h.id
       WHERE s.gudang_id = ? AND s.sisa_kg > 0
       ORDER BY s.tanggal_masuk ASC, s.id ASC`,
      [req.params.id]
    );

    // Riwayat pergerakan
    const [movements] = await pool.execute(
      `SELECT m.id, m.gudang_id, m.tipe, m.jumlah_kg, m.keterangan, m.harvest_id, m.production_id, m.created_at,
              h.kode_panen, p.kode_batch, p.nama_produk
       FROM warehouse_movements m
       LEFT JOIN harvests h ON m.harvest_id = h.id
       LEFT JOIN production_batches p ON m.production_id = p.id
       WHERE m.gudang_id = ?
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT 50`,
      [req.params.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...warehouse,
        stockBatches: stocks.map(mapRowToStock),
        movements: movements.map(mapRowToMovement),
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
    const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM warehouses');
    const seq = Number(countRows[0].total) + 1;
    const kodeGudang = data.kodeGudang || `GDG-${String(seq).padStart(3, '0')}`;

    const lahanId = data.lahanId ? Number(data.lahanId) : null;
    if (lahanId) {
      const [lr] = await pool.execute('SELECT id FROM lands WHERE id=? LIMIT 1', [lahanId]);
      if (!lr.length) return res.status(400).json({ success: false, message: 'Lahan tidak ditemukan.' });
    }

    const [result] = await pool.execute(
      `INSERT INTO warehouses (kode_gudang, nama_gudang, lahan_id, lokasi, kapasitas_kg)
       VALUES (?, ?, ?, ?, ?)`,
      [
        kodeGudang,
        String(data.namaGudang).trim(),
        lahanId,
        data.lokasi || '',
        data.kapasitasKg != null ? Number(data.kapasitasKg) : null,
      ]
    );

    const [newRow] = await pool.execute(
      `SELECT w.id, w.kode_gudang, w.nama_gudang, w.lahan_id, w.lokasi, w.kapasitas_kg, w.total_stok_kg, w.created_at,
              l.kode_lahan, l.nama_lahan AS l_nama_lahan, l.lokasi_desa
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
      kapasitasKg: 'kapasitas_kg',
    };

    const sets = [];
    const values = [];
    for (const [key, column] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        sets.push(`${column} = ?`);
        values.push(data[key] === '' && ['lahanId', 'lokasi', 'kapasitasKg'].includes(key) ? null : data[key]);
      }
    }

    if (sets.length > 0) {
      await pool.execute(`UPDATE warehouses SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    }

    const [updatedRow] = await pool.execute(
      `SELECT w.id, w.kode_gudang, w.nama_gudang, w.lahan_id, w.lokasi, w.kapasitas_kg, w.total_stok_kg, w.created_at,
              l.kode_lahan, l.nama_lahan AS l_nama_lahan, l.lokasi_desa
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

// ── Controller: Stok Masuk (dari panen / manual) ──────────────────────────────

export async function stockIn(req, res) {
  try {
    const { gudangId, harvestId, jumlahKg, tanggalMasuk, keterangan } = req.body || {};
    const pool = getPool();

    const [wg] = await pool.execute('SELECT id, total_stok_kg FROM warehouses WHERE id = ? LIMIT 1', [gudangId]);
    if (wg.length === 0) return res.status(404).json({ success: false, message: 'Gudang tidak ditemukan.' });

    const qty = Number(jumlahKg);
    if (!qty || qty <= 0) return res.status(400).json({ success: false, message: 'Jumlah stok masuk tidak valid.' });

    const hid = harvestId ? Number(harvestId) : null;
    if (hid) {
      const [hr] = await pool.execute('SELECT id FROM harvests WHERE id=? LIMIT 1', [hid]);
      if (!hr.length) return res.status(400).json({ success: false, message: 'Data panen tidak ditemukan.' });
    }

    // Buat batch stok FIFO
    const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM warehouse_stock_batches');
    const seq = Number(countRows[0].total) + 1;
    const kodeBatchStok = `STK-${String(seq).padStart(3, '0')}`;

    const tanggal = tanggalMasuk || new Date().toISOString().slice(0, 10);

    await pool.execute(
      `INSERT INTO warehouse_stock_batches (gudang_id, harvest_id, kode_batch_stok, jumlah_masuk_kg, sisa_kg, tanggal_masuk)
       VALUES (?, ?, ?, ?, ?, ?)`,
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
      [gudangId, qty, keterangan || 'Stok masuk', hid]
    );

    return res.status(201).json({
      success: true,
      message: 'Stok berhasil masuk ke gudang.',
      data: { gudangId: String(gudangId), kodeBatchStok, jumlahKg: qty },
    });
  } catch (error) {
    console.error('[stockIn] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mencatat stok masuk.' });
  }
}

// ── Controller: Stok Keluar (FIFO — otomatis dari batch terlama) ──────────────

export async function stockOut(req, res) {
  try {
    const { gudangId, jumlahKg, productionId, keterangan } = req.body || {};
    const pool = getPool();

    const [wg] = await pool.execute('SELECT id, total_stok_kg FROM warehouses WHERE id = ? LIMIT 1', [gudangId]);
    if (wg.length === 0) return res.status(404).json({ success: false, message: 'Gudang tidak ditemukan.' });

    let sisaPermintaan = Number(jumlahKg);
    if (!sisaPermintaan || sisaPermintaan <= 0) return res.status(400).json({ success: false, message: 'Jumlah stok keluar tidak valid.' });

    const stokTersedia = Number(wg[0].total_stok_kg || 0);
    if (sisaPermintaan > stokTersedia) {
      return res.status(400).json({ success: false, message: `Stok gudang tidak mencukupi. Tersedia ${stokTersedia} kg.` });
    }

    // FIFO: ambil batch stok paling lama masuk dulu (yang masih punya sisa)
    const [batches] = await pool.execute(
      `SELECT id, sisa_kg FROM warehouse_stock_batches
       WHERE gudang_id = ? AND sisa_kg > 0
       ORDER BY tanggal_masuk ASC, id ASC`,
      [gudangId]
    );

    const totalTerpakai = sisaPermintaan;
    for (const b of batches) {
      if (sisaPermintaan <= 0) break;
      const pakai = Math.min(Number(b.sisa_kg), sisaPermintaan);
      await pool.execute(
        `UPDATE warehouse_stock_batches SET sisa_kg = sisa_kg - ? WHERE id = ?`,
        [pakai, b.id]
      );
      sisaPermintaan -= pakai;
    }

    // Update total stok gudang
    await pool.execute(
      `UPDATE warehouses SET total_stok_kg = total_stok_kg - ? WHERE id = ?`,
      [totalTerpakai, gudangId]
    );

    const pid = productionId ? Number(productionId) : null;
    await pool.execute(
      `INSERT INTO warehouse_movements (gudang_id, tipe, jumlah_kg, keterangan, production_id)
       VALUES (?, 'KELUAR', ?, ?, ?)`,
      [gudangId, totalTerpakai, keterangan || 'Stok keluar (dipakai olahan)', pid]
    );

    return res.status(200).json({
      success: true,
      message: 'Stok berhasil keluar (FIFO).',
      data: { gudangId: String(gudangId), jumlahKg: totalTerpakai },
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
