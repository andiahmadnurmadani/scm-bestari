import { getPool } from '../config/db.js';

// ── Helper ────────────────────────────────────────────────────────────────────

function mapRowToBatch(row) {
  return {
    id: String(row.id),
    kodeBatch: row.kode_batch,
    namaProduk: row.nama_produk,
    kategori: row.kategori,
    tanggalProduksi: row.tanggal_produksi || '',
    tanggalKadaluarsa: row.tanggal_kadaluarsa || '',
    jumlahHasil: Number(row.jumlah_hasil),
    satuan: row.satuan,
    nomorBatchBahanBaku: row.nomor_batch_bahan_baku || '',
    operatorProduksi: row.operator_produksi || '',
    statusQC: row.status_qc,
    lokasiGudang: row.lokasi_gudang || '',
    createdAt: row.created_at,
  };
}

function validateBatch(data) {
  const kategoriValues = ['Raw (Bahan Mentah)', 'Ready to Eat (Siap Konsumsi)'];
  const qcValues = ['Lolos QC', 'Pending QC', 'Revisi Batch'];
  if (!data.namaProduk || !String(data.namaProduk).trim()) return 'Nama produk wajib diisi.';
  if (data.kategori && !kategoriValues.includes(data.kategori)) return 'Kategori tidak valid.';
  if (data.statusQC && !qcValues.includes(data.statusQC)) return 'Status QC tidak valid.';
  if (data.jumlahHasil != null && Number(data.jumlahHasil) < 0) return 'Jumlah hasil tidak valid.';
  return null;
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function getBatches(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = String(req.query.search || '').trim();
    const kategori = String(req.query.kategori || '').trim();
    const offset = (page - 1) * limit;

    const whereParts = [];
    const params = [];

    if (search) {
      whereParts.push(`(kode_batch LIKE ? OR nama_produk LIKE ? OR operator_produksi LIKE ? OR lokasi_gudang LIKE ?)`);
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }
    if (kategori) {
      whereParts.push(`kategori = ?`);
      params.push(kategori);
    }
    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const pool = getPool();
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM production_batches ${whereClause}`,
      params
    );
    const total = Number(countRows[0].total);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const [rows] = await pool.query(
      `SELECT id, kode_batch, nama_produk, kategori, tanggal_produksi, tanggal_kadaluarsa,
              jumlah_hasil, satuan, nomor_batch_bahan_baku, operator_produksi, status_qc, lokasi_gudang, created_at
       FROM production_batches
       ${whereClause}
       ORDER BY created_at DESC, id DESC
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
      `SELECT id, kode_batch, nama_produk, kategori, tanggal_produksi, tanggal_kadaluarsa,
              jumlah_hasil, satuan, nomor_batch_bahan_baku, operator_produksi, status_qc, lokasi_gudang, created_at
       FROM production_batches WHERE id = ? LIMIT 1`,
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

    let kodeBatch = String(data.kodeBatch || '').trim();
    if (!kodeBatch) {
      const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM production_batches');
      const seq = Number(countRows[0].total) + 1;
      kodeBatch = `PRD-2026-${String(seq).padStart(3, '0')}`;
    }

    const [result] = await pool.execute(
      `INSERT INTO production_batches
        (kode_batch, nama_produk, kategori, tanggal_produksi, tanggal_kadaluarsa,
         jumlah_hasil, satuan, nomor_batch_bahan_baku, operator_produksi, status_qc, lokasi_gudang)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kodeBatch,
        String(data.namaProduk).trim(),
        data.kategori || 'Ready to Eat (Siap Konsumsi)',
        data.tanggalProduksi || '',
        data.tanggalKadaluarsa || '',
        Number(data.jumlahHasil) || 0,
        String(data.satuan || 'Pcs'),
        data.nomorBatchBahanBaku || '',
        data.operatorProduksi || '',
        data.statusQC || 'Pending QC',
        data.lokasiGudang || '',
      ]
    );

    const [newRow] = await pool.execute(
      `SELECT id, kode_batch, nama_produk, kategori, tanggal_produksi, tanggal_kadaluarsa,
              jumlah_hasil, satuan, nomor_batch_bahan_baku, operator_produksi, status_qc, lokasi_gudang, created_at
       FROM production_batches WHERE id = ? LIMIT 1`,
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

    const fieldMap = {
      kodeBatch: 'kode_batch',
      namaProduk: 'nama_produk',
      kategori: 'kategori',
      tanggalProduksi: 'tanggal_produksi',
      tanggalKadaluarsa: 'tanggal_kadaluarsa',
      jumlahHasil: 'jumlah_hasil',
      satuan: 'satuan',
      nomorBatchBahanBaku: 'nomor_batch_bahan_baku',
      operatorProduksi: 'operator_produksi',
      statusQC: 'status_qc',
      lokasiGudang: 'lokasi_gudang',
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
      `SELECT id, kode_batch, nama_produk, kategori, tanggal_produksi, tanggal_kadaluarsa,
              jumlah_hasil, satuan, nomor_batch_bahan_baku, operator_produksi, status_qc, lokasi_gudang, created_at
       FROM production_batches WHERE id = ? LIMIT 1`,
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
