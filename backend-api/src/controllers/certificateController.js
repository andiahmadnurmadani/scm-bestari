import { getPool } from '../config/db.js';

// ── Helper ────────────────────────────────────────────────────────────────────

function mapRowToCertificate(row) {
  return {
    id: String(row.id),
    kodeDokumen: row.kode_dokumen,
    namaSertifikat: row.nama_sertifikat,
    penerbitSertifikat: row.penerbit_sertifikat,
    nomorSertifikat: row.nomor_sertifikat || '',
    tanggalTerbit: row.tanggal_terbit || '',
    tanggalKadaluarsa: row.tanggal_kadaluarsa || '',
    status: row.status,
    jenisDokumen: row.jenis_dokumen,
    fileUrl: row.file_url || '',
    fileName: row.file_name || '',
    fileType: row.file_type || '',
    keterangan: row.keterangan || '',
    createdAt: row.created_at,
  };
}

function validateCertificate(data) {
  const statusValues = ['AKTIF', 'PROSES', 'KADALUARSA'];
  const jenisValues = ['Sertifikat Halal', 'Izin P-IRT', 'Uji Lab Nutrisi', 'Sertifikat Organik', 'Lainnya'];
  if (!data.namaSertifikat || !String(data.namaSertifikat).trim()) return 'Nama sertifikat wajib diisi.';
  if (!data.penerbitSertifikat || !String(data.penerbitSertifikat).trim()) return 'Penerbit sertifikat wajib diisi.';
  if (data.status && !statusValues.includes(data.status)) return 'Status tidak valid.';
  if (data.jenisDokumen && !jenisValues.includes(data.jenisDokumen)) return 'Jenis dokumen tidak valid.';
  return null;
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function getCertificates(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = String(req.query.search || '').trim();
    const offset = (page - 1) * limit;

    const whereClause = search
      ? `WHERE kode_dokumen LIKE ? OR nama_sertifikat LIKE ? OR penerbit_sertifikat LIKE ?`
      : '';
    const pattern = `%${search}%`;
    const params = search ? [pattern, pattern, pattern] : [];

    const pool = getPool();
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM certificates ${whereClause}`,
      params
    );
    const total = Number(countRows[0].total);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const [rows] = await pool.query(
      `SELECT id, kode_dokumen, nama_sertifikat, penerbit_sertifikat, nomor_sertifikat,
              tanggal_terbit, tanggal_kadaluarsa, status, jenis_dokumen,
              file_url, file_name, file_type, keterangan, created_at
       FROM certificates
       ${whereClause}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: rows.map(mapRowToCertificate),
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (error) {
    console.error('[getCertificates] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data sertifikat.' });
  }
}

// ── Detail ────────────────────────────────────────────────────────────────────

export async function getCertificateById(req, res) {
  try {
    const [rows] = await getPool().execute(
      `SELECT id, kode_dokumen, nama_sertifikat, penerbit_sertifikat, nomor_sertifikat,
              tanggal_terbit, tanggal_kadaluarsa, status, jenis_dokumen,
              file_url, file_name, file_type, keterangan, created_at
       FROM certificates WHERE id = ? LIMIT 1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dokumen sertifikat tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, data: mapRowToCertificate(rows[0]) });
  } catch (error) {
    console.error('[getCertificateById] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail sertifikat.' });
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createCertificate(req, res) {
  try {
    const data = req.body || {};
    const validationError = validateCertificate(data);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const pool = getPool();

    let kodeDokumen = String(data.kodeDokumen || '').trim();
    if (!kodeDokumen) {
      const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM certificates');
      const seq = Number(countRows[0].total) + 1;
      kodeDokumen = `CERT-DOC-${String(seq).padStart(3, '0')}`;
    }

    const [result] = await pool.execute(
      `INSERT INTO certificates
        (kode_dokumen, nama_sertifikat, penerbit_sertifikat, nomor_sertifikat,
         tanggal_terbit, tanggal_kadaluarsa, status, jenis_dokumen,
         file_url, file_name, file_type, keterangan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kodeDokumen,
        String(data.namaSertifikat).trim(),
        String(data.penerbitSertifikat).trim(),
        data.nomorSertifikat || '',
        data.tanggalTerbit || '',
        data.tanggalKadaluarsa || '',
        data.status || 'PROSES',
        data.jenisDokumen || 'Lainnya',
        data.fileUrl || null,
        data.fileName || '',
        data.fileType || null,
        data.keterangan || '',
      ]
    );

    const [newRow] = await pool.execute(
      `SELECT id, kode_dokumen, nama_sertifikat, penerbit_sertifikat, nomor_sertifikat,
              tanggal_terbit, tanggal_kadaluarsa, status, jenis_dokumen,
              file_url, file_name, file_type, keterangan, created_at
       FROM certificates WHERE id = ? LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Dokumen sertifikat berhasil ditambahkan.',
      data: mapRowToCertificate(newRow[0]),
    });
  } catch (error) {
    console.error('[createCertificate] Error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Kode dokumen sudah digunakan.' });
    }
    return res.status(500).json({ success: false, message: 'Gagal menambahkan dokumen sertifikat.' });
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateCertificate(req, res) {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const pool = getPool();

    const [existing] = await pool.execute('SELECT id FROM certificates WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Dokumen sertifikat tidak ditemukan.' });
    }

    const fieldMap = {
      kodeDokumen: 'kode_dokumen',
      namaSertifikat: 'nama_sertifikat',
      penerbitSertifikat: 'penerbit_sertifikat',
      nomorSertifikat: 'nomor_sertifikat',
      tanggalTerbit: 'tanggal_terbit',
      tanggalKadaluarsa: 'tanggal_kadaluarsa',
      status: 'status',
      jenisDokumen: 'jenis_dokumen',
      fileUrl: 'file_url',
      fileName: 'file_name',
      fileType: 'file_type',
      keterangan: 'keterangan',
    };

    const sets = [];
    const values = [];
    for (const [key, column] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        sets.push(`${column} = ?`);
        values.push(data[key] === '' && ['fileUrl', 'fileType'].includes(key) ? null : data[key]);
      }
    }
    if (sets.length > 0) {
      await pool.execute(`UPDATE certificates SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    }

    const [updatedRow] = await pool.execute(
      `SELECT id, kode_dokumen, nama_sertifikat, penerbit_sertifikat, nomor_sertifikat,
              tanggal_terbit, tanggal_kadaluarsa, status, jenis_dokumen,
              file_url, file_name, file_type, keterangan, created_at
       FROM certificates WHERE id = ? LIMIT 1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Dokumen sertifikat berhasil diperbarui.',
      data: mapRowToCertificate(updatedRow[0]),
    });
  } catch (error) {
    console.error('[updateCertificate] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui dokumen sertifikat.' });
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteCertificate(req, res) {
  try {
    const pool = getPool();
    const [result] = await pool.execute('DELETE FROM certificates WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Dokumen sertifikat tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, message: 'Dokumen sertifikat berhasil dihapus.' });
  } catch (error) {
    console.error('[deleteCertificate] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menghapus dokumen sertifikat.' });
  }
}
