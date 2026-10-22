import { getPool } from '../config/db.js';
import { kemasanLinks } from '../utils/links.js';

// Kolom kemasan + produk olahan terhubung (dipakai semua query baca)
const SELECT_KEMASAN = `SELECT k.id, k.kode_kemasan, k.nama_kemasan, k.product_id, k.kategori, k.kapasitas, k.stok_tersedia, k.satuan,
         k.stok_minimal, k.pemasok, k.harga_per_unit_rp, k.status_stok, k.extra_data, k.created_at,
         p.name AS p_name, p.satuan_hasil AS p_satuan, p.foto_url AS p_foto
       FROM packaging_materials k
       LEFT JOIN products p ON p.id = k.product_id`;

/** Tambahkan link halaman publik & QR kemasan. */
const withLinks = (req, item) => ({ ...item, ...kemasanLinks(req, item.kodeKemasan) });

// ── Helper ────────────────────────────────────────────────────────────────────

function mapRowToPackaging(row) {
  return {
    id: String(row.id),
    kodeKemasan: row.kode_kemasan,
    namaKemasan: row.nama_kemasan,
    productId: row.product_id != null ? String(row.product_id) : null,
    product: row.product_id && row.p_name ? { id: String(row.product_id), name: row.p_name, satuanHasil: row.p_satuan, fotoUrl: row.p_foto || null } : null,
    kategori: row.kategori,
    kapasitas: row.kapasitas || '',
    stokTersedia: Number(row.stok_tersedia),
    satuan: row.satuan,
    stokMinimal: Number(row.stok_minimal),
    pemasok: row.pemasok || '',
    hargaPerUnitRp: Number(row.harga_per_unit_rp),
    statusStok: row.status_stok,
    extraData: row.extra_data ? JSON.parse(row.extra_data) : null,
    createdAt: row.created_at,
  };
}

function validatePackaging(data) {
  const kategoriValues = ['Standing Pouch', 'Box Custom', 'Karung Bulk', 'Botol Kaca', 'Aksesoris'];
  if (!data.namaKemasan || !String(data.namaKemasan).trim()) return 'Nama kemasan wajib diisi.';
  if (data.kategori && !kategoriValues.includes(data.kategori)) return 'Kategori tidak valid.';
  if (data.stokTersedia != null && Number(data.stokTersedia) < 0) return 'Stok tersedia tidak valid.';
  if (data.stokMinimal != null && Number(data.stokMinimal) < 0) return 'Stok minimal tidak valid.';
  return null;
}

/**
 * Normalisasi foto produk: mendukung array `imagesDataUrl` (1–4 foto).
 * Tetap kompatibel dengan data lama `imageDataUrl` (string tunggal) → dikonversi ke array.
 * Mengembalikan array data URL gambar yang valid, atau [] jika tidak ada.
 */
