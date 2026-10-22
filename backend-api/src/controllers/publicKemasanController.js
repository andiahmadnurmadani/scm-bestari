import QRCode from 'qrcode';
import { getPool } from '../config/db.js';
import { toISODate } from '../utils/kodeUtil.js';
import { traceLinks, kemasanLinks, produkLinks } from '../utils/links.js';

// ── Controller publik: halaman kemasan produk & gambar QR ─────────────────────
// TANPA auth. Data yang dibuka hanya info konsumen (produk, komposisi, gizi,
// asal batch) — harga, pemasok, dan stok kemasan TIDAK ditampilkan.

const parseJson = (v) => {
  if (!v) return null;
  try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return null; }
};

/**
 * GET /api/public/kemasan/:kodeKemasan
 * Info produk dari kemasan + batch olahan terbaru produk tersebut (bisa dilacak).
 */
export async function getPublicKemasan(req, res) {
  try {
    const kode = String(req.params.kodeKemasan || '').trim();
    if (!kode) return res.status(400).json({ success: false, message: 'Kode kemasan tidak valid.' });

    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT k.kode_kemasan, k.nama_kemasan, k.kategori, k.kapasitas, k.extra_data, k.product_id,
              p.name AS p_name, p.deskripsi AS p_deskripsi, p.foto_url AS p_foto, p.satuan_hasil AS p_satuan
       FROM packaging_materials k
       LEFT JOIN products p ON p.id = k.product_id
       WHERE k.kode_kemasan = ? LIMIT 1`,
      [kode]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Kemasan tidak ditemukan. Kode salah atau sudah dihapus.' });
    }
    const r = rows[0];
    const extra = parseJson(r.extra_data) || {};
    const fotos = Array.isArray(extra.imagesDataUrl) ? extra.imagesDataUrl : (extra.imageDataUrl ? [extra.imageDataUrl] : []);

    // Batch olahan terbaru dari produk yang sama (asal-usul bisa dilacak lewat QR batch)
    let batches = [];
    if (r.product_id) {
      const [b] = await pool.execute(
        `SELECT b.kode_batch, b.tanggal_produksi, b.tanggal_kadaluarsa, b.jumlah_hasil, b.satuan, b.operator_produksi,
                l.nama_lahan, l.lokasi_desa, l.kecamatan, l.pemilik_kelompok_tani,
                DATE_FORMAT(h.tanggal_panen, '%Y-%m-%d') AS tanggal_panen, h.varietas, h.petani_penanggung_jawab, h.periode_hari,
                DATE_FORMAT(pl.tanggal_tanam, '%Y-%m-%d') AS tanggal_tanam,
                sb.kode_batch_stok
         FROM production_batches b
         LEFT JOIN lands l ON l.id = b.lahan_id
         LEFT JOIN harvests h ON h.id = b.harvest_id
         LEFT JOIN plantings pl ON pl.id = h.planting_id
         LEFT JOIN warehouse_stock_batches sb ON sb.id = b.stock_batch_id
         WHERE b.product_id = ?
         ORDER BY b.tanggal_produksi DESC, b.id DESC
         LIMIT 10`,
        [r.product_id]
      );
      batches = b.map((x) => ({
        kodeBatch: x.kode_batch,
        tanggalProduksi: toISODate(x.tanggal_produksi),
        tanggalKadaluarsa: toISODate(x.tanggal_kadaluarsa),
        jumlahHasil: Number(x.jumlah_hasil || 0),
        satuan: x.satuan,
        namaLahan: x.nama_lahan || null,
        lokasiDesa: x.lokasi_desa || null,
        kecamatan: x.kecamatan || null,
        kelompokTani: x.pemilik_kelompok_tani || null,
        varietas: x.varietas || null,
        tanggalTanam: x.tanggal_tanam || null,
        tanggalPanen: x.tanggal_panen || null,
        umurTanamHari: x.periode_hari != null ? Number(x.periode_hari) : null,
        petani: x.petani_penanggung_jawab || null,
        pengolah: x.operator_produksi || null,
        kodeBatchStok: x.kode_batch_stok || null,
        ...traceLinks(req, x.kode_batch_stok),
      }));
    }

    return res.status(200).json({
      success: true,
      data: {
        kemasan: {
          kodeKemasan: r.kode_kemasan,
          namaKemasan: r.nama_kemasan,
          kategori: r.kategori,
          kapasitas: r.kapasitas || '',
          fotos,
          komposisi: extra.komposisi || '',
          nilaiGizi: extra.nilaiGizi || {},
          akg: Array.isArray(extra.akg) ? extra.akg : [],
          ...kemasanLinks(req, r.kode_kemasan),
        },
        produk: r.product_id && r.p_name
          ? { name: r.p_name, deskripsi: r.p_deskripsi || '', fotoUrl: r.p_foto || null, satuanHasil: r.p_satuan }
          : null,
        batches,
      },
    });
  } catch (error) {
    console.error('[getPublicKemasan] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data kemasan.' });
  }
}

/** Kirim gambar QR (PNG default, atau SVG) untuk sebuah URL. */
async function sendQr(req, res, url, namaFile) {
  const format = String(req.query.format || 'png').toLowerCase() === 'svg' ? 'svg' : 'png';
  const size = Math.min(1024, Math.max(128, parseInt(req.query.size, 10) || 512));
  const opts = { errorCorrectionLevel: 'M', margin: 2, width: size, color: { dark: '#172C05', light: '#FFFFFF' } };
  res.set('Cache-Control', 'public, max-age=86400');
  res.set('Content-Disposition', `inline; filename="${namaFile}.${format}"`);
  if (format === 'svg') {
    res.type('image/svg+xml').send(await QRCode.toString(url, { ...opts, type: 'svg' }));
  } else {
    res.type('image/png').send(await QRCode.toBuffer(url, { ...opts, type: 'png' }));
  }
}

/** GET /api/public/qr/trace/:kodeBatchStok — QR menuju halaman lacak batch. */
export async function getQrTrace(req, res) {
  try {
    const kode = String(req.params.kodeBatchStok || '').trim();
    const [rows] = await getPool().execute('SELECT id FROM warehouse_stock_batches WHERE kode_batch_stok = ? LIMIT 1', [kode]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Batch stok tidak ditemukan.' });
    return await sendQr(req, res, traceLinks(req, kode).traceUrl, `QR-${kode}`);
  } catch (error) {
    console.error('[getQrTrace] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal membuat QR.' });
  }
}

/** GET /api/public/qr/kemasan/:kodeKemasan — QR menuju halaman produk dari kemasan. */
export async function getQrKemasan(req, res) {
  try {
    const kode = String(req.params.kodeKemasan || '').trim();
    const [rows] = await getPool().execute('SELECT id FROM packaging_materials WHERE kode_kemasan = ? LIMIT 1', [kode]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Kemasan tidak ditemukan.' });
    return await sendQr(req, res, kemasanLinks(req, kode).publicUrl, `QR-${kode}`);
  } catch (error) {
    console.error('[getQrKemasan] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal membuat QR.' });
  }
}

/**
 * GET /api/public/produk/:kodeBatch
 * Cerita SATU batch olahan (1 olahan = 1 QR): produk, kemasan yang dipakai, dan
 * perjalanan persis batch ini dari lahan. Tanpa harga/pemasok/stok.
 */
export async function getPublicProduk(req, res) {
  try {
    const kode = String(req.params.kodeBatch || '').trim();
    if (!kode) return res.status(400).json({ success: false, message: 'Kode produk tidak valid.' });
    const [rows] = await getPool().execute(
      `SELECT b.kode_batch, b.nama_produk, b.tanggal_produksi, b.tanggal_kadaluarsa, b.jumlah_hasil, b.satuan, b.operator_produksi,
              pr.name AS p_name, pr.deskripsi AS p_deskripsi, pr.foto_url AS p_foto,
              COALESCE(pk.extra_data, (SELECT k2.extra_data FROM packaging_materials k2 WHERE k2.product_id = b.product_id ORDER BY k2.id LIMIT 1)) AS k_extra,
              COALESCE(pk.kapasitas, (SELECT k2.kapasitas FROM packaging_materials k2 WHERE k2.product_id = b.product_id ORDER BY k2.id LIMIT 1)) AS k_kapasitas,
              pk.nama_kemasan AS k_nama,
              l.lokasi_desa, l.kecamatan, l.pemilik_kelompok_tani,
              DATE_FORMAT(h.tanggal_panen, '%Y-%m-%d') AS tanggal_panen, h.varietas, h.petani_penanggung_jawab, h.periode_hari,
              DATE_FORMAT(pl.tanggal_tanam, '%Y-%m-%d') AS tanggal_tanam,
              sb.kode_batch_stok
       FROM production_batches b
       LEFT JOIN products pr ON pr.id = b.product_id
       LEFT JOIN packaging_materials pk ON pk.id = b.packaging_id
       LEFT JOIN lands l ON l.id = b.lahan_id
       LEFT JOIN harvests h ON h.id = b.harvest_id
       LEFT JOIN plantings pl ON pl.id = h.planting_id
       LEFT JOIN warehouse_stock_batches sb ON sb.id = b.stock_batch_id
       WHERE b.kode_batch = ? LIMIT 1`,
      [kode]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan. Kode salah atau sudah dihapus.' });
    const r = rows[0];
    const extra = parseJson(r.k_extra) || {};
    const fotos = Array.isArray(extra.imagesDataUrl) && extra.imagesDataUrl.length ? extra.imagesDataUrl : (r.p_foto ? [r.p_foto] : []);
    return res.status(200).json({
      success: true,
      data: {
        namaProduk: r.p_name || r.nama_produk,
        deskripsi: r.p_deskripsi || '',
        namaKemasan: r.k_nama || null,
        kapasitas: r.k_kapasitas || '',
        fotos,
        komposisi: extra.komposisi || '',
        nilaiGizi: extra.nilaiGizi || {},
        tanggalProduksi: toISODate(r.tanggal_produksi),
        tanggalKadaluarsa: toISODate(r.tanggal_kadaluarsa),
        jumlahHasil: Number(r.jumlah_hasil || 0),
        satuan: r.satuan,
        pengolah: r.operator_produksi || null,
        lokasiDesa: r.lokasi_desa || null,
        kecamatan: r.kecamatan || null,
        kelompokTani: r.pemilik_kelompok_tani || null,
        varietas: r.varietas || null,
        tanggalTanam: r.tanggal_tanam || null,
        tanggalPanen: r.tanggal_panen || null,
        umurTanamHari: r.periode_hari != null ? Number(r.periode_hari) : null,
        petani: r.petani_penanggung_jawab || null,
        ...produkLinks(req, r.kode_batch),
        traceUrl: traceLinks(req, r.kode_batch_stok).traceUrl,
      },
    });
  } catch (error) {
    console.error('[getPublicProduk] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data produk.' });
  }
}

/** GET /api/public/qr/produk/:kodeBatch — QR satu batch olahan (menuju /produk/{kode}). */
export async function getQrProduk(req, res) {
  try {
    const kode = String(req.params.kodeBatch || '').trim();
    const [rows] = await getPool().execute('SELECT id FROM production_batches WHERE kode_batch = ? LIMIT 1', [kode]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    return await sendQr(req, res, produkLinks(req, kode).publicUrl, `QR-${kode}`);
  } catch (error) {
    console.error('[getQrProduk] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal membuat QR.' });
  }
}
