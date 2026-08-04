import { getPool } from '../config/db.js';

// ── Helper ────────────────────────────────────────────────────────────────────

function mapRowToExpense(row) {
  let detailItem = [];
  if (row.detail_item) {
    try {
      detailItem = typeof row.detail_item === 'string' ? JSON.parse(row.detail_item) : row.detail_item;
    } catch {
      detailItem = [];
    }
  }
  return {
    id: String(row.id),
    kodeTransaksi: row.kode_transaksi,
    tanggal: row.tanggal || '',
    kategori: row.kategori,
    keteranganVendor: row.keterangan_vendor || '',
    totalBiayaRp: Number(row.total_biaya_rp),
    statusPembayaran: row.status_pembayaran,
    metodePembayaran: row.metode_pembayaran,
    nomorNotaReceipt: row.nomor_nota_receipt || '',
    detailItem,
    catatanNota: row.catatan_nota || '',
    notaUrl: row.nota_url || '',
    createdAt: row.created_at,
  };
}

function validateExpense(data) {
  const kategoriValues = ['Bahan Baku', 'Transportasi', 'Operasional', 'Kemasan', 'Perawatan Peralatan', 'Sertifikasi'];
  const statusValues = ['LUNAS', 'PENDING', 'DIBATALKAN'];
  const metodeValues = ['Transfer Bank', 'Kas Tunai', 'E-Wallet', 'Giro'];
  if (!data.keteranganVendor || !String(data.keteranganVendor).trim()) return 'Keterangan vendor wajib diisi.';
  if (data.kategori && !kategoriValues.includes(data.kategori)) return 'Kategori tidak valid.';
  if (data.statusPembayaran && !statusValues.includes(data.statusPembayaran)) return 'Status pembayaran tidak valid.';
  if (data.metodePembayaran && !metodeValues.includes(data.metodePembayaran)) return 'Metode pembayaran tidak valid.';
  if (data.totalBiayaRp != null && Number(data.totalBiayaRp) < 0) return 'Total biaya tidak valid.';
  return null;
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function getExpenses(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = String(req.query.search || '').trim();
    const kategori = String(req.query.kategori || '').trim();
    const offset = (page - 1) * limit;

    const whereParts = [];
    const params = [];
    if (search) {
      whereParts.push(`(kode_transaksi LIKE ? OR keterangan_vendor LIKE ? OR nomor_nota_receipt LIKE ?)`);
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }
    if (kategori) {
      whereParts.push(`kategori = ?`);
      params.push(kategori);
    }
    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const pool = getPool();
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM logistics_expenses ${whereClause}`,
      params
    );
    const total = Number(countRows[0].total);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const [rows] = await pool.query(
      `SELECT id, kode_transaksi, tanggal, kategori, keterangan_vendor, total_biaya_rp,
              status_pembayaran, metode_pembayaran, nomor_nota_receipt, catatan_nota,
              detail_item, nota_url, created_at
       FROM logistics_expenses
       ${whereClause}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: rows.map(mapRowToExpense),
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (error) {
    console.error('[getExpenses] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data logistik.' });
  }
}

// ── Detail ────────────────────────────────────────────────────────────────────