function normalizeImages(data) {
  const extra = data && typeof data === 'object' ? data.extraData : null;
  if (!extra) return [];

  let raw = extra.imagesDataUrl;
  // Backward compat: data lama pakai imageDataUrl string tunggal
  if (!Array.isArray(raw) && typeof extra.imageDataUrl === 'string') {
    raw = [extra.imageDataUrl];
  }
  if (!Array.isArray(raw)) return [];

  // Terima base64 (data:image/...) MAUPUN URL gambar (http/https/relatif /demo/..)
  const isValidImageRef = (u) =>
    typeof u === 'string' &&
    (u.startsWith('data:image/') || u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'));

  return raw.filter(isValidImageRef).slice(0, 4); // maksimal 4 foto
}

/** Pastikan produk olahan ada; kembalikan id (number) / null. Lempar pesan bila tidak valid. */
async function resolveProductId(pool, productId) {
  if (productId === undefined) return undefined;
  if (productId === null || productId === '') return null;
  const [p] = await pool.execute('SELECT id FROM products WHERE id = ? LIMIT 1', [productId]);
  if (!p.length) throw Object.assign(new Error('Produk olahan tidak ditemukan.'), { status: 400 });
  return Number(p[0].id);
}

/** Hitung status stok otomatis berdasarkan stok tersedia & minimal. */
function computeStatusStok(stokTersedia, stokMinimal) {
  if (Number(stokTersedia) <= 0) return 'Habis';
  if (Number(stokTersedia) <= Number(stokMinimal)) return 'Stok Menipis';
  return 'Stok Cukup';
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function getPackagingList(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = String(req.query.search || '').trim();
    const kategori = String(req.query.kategori || '').trim();
    const productId = String(req.query.productId || '').trim();
    const offset = (page - 1) * limit;

    const whereParts = [];
    const params = [];
    if (search) {
      whereParts.push(`(k.kode_kemasan LIKE ? OR k.nama_kemasan LIKE ? OR k.pemasok LIKE ? OR p.name LIKE ?)`);
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }
    if (kategori) {
      whereParts.push(`k.kategori = ?`);
      params.push(kategori);
    }
    if (productId) {
      whereParts.push(`k.product_id = ?`);
      params.push(productId);
    }
    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const pool = getPool();
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM packaging_materials k LEFT JOIN products p ON p.id = k.product_id ${whereClause}`,
      params
    );
    const total = Number(countRows[0].total);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const [rows] = await pool.query(
      `${SELECT_KEMASAN}
       ${whereClause}
       ORDER BY k.created_at DESC, k.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: rows.map((r) => withLinks(req, mapRowToPackaging(r))),
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (error) {
    console.error('[getPackagingList] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data kemasan.' });
  }
}

// ── Detail ────────────────────────────────────────────────────────────────────

export async function getPackagingById(req, res) {
  try {
    const [rows] = await getPool().execute(
      `${SELECT_KEMASAN} WHERE k.id = ? LIMIT 1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data kemasan tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, data: withLinks(req, mapRowToPackaging(rows[0])) });
  } catch (error) {
    console.error('[getPackagingById] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail kemasan.' });
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createPackaging(req, res) {
  try {
    const data = req.body || {};
    const validationError = validatePackaging(data);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const pool = getPool();

    let kodeKemasan = String(data.kodeKemasan || '').trim();
    if (!kodeKemasan) {
      // Lanjutkan urutan MAX kode KMG-xxx + 1 (konsisten dengan FE nextCode)
      const [rows] = await pool.execute(
        `SELECT kode_kemasan FROM packaging_materials WHERE kode_kemasan LIKE 'KMG-%'`
      );
      let maxSeq = 0;
      for (const r of rows) {
        const m = String(r.kode_kemasan).match(/KMG-(\d+)/);
        if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
      }
      kodeKemasan = `KMG-${String(maxSeq + 1).padStart(3, '0')}`;
    }

    // Foto produk WAJIB saat menambah data kemasan baru (minimal 1, maksimal 4)
    const images = normalizeImages(data);
    if (images.length === 0) {
      return res.status(400).json({ success: false, message: 'Foto produk wajib diisi saat menambah data kemasan (minimal 1 foto).' });
    }

    // Siapkan extra_data: pastikan imagesDataUrl tersimpan sebagai array
    const extraData = {
      ...(data.extraData || {}),
      imageDataUrl: undefined,
      imagesDataUrl: images,
    };
    delete extraData.imageDataUrl;

    const stokTersedia = Number(data.stokTersedia) || 0;
    const stokMinimal = Number(data.stokMinimal) || 0;
    const statusStok = computeStatusStok(stokTersedia, stokMinimal);
    const productId = (await resolveProductId(pool, data.productId)) ?? null;

    const [result] = await pool.execute(
      `INSERT INTO packaging_materials
        (kode_kemasan, nama_kemasan, product_id, kategori, kapasitas, stok_tersedia, satuan,
         stok_minimal, pemasok, harga_per_unit_rp, status_stok, extra_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kodeKemasan,
        String(data.namaKemasan).trim(),
        productId,
        data.kategori || 'Standing Pouch',
        data.kapasitas || '',
        stokTersedia,
        data.satuan || 'Pcs',
        stokMinimal,
        data.pemasok || '',
        Number(data.hargaPerUnitRp) || 0,
        statusStok,
        data.extraData ? JSON.stringify(extraData) : null,
      ]
    );

    const [newRow] = await pool.execute(
      `${SELECT_KEMASAN} WHERE k.id = ? LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Data kemasan berhasil ditambahkan.',
      data: withLinks(req, mapRowToPackaging(newRow[0])),
    });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ success: false, message: error.message });
    console.error('[createPackaging] Error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Kode kemasan sudah digunakan.' });
    }
    return res.status(500).json({ success: false, message: 'Gagal menambahkan data kemasan.' });
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updatePackaging(req, res) {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const pool = getPool();

    const [existing] = await pool.execute('SELECT id, nama_kemasan, stok_tersedia, stok_minimal FROM packaging_materials WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Data kemasan tidak ditemukan.' });
    }
    const validationError = validatePackaging({ ...data, namaKemasan: data.namaKemasan ?? existing[0].nama_kemasan });
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const productId = await resolveProductId(pool, data.productId);
    if (productId !== undefined) data.productId = productId;

    const fieldMap = {
      kodeKemasan: 'kode_kemasan',
      namaKemasan: 'nama_kemasan',
      productId: 'product_id',
      kategori: 'kategori',
      kapasitas: 'kapasitas',
      stokTersedia: 'stok_tersedia',
      satuan: 'satuan',
      stokMinimal: 'stok_minimal',
      pemasok: 'pemasok',
      hargaPerUnitRp: 'harga_per_unit_rp',
      extraData: 'extra_data',
    };

    const sets = [];
    const values = [];
    for (const [key, column] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        let value = data[key];
        if (key === 'extraData') {
          // Update: normalisasi foto juga (jika user mengirim imagesDataUrl)
          const images = normalizeImages(data);
          const merged = { ...data.extraData, imagesDataUrl: images };
          delete merged.imageDataUrl;
          value = JSON.stringify(merged);
        }
        sets.push(`${column} = ?`);
        values.push(value);
      }
    }

    // Re-hitung status_stok jika stok berubah
    let statusStok;
    if (data.stokTersedia !== undefined || data.stokMinimal !== undefined) {
      const newStok = data.stokTersedia !== undefined ? Number(data.stokTersedia) : Number(existing[0].stok_tersedia);
      const newMin = data.stokMinimal !== undefined ? Number(data.stokMinimal) : Number(existing[0].stok_minimal);
      statusStok = computeStatusStok(newStok, newMin);
      sets.push('status_stok = ?');
      values.push(statusStok);
    }

    if (sets.length > 0) {
      await pool.execute(`UPDATE packaging_materials SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    }

    const [updatedRow] = await pool.execute(
      `${SELECT_KEMASAN} WHERE k.id = ? LIMIT 1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Data kemasan berhasil diperbarui.',
      data: withLinks(req, mapRowToPackaging(updatedRow[0])),
    });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ success: false, message: error.message });
    console.error('[updatePackaging] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data kemasan.' });
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deletePackaging(req, res) {
  try {
    const pool = getPool();
    const [result] = await pool.execute('DELETE FROM packaging_materials WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data kemasan tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, message: 'Data kemasan berhasil dihapus.' });
  } catch (error) {
    console.error('[deletePackaging] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menghapus data kemasan.' });
  }
}
