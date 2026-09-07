import { getPool } from '../config/db.js';
import { slugNama, tanggalKode, kodeUnik, buatCekAda, toISODate } from '../utils/kodeUtil.js';

// ── Helper ────────────────────────────────────────────────────────────────────

function mapRowToBatch(row) {
  return {
    id: String(row.id),
    kodeBatch: row.kode_batch,
    namaProduk: row.nama_produk,
    productId: row.product_id != null ? String(row.product_id) : null,
    tanggalProduksi: toISODate(row.tanggal_produksi) || '',
    tanggalKadaluarsa: toISODate(row.tanggal_kadaluarsa) || '',
    jumlahHasil: Number(row.jumlah_hasil),
    satuan: row.satuan,
    bahanDigunakan: row.bahan_digunakan != null ? Number(row.bahan_digunakan) : null,
    satuanBahan: row.satuan_bahan || 'Kg',
    nomorBatchBahanBaku: row.nomor_batch_bahan_baku || '',
    operatorProduksi: row.operator_produksi || '',
    statusQC: row.status_qc,
    lokasiGudang: row.lokasi_gudang || '',
    lahanId: row.lahan_id != null ? String(row.lahan_id) : null,
    plantingId: row.planting_id != null ? String(row.planting_id) : null,
    harvestId: row.harvest_id != null ? String(row.harvest_id) : null,
    gudangId: row.gudang_id != null ? String(row.gudang_id) : null,
    // lineage
    lahan: row.lahan_id ? { id: String(row.lahan_id), kodeLahan: row.kode_lahan, namaLahan: row.nama_lahan } : null,
    planting: row.planting_id ? { id: String(row.planting_id), kodeTanam: row.kode_tanam, tanggalTanam: toISODate(row.tanggal_tanam), estimasiPanen: row.estimasi_panen ? toISODate(row.estimasi_panen) : null, varietas: row.p_varietas, jumlahLubang: row.jumlah_lubang != null ? Number(row.jumlah_lubang) : null, petugas: row.petugas } : null,
    harvest: row.harvest_id ? { id: String(row.harvest_id), kodePanen: row.kode_panen, tanggalPanen: toISODate(row.tanggal_panen), periodeHari: row.periode_hari } : null,
    stockBatchId: row.stock_batch_id != null ? String(row.stock_batch_id) : null,
    // lineage gudang & batch stok (untuk detail)
    gudang: row.gudang_id ? { id: String(row.gudang_id), kodeGudang: row.w_kode_gudang, namaGudang: row.w_nama_gudang } : null,
    stockBatch: row.stock_batch_id
      ? {
          id: String(row.stock_batch_id),
          kodeBatchStok: row.sb_kode_batch_stok,
          jenis: row.sb_jenis || 'GABAH',
          // batch gabah asal (jika batch sorgum dari proses sosoh)
          asalBatch: row.sb_asal_kode_batch_stok ? { kodeBatchStok: row.sb_asal_kode_batch_stok } : null,
        }
      : null,
    createdAt: row.created_at,
  };
}