export async function getExpenseById(req, res) {
  try {
    const [rows] = await getPool().execute(
      `SELECT id, kode_transaksi, tanggal, kategori, keterangan_vendor, total_biaya_rp,
              status_pembayaran, metode_pembayaran, nomor_nota_receipt, catatan_nota,
              detail_item, nota_url, created_at
       FROM logistics_expenses WHERE id = ? LIMIT 1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data transaksi tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, data: mapRowToExpense(rows[0]) });
  } catch (error) {
    console.error('[getExpenseById] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail transaksi.' });
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createExpense(req, res) {
  try {
    const data = req.body || {};
    const validationError = validateExpense(data);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const pool = getPool();

    let kodeTransaksi = String(data.kodeTransaksi || '').trim();
    if (!kodeTransaksi) {
      // Auto-increment dari MAX(id) — aman walau ada data dihapus
      const [maxRow] = await pool.execute('SELECT MAX(id) AS maxId FROM logistics_expenses');
      const seq = Number(maxRow[0].maxId || 0) + 1;
      kodeTransaksi = `LOG-TRX-${String(seq).padStart(3, '0')}`;

      // Jika kode sudah terpakai (mis. seed manual), naikkan sampai unik
      let exists = true;
      while (exists) {
        const [chk] = await pool.execute('SELECT id FROM logistics_expenses WHERE kode_transaksi = ? LIMIT 1', [kodeTransaksi]);
        if (chk.length === 0) {
          exists = false;
        } else {
          const nextSeq = Number(kodeTransaksi.replace('LOG-TRX-', '')) + 1;
          kodeTransaksi = `LOG-TRX-${String(nextSeq).padStart(3, '0')}`;
        }
      }
    }

    const detailItem = Array.isArray(data.detailItem) ? JSON.stringify(data.detailItem) : null;

    const [result] = await pool.execute(
      `INSERT INTO logistics_expenses
        (kode_transaksi, tanggal, kategori, keterangan_vendor, total_biaya_rp,
         status_pembayaran, metode_pembayaran, nomor_nota_receipt, catatan_nota,
         detail_item, nota_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kodeTransaksi,
        data.tanggal || '',
        data.kategori || 'Operasional',
        String(data.keteranganVendor).trim(),
        Number(data.totalBiayaRp) || 0,
        data.statusPembayaran || 'LUNAS',
        data.metodePembayaran || 'Kas Tunai',
        data.nomorNotaReceipt || '',
        data.catatanNota || '',
        detailItem,
        data.notaUrl || null,
      ]
    );

    const [newRow] = await pool.execute(
      `SELECT id, kode_transaksi, tanggal, kategori, keterangan_vendor, total_biaya_rp,
              status_pembayaran, metode_pembayaran, nomor_nota_receipt, catatan_nota,
              detail_item, nota_url, created_at
       FROM logistics_expenses WHERE id = ? LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Transaksi logistik berhasil ditambahkan.',
      data: mapRowToExpense(newRow[0]),
    });
  } catch (error) {
    console.error('[createExpense] Error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Kode transaksi sudah digunakan.' });
    }
    return res.status(500).json({ success: false, message: 'Gagal menambahkan transaksi logistik.' });
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateExpense(req, res) {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const pool = getPool();

    const [existing] = await pool.execute('SELECT id FROM logistics_expenses WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Data transaksi tidak ditemukan.' });
    }

    const fieldMap = {
      kodeTransaksi: 'kode_transaksi',
      tanggal: 'tanggal',
      kategori: 'kategori',
      keteranganVendor: 'keterangan_vendor',
      totalBiayaRp: 'total_biaya_rp',
      statusPembayaran: 'status_pembayaran',
      metodePembayaran: 'metode_pembayaran',
      nomorNotaReceipt: 'nomor_nota_receipt',
      catatanNota: 'catatan_nota',
      notaUrl: 'nota_url',
    };

    const sets = [];
    const values = [];
    for (const [key, column] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        sets.push(`${column} = ?`);
        values.push(data[key] === '' && key === 'notaUrl' ? null : data[key]);
      }
    }

    if (data.detailItem !== undefined) {
      sets.push('detail_item = ?');
      values.push(Array.isArray(data.detailItem) ? JSON.stringify(data.detailItem) : null);
    }

    if (sets.length > 0) {
      await pool.execute(`UPDATE logistics_expenses SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    }

    const [updatedRow] = await pool.execute(
      `SELECT id, kode_transaksi, tanggal, kategori, keterangan_vendor, total_biaya_rp,
              status_pembayaran, metode_pembayaran, nomor_nota_receipt, catatan_nota,
              detail_item, nota_url, created_at
       FROM logistics_expenses WHERE id = ? LIMIT 1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Transaksi logistik berhasil diperbarui.',
      data: mapRowToExpense(updatedRow[0]),
    });
  } catch (error) {
    console.error('[updateExpense] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui transaksi logistik.' });
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteExpense(req, res) {
  try {
    const pool = getPool();
    const [result] = await pool.execute('DELETE FROM logistics_expenses WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data transaksi tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, message: 'Transaksi logistik berhasil dihapus.' });
  } catch (error) {
    console.error('[deleteExpense] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menghapus transaksi logistik.' });
  }
}
