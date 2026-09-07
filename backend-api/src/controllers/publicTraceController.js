import { getPool } from '../config/db.js';
import { toISODate } from '../utils/kodeUtil.js';

// ── Helper ────────────────────────────────────────────────────────────────────

function toDateStr(v) {
  return toISODate(v);
}

// ── Controller: Trace Publik Satu Batch Stok (QR) ────────────────────────────
// QR menampilkan riwayat lengkap: lahan → tanam → panen → masuk gudang → olahan → logistik
// Endpoint ini TIDAK butuh auth (dipanggil dari halaman publik /trace/STK-xxx)

/**
 * GET /api/public/trace/:kodeBatchStok
 * Cari batch berdasarkan kode (STK-xxx), tanpa login.
 */
export async function getPublicBatchTrace(req, res) {
  try {
    const pool = getPool();
    const kodeBatchStok = String(req.params.kodeBatchStok || '').trim();
    if (!kodeBatchStok) {
      return res.status(400).json({ success: false, message: 'Kode batch tidak valid.' });
    }

    // 1. Batch stok + gudang + lahan + harvest + planting
    const [bs] = await pool.execute(
      `SELECT s.id, s.gudang_id, s.harvest_id, s.kode_batch_stok, s.jumlah_masuk_kg, s.sisa_kg,
              DATE_FORMAT(s.tanggal_masuk, '%Y-%m-%d %H:%i:%s') AS tanggal_masuk,
              s.jenis, s.asal_batch_id, DATE_FORMAT(s.tanggal_sosoh, '%Y-%m-%d %H:%i:%s') AS tanggal_sosoh,
              w.kode_gudang, w.nama_gudang,
              l.kode_lahan, l.nama_lahan AS l_nama_lahan, l.lokasi_desa,
              h.kode_panen, h.nama_lahan AS h_nama_lahan, h.varietas AS h_varietas,
              DATE_FORMAT(h.tanggal_panen, '%Y-%m-%d') AS tanggal_panen,
              h.jumlah_hasil_kg, h.petani_penanggung_jawab, h.status AS h_status, h.periode_hari,
              p.kode_tanam, DATE_FORMAT(p.tanggal_tanam, '%Y-%m-%d') AS tanggal_tanam,
              DATE_FORMAT(p.estimasi_panen, '%Y-%m-%d') AS estimasi_panen, p.petugas AS petugas_tanam, p.status_tanam,
              ab.kode_batch_stok AS asal_kode_batch_stok
       FROM warehouse_stock_batches s
       LEFT JOIN warehouses w ON s.gudang_id = w.id
       LEFT JOIN lands l ON w.lahan_id = l.id
       LEFT JOIN harvests h ON s.harvest_id = h.id
       LEFT JOIN plantings p ON h.planting_id = p.id
       LEFT JOIN warehouse_stock_batches ab ON s.asal_batch_id = ab.id
       WHERE s.kode_batch_stok = ?
       LIMIT 1`,
      [kodeBatchStok]
    );
    if (bs.length === 0) {
      return res.status(404).json({ success: false, message: 'Batch stok tidak ditemukan. Kode salah atau sudah dihapus.' });
    }
    const b = bs[0];

    // 2. Pergerakan batch (masuk & keluar)
    const [movs] = await pool.execute(
      `SELECT m.id, m.tipe, m.jumlah_kg, m.keterangan,
              DATE_FORMAT(m.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
              p.kode_batch, p.nama_produk
       FROM warehouse_movements m
       LEFT JOIN production_batches p ON m.production_id = p.id
       WHERE m.stock_batch_id = ? OR (m.harvest_id = ? AND m.gudang_id = ?)
       ORDER BY m.created_at ASC, m.id ASC`,
      [b.id, b.harvest_id, b.gudang_id]
    );

    // 3. Batch olahan yang memakai batch stok ini
    const [productions] = await pool.execute(
      `SELECT b.id, b.kode_batch, b.nama_produk, b.kategori, b.tanggal_produksi,
              b.jumlah_hasil, b.satuan, b.bahan_digunakan, b.operator_produksi,
              DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
       FROM production_batches b
       WHERE b.stock_batch_id = ?
       ORDER BY b.created_at ASC, b.id ASC`,
      [b.id]
    );

    // 4. Logistik (publik — tampilkan lengkap sesuai preferensi user)
    const [logistics] = await pool.execute(
      `SELECT id, kode_transaksi, tanggal, kategori, keterangan_vendor, total_biaya_rp, status_pembayaran
       FROM logistics_expenses
       ORDER BY created_at DESC
       LIMIT 10`
    );

    return res.status(200).json({
      success: true,
      data: {
        batch: {
          kodeBatchStok: b.kode_batch_stok,
          jenis: b.jenis || 'GABAH',
          asalBatch: b.asal_batch_id ? { id: String(b.asal_batch_id), kodeBatchStok: b.asal_kode_batch_stok } : null,
          tanggalSosoh: toDateStr(b.tanggal_sosoh),
          jumlahMasukKg: Number(b.jumlah_masuk_kg || 0),
          sisaKg: Number(b.sisa_kg || 0),
          tanggalMasuk: toDateStr(b.tanggal_masuk),
        },
        gudang: b.gudang_id ? { kodeGudang: b.kode_gudang, namaGudang: b.nama_gudang } : null,
        lahan: b.kode_lahan ? { kodeLahan: b.kode_lahan, namaLahan: b.l_nama_lahan, lokasiDesa: b.lokasi_desa } : null,
        tanam: b.kode_tanam ? {
          kodeTanam: b.kode_tanam,
          tanggalTanam: toDateStr(b.tanggal_tanam),
          estimasiPanen: toDateStr(b.estimasi_panen),
          petugas: b.petugas_tanam,
          statusTanam: b.status_tanam,
        } : null,
        panen: b.harvest_id ? {
          kodePanen: b.kode_panen,
          namaLahan: b.l_nama_lahan || b.h_nama_lahan || '',
          varietas: b.h_varietas || '',
          tanggalPanen: toDateStr(b.tanggal_panen),
          jumlahHasilKg: Number(b.jumlah_hasil_kg || 0),
          petaniPenanggungJawab: b.petani_penanggung_jawab,
          status: b.h_status,
          periodeHari: b.periode_hari,
        } : null,
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
          tanggalProduksi: toDateStr(p.tanggal_produksi),
          jumlahHasil: Number(p.jumlah_hasil || 0),
          satuan: p.satuan,
          bahanDigunakan: p.bahan_digunakan != null ? Number(p.bahan_digunakan) : null,
          operatorProduksi: p.operator_produksi,
          createdAt: p.created_at,
        })),
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
    console.error('[getPublicBatchTrace] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil riwayat batch.' });
  }
}