function validateBatch(data) {
  const qcValues = ['Lolos QC', 'Pending QC', 'Revisi Batch'];
  if (!data.namaProduk || !String(data.namaProduk).trim()) return 'Nama produk wajib diisi.';
  if (data.statusQC && !qcValues.includes(data.statusQC)) return 'Status QC tidak valid.';
  if (data.jumlahHasil != null && Number(data.jumlahHasil) < 0) return 'Jumlah hasil tidak valid.';
  if (data.bahanDigunakan != null && Number(data.bahanDigunakan) < 0) return 'Jumlah bahan tidak valid.';
  return null;
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function getBatches(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = String(req.query.search || '').trim();
    const lahanId = String(req.query.lahanId || req.query.lahan_id || '').trim();
    const harvestId = String(req.query.harvestId || req.query.harvest_id || '').trim();
    const offset = (page - 1) * limit;

    const whereParts = [];
    const params = [];

    if (search) {
      whereParts.push(`(b.kode_batch LIKE ? OR b.nama_produk LIKE ? OR b.operator_produksi LIKE ? OR b.lokasi_gudang LIKE ?)`);
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }
    if (lahanId) { whereParts.push(`b.lahan_id = ?`); params.push(lahanId); }
    if (harvestId) { whereParts.push(`b.harvest_id = ?`); params.push(harvestId); }
    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const pool = getPool();
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM production_batches b ${whereClause}`,
      params
    );
    const total = Number(countRows[0].total);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const [rows] = await pool.query(
      `SELECT b.id, b.kode_batch, b.nama_produk, b.product_id, b.tanggal_produksi, b.tanggal_kadaluarsa,
              b.jumlah_hasil, b.satuan, b.bahan_digunakan, b.satuan_bahan, b.nomor_batch_bahan_baku, b.operator_produksi, b.status_qc, b.lokasi_gudang, b.lahan_id, b.planting_id, b.harvest_id, b.gudang_id, b.stock_batch_id, b.created_at,
              l.kode_lahan, l.nama_lahan, p.kode_tanam, p.tanggal_tanam, h.kode_panen, h.tanggal_panen, h.periode_hari,
              w.kode_gudang AS w_kode_gudang, w.nama_gudang AS w_nama_gudang,
              sb.kode_batch_stok AS sb_kode_batch_stok, sb.jenis AS sb_jenis,
              ab.kode_batch_stok AS sb_asal_kode_batch_stok
       FROM production_batches b
       LEFT JOIN lands l ON b.lahan_id=l.id
       LEFT JOIN plantings p ON b.planting_id=p.id
       LEFT JOIN harvests h ON b.harvest_id=h.id
       LEFT JOIN warehouses w ON b.gudang_id=w.id
       LEFT JOIN warehouse_stock_batches sb ON b.stock_batch_id=sb.id
       LEFT JOIN warehouse_stock_batches ab ON sb.asal_batch_id=ab.id
        ${whereClause}
        ORDER BY b.created_at DESC, b.id DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: rows.map(mapRowToBatch),
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (error) {
    console.error('[getBatches] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data produksi.' });
  }
}

// ── Detail ────────────────────────────────────────────────────────────────────

export async function getBatchById(req, res) {
  try {
    const [rows] = await getPool().execute(
      `SELECT b.id, b.kode_batch, b.nama_produk, b.product_id, b.tanggal_produksi, b.tanggal_kadaluarsa,
              b.jumlah_hasil, b.satuan, b.bahan_digunakan, b.satuan_bahan, b.nomor_batch_bahan_baku, b.operator_produksi, b.status_qc, b.lokasi_gudang, b.lahan_id, b.planting_id, b.harvest_id, b.gudang_id, b.stock_batch_id, b.created_at,
              l.kode_lahan, l.nama_lahan, p.kode_tanam, p.tanggal_tanam, h.kode_panen, h.tanggal_panen, h.periode_hari,
              w.kode_gudang AS w_kode_gudang, w.nama_gudang AS w_nama_gudang,
              sb.kode_batch_stok AS sb_kode_batch_stok, sb.jenis AS sb_jenis,
              ab.kode_batch_stok AS sb_asal_kode_batch_stok
       FROM production_batches b
       LEFT JOIN lands l ON b.lahan_id=l.id
       LEFT JOIN plantings p ON b.planting_id=p.id
       LEFT JOIN harvests h ON b.harvest_id=h.id
       LEFT JOIN warehouses w ON b.gudang_id=w.id
       LEFT JOIN warehouse_stock_batches sb ON b.stock_batch_id=sb.id
       LEFT JOIN warehouse_stock_batches ab ON sb.asal_batch_id=ab.id
       WHERE b.id = ? LIMIT 1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Batch produksi tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, data: mapRowToBatch(rows[0]) });
  } catch (error) {
    console.error('[getBatchById] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail produksi.' });
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createBatch(req, res) {
  try {
    const data = req.body || {};
    const validationError = validateBatch(data);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const pool = getPool();

    // trace: jika harvestId dikirim, auto isi lahan_id & planting_id dari harvest
    let harvestId = data.harvestId ? Number(data.harvestId) : null;
    let plantingId = data.plantingId ? Number(data.plantingId) : null;
    let lahanId = data.lahanId ? Number(data.lahanId) : null;
    if (harvestId) {
      const [hr] = await pool.execute('SELECT lahan_id, planting_id FROM harvests WHERE id=? LIMIT 1', [harvestId]);
      if (!hr.length) return res.status(400).json({ success: false, message: 'Data panen tidak ditemukan.' });
      lahanId = hr[0].lahan_id;
      plantingId = hr[0].planting_id;
      // tetap hormati nomorBatchBahanBaku jika sudah ada, tapi jika kosong isi kode panen
      if (!data.nomorBatchBahanBaku) {
        const [h2] = await pool.execute('SELECT kode_panen FROM harvests WHERE id=?', [harvestId]);
        data.nomorBatchBahanBaku = h2[0]?.kode_panen || '';
      }
    }

    // ── Validasi stok batch SEBELUM simpan: bahan tidak boleh melebihi sisa batch ──
    const gudangId = data.gudangId ? Number(data.gudangId) : null;
    const stockBatchId = data.stockBatchId ? Number(data.stockBatchId) : null;
    const qtyBahan = data.bahanDigunakan != null ? Number(data.bahanDigunakan) : 0;
    if (qtyBahan > 0) {
      if (!gudangId) return res.status(400).json({ success: false, message: 'Pilih gudang asal bahan dulu.' });
      if (!stockBatchId) return res.status(400).json({ success: false, message: 'Pilih stok batch (asal bahan) dulu.' });
      const [bt] = await pool.execute(
        `SELECT s.id, s.jenis, s.sisa_kg, s.kode_batch_stok, s.harvest_id FROM warehouse_stock_batches s WHERE s.id = ? AND s.gudang_id = ? AND s.sisa_kg > 0 LIMIT 1`,
        [stockBatchId, gudangId]
      );
      if (bt.length === 0) {
        return res.status(400).json({ success: false, message: 'Stok batch tidak ditemukan atau sudah habis di gudang ini.' });
      }
      if (bt[0].jenis !== 'SORGUM') {
        return res.status(400).json({
          success: false,
          message: `Batch ${bt[0].kode_batch_stok} masih GABAH. Proses sosoh dulu (ubah gabah jadi sorgum) sebelum dipakai untuk olahan.`,
        });
      }
      if (Number(bt[0].sisa_kg) < qtyBahan) {
        return res.status(400).json({
          success: false,
          message: `Bahan yang digunakan (${qtyBahan} kg) melebihi sisa stok batch ${bt[0].kode_batch_stok} (${Number(bt[0].sisa_kg)} kg). Kurangi jumlah bahan atau pilih batch lain.`,
        });
      }
      // trace otomatis: isi harvestId/lahanId/plantingId dari batch stok (asal bahan)
      if (bt[0].harvest_id && !harvestId) {
        harvestId = Number(bt[0].harvest_id);
        const [hr2] = await pool.execute('SELECT lahan_id, planting_id FROM harvests WHERE id=? LIMIT 1', [harvestId]);
        if (hr2.length) {
          lahanId = hr2[0].lahan_id;
          plantingId = hr2[0].planting_id;
        }
        if (!data.nomorBatchBahanBaku) {
          const [h3] = await pool.execute('SELECT kode_panen FROM harvests WHERE id=?', [harvestId]);
          data.nomorBatchBahanBaku = h3[0]?.kode_panen || '';
        }
      }
    }

    // Buat kode batch produksi otomatis: PRD-<slug nama lahan>-<tgl produksi DDMMYYYY>-<urutan>
    // (mis. PRD-LUS-15092026-01). Ambil nama lahan dari lahan asal bila tersedia.
    let kodeBatch = String(data.kodeBatch || '').trim();
    if (!kodeBatch) {
      let namaLahan = null;
      if (lahanId) {
        const [lr2] = await pool.execute('SELECT nama_lahan FROM lands WHERE id=? LIMIT 1', [lahanId]);
        namaLahan = lr2[0]?.nama_lahan || null;
      }
      const slug = slugNama(namaLahan);
      const tgl = tanggalKode(data.tanggalProduksi);
      kodeBatch = await kodeUnik(
        (seq) => `${slug}-${tgl}-${String(seq).padStart(2, '0')}`,
        buatCekAda(pool, 'production_batches', 'kode_batch'),
        // prefix PRD- disepakati format PRD-<slug>-<tgl>-<no>, jadikan di awal
        // dengan fungsi pembuat kode di bawah
        1
      );
      // format akhir: PRD-<slug>-<DDMMYYYY>-<no>
      kodeBatch = `PRD-${kodeBatch}`;
      // pastikan unik setelah penambahan prefix
      const cekAkhir = buatCekAda(pool, 'production_batches', 'kode_batch');
      let seqAkhir = 1;
      // eslint-disable-next-line no-constant-condition
      while (await cekAkhir(kodeBatch)) {
        seqAkhir += 1;
        kodeBatch = `PRD-${slug}-${tgl}-${String(seqAkhir).padStart(2, '0')}`;
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO production_batches
        (kode_batch, nama_produk, product_id, tanggal_produksi, tanggal_kadaluarsa,
         jumlah_hasil, satuan, bahan_digunakan, satuan_bahan, nomor_batch_bahan_baku, operator_produksi, status_qc, lokasi_gudang, lahan_id, planting_id, harvest_id, gudang_id, stock_batch_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kodeBatch,
        String(data.namaProduk).trim(),
        data.productId ? Number(data.productId) : null,
        data.tanggalProduksi || '',
        data.tanggalKadaluarsa || '',
        Number(data.jumlahHasil) || 0,
        String(data.satuan || 'Pcs'),
        data.bahanDigunakan != null ? Number(data.bahanDigunakan) : null,
        String(data.satuanBahan || 'Kg'),
        data.nomorBatchBahanBaku || '',
        data.operatorProduksi || '',
        data.statusQC || 'Pending QC',
        data.lokasiGudang || '',
        lahanId,
        plantingId,
        harvestId,
        data.gudangId ? Number(data.gudangId) : null,
        data.stockBatchId ? Number(data.stockBatchId) : null,
      ]
    );

    // Kurangi stok gudang dari batch yang dipilih (sudah divalidasi cukup di atas)
    try {
      if (gudangId && stockBatchId && qtyBahan > 0) {
        await pool.execute(
          `UPDATE warehouse_stock_batches SET sisa_kg = sisa_kg - ? WHERE id = ?`,
          [qtyBahan, stockBatchId]
        );
        await pool.execute(
          `UPDATE warehouses SET total_stok_kg = total_stok_kg - ? WHERE id = ?`,
          [qtyBahan, gudangId]
        );
        await pool.execute(
          `INSERT INTO warehouse_movements (gudang_id, tipe, jumlah_kg, keterangan, production_id, stock_batch_id, harvest_id)
           VALUES (?, 'KELUAR', ?, ?, ?, ?, ?)`,
          [gudangId, qtyBahan, `Dipakai batch ${kodeBatch}`, result.insertId, stockBatchId, harvestId]
        );
        console.log(`✓ Stok batch ${stockBatchId} keluar ${qtyBahan} kg untuk ${kodeBatch}.`);
      }
    } catch (e) { console.warn('⚠ Pengurangan stok batch dilewati:', e.message); }

    const [newRow] = await pool.execute(
      `SELECT b.id, b.kode_batch, b.nama_produk, b.product_id, b.tanggal_produksi, b.tanggal_kadaluarsa,
              b.jumlah_hasil, b.satuan, b.bahan_digunakan, b.satuan_bahan, b.nomor_batch_bahan_baku, b.operator_produksi, b.status_qc, b.lokasi_gudang, b.lahan_id, b.planting_id, b.harvest_id, b.gudang_id, b.stock_batch_id, b.created_at,
              l.kode_lahan, l.nama_lahan, p.kode_tanam, p.tanggal_tanam, h.kode_panen, h.tanggal_panen, h.periode_hari,
              w.kode_gudang AS w_kode_gudang, w.nama_gudang AS w_nama_gudang,
              sb.kode_batch_stok AS sb_kode_batch_stok, sb.jenis AS sb_jenis,
              ab.kode_batch_stok AS sb_asal_kode_batch_stok
       FROM production_batches b
       LEFT JOIN lands l ON b.lahan_id=l.id
       LEFT JOIN plantings p ON b.planting_id=p.id
       LEFT JOIN harvests h ON b.harvest_id=h.id
       LEFT JOIN warehouses w ON b.gudang_id=w.id
       LEFT JOIN warehouse_stock_batches sb ON b.stock_batch_id=sb.id
       LEFT JOIN warehouse_stock_batches ab ON sb.asal_batch_id=ab.id
       WHERE b.id = ? LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Batch produksi berhasil ditambahkan.',
      data: mapRowToBatch(newRow[0]),
    });
  } catch (error) {
    console.error('[createBatch] Error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Kode batch sudah digunakan.' });
    }
    return res.status(500).json({ success: false, message: 'Gagal menambahkan batch produksi.' });
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateBatch(req, res) {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const pool = getPool();

    const [existing] = await pool.execute('SELECT id FROM production_batches WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Batch produksi tidak ditemukan.' });
    }

    // jika harvestId diganti, sinkronkan trace
    if (data.harvestId !== undefined) {
      if (data.harvestId) {
        const [hr] = await pool.execute('SELECT lahan_id, planting_id FROM harvests WHERE id=? LIMIT 1', [data.harvestId]);
        if (!hr.length) return res.status(400).json({ success: false, message: 'Data panen tidak ditemukan.' });
        data.lahanId = hr[0].lahan_id;
        data.plantingId = hr[0].planting_id;
      } else {
        data.lahanId = null; data.plantingId = null;
      }
    }

    const fieldMap = {
      kodeBatch: 'kode_batch',
      namaProduk: 'nama_produk',
      productId: 'product_id',
      tanggalProduksi: 'tanggal_produksi',
      tanggalKadaluarsa: 'tanggal_kadaluarsa',
      jumlahHasil: 'jumlah_hasil',
      satuan: 'satuan',
      bahanDigunakan: 'bahan_digunakan',
      satuanBahan: 'satuan_bahan',
      nomorBatchBahanBaku: 'nomor_batch_bahan_baku',
      operatorProduksi: 'operator_produksi',
      statusQC: 'status_qc',
      lokasiGudang: 'lokasi_gudang',
      gudangId: 'gudang_id',
      stockBatchId: 'stock_batch_id',
      lahanId: 'lahan_id',
      plantingId: 'planting_id',
      harvestId: 'harvest_id',
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
      await pool.execute(`UPDATE production_batches SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    }

    const [updatedRow] = await pool.execute(
      `SELECT b.id, b.kode_batch, b.nama_produk, b.product_id, b.tanggal_produksi, b.tanggal_kadaluarsa,
              b.jumlah_hasil, b.satuan, b.bahan_digunakan, b.satuan_bahan, b.nomor_batch_bahan_baku, b.operator_produksi, b.status_qc, b.lokasi_gudang, b.lahan_id, b.planting_id, b.harvest_id, b.gudang_id, b.stock_batch_id, b.created_at,
              l.kode_lahan, l.nama_lahan, p.kode_tanam, p.tanggal_tanam, h.kode_panen, h.tanggal_panen, h.periode_hari,
              w.kode_gudang AS w_kode_gudang, w.nama_gudang AS w_nama_gudang, sb.kode_batch_stok AS sb_kode_batch_stok
       FROM production_batches b
       LEFT JOIN lands l ON b.lahan_id=l.id
       LEFT JOIN plantings p ON b.planting_id=p.id
       LEFT JOIN harvests h ON b.harvest_id=h.id
       LEFT JOIN warehouses w ON b.gudang_id=w.id
       LEFT JOIN warehouse_stock_batches sb ON b.stock_batch_id=sb.id
       WHERE b.id = ? LIMIT 1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Batch produksi berhasil diperbarui.',
      data: mapRowToBatch(updatedRow[0]),
    });
  } catch (error) {
    console.error('[updateBatch] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui batch produksi.' });
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteBatch(req, res) {
  try {
    const pool = getPool();
    const [result] = await pool.execute('DELETE FROM production_batches WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Batch produksi tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, message: 'Batch produksi berhasil dihapus.' });
  } catch (error) {
    console.error('[deleteBatch] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menghapus batch produksi.' });
  }
}
