/**
 * Helper stok gudang yang aman & konsisten.
 *
 * - Semua perubahan stok dijalankan di dalam transaksi (`withTransaction`)
 *   sehingga data panen/produksi & stok gudang selalu berubah bersamaan.
 * - Pengurangan stok bersifat atomik (`WHERE sisa_kg >= ?`) → stok tidak
 *   bisa minus walau ada dua permintaan bersamaan.
 */

/** Error dengan status HTTP & pesan yang aman ditampilkan ke pengguna. */
export class StokError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Jalankan `fn(conn)` di dalam transaksi; rollback otomatis bila gagal. */
export async function withTransaction(pool, fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const hasil = await fn(conn);
    await conn.commit();
    return hasil;
  } catch (err) {
    try { await conn.rollback(); } catch { /* abaikan */ }
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Kurangi sisa stok sebuah batch (atomik) beserta total stok gudangnya.
 * Melempar StokError bila sisa tidak cukup.
 */
export async function kurangiStokBatch(conn, batchId, qty) {
  const jumlah = Number(qty) || 0;
  if (jumlah <= 0) return;
  const [r] = await conn.execute(
    'UPDATE warehouse_stock_batches SET sisa_kg = sisa_kg - ? WHERE id = ? AND sisa_kg >= ?',
    [jumlah, batchId, jumlah]
  );
  if (r.affectedRows === 0) {
    const [b] = await conn.execute('SELECT kode_batch_stok, sisa_kg FROM warehouse_stock_batches WHERE id = ? LIMIT 1', [batchId]);
    if (!b.length) throw new StokError('Batch stok tidak ditemukan.', 404);
    throw new StokError(`Sisa stok batch ${b[0].kode_batch_stok} tidak cukup (tersisa ${Number(b[0].sisa_kg)} kg).`);
  }
  await conn.execute(
    'UPDATE warehouses w JOIN warehouse_stock_batches s ON s.gudang_id = w.id SET w.total_stok_kg = w.total_stok_kg - ? WHERE s.id = ?',
    [jumlah, batchId]
  );
}

/** Kembalikan stok ke sebuah batch beserta total stok gudangnya. */
export async function kembalikanStokBatch(conn, batchId, qty) {
  const jumlah = Number(qty) || 0;
  if (jumlah <= 0 || !batchId) return;
  const [b] = await conn.execute(
    'SELECT gudang_id, sisa_kg, jumlah_masuk_kg FROM warehouse_stock_batches WHERE id = ? LIMIT 1 FOR UPDATE',
    [batchId]
  );
  if (!b.length) return; // batch sudah tidak ada → tidak ada yang dikembalikan
  // Jangan melebihi jumlah masuk awal batch
  const tambah = Math.min(jumlah, Number(b[0].jumlah_masuk_kg) - Number(b[0].sisa_kg));
  if (tambah <= 0) return;
  await conn.execute('UPDATE warehouse_stock_batches SET sisa_kg = sisa_kg + ? WHERE id = ?', [tambah, batchId]);
  await conn.execute('UPDATE warehouses SET total_stok_kg = total_stok_kg + ? WHERE id = ?', [tambah, b[0].gudang_id]);
}

/** Status stok kemasan dihitung ulang dari stok tersedia & minimal (SQL). */
const STATUS_KEMASAN_SQL = `status_stok = CASE WHEN stok_tersedia <= 0 THEN 'Habis'
  WHEN stok_tersedia <= stok_minimal THEN 'Stok Menipis' ELSE 'Stok Cukup' END`;

/** Kurangi stok kemasan (atomik). Melempar StokError bila tidak cukup. */
export async function kurangiStokKemasan(conn, packagingId, qty) {
  const jumlah = Math.round(Number(qty) || 0);
  if (!packagingId || jumlah <= 0) return;
  const [r] = await conn.execute(
    'UPDATE packaging_materials SET stok_tersedia = stok_tersedia - ? WHERE id = ? AND stok_tersedia >= ?',
    [jumlah, packagingId, jumlah]
  );
  if (r.affectedRows === 0) {
    const [k] = await conn.execute('SELECT nama_kemasan, stok_tersedia, satuan FROM packaging_materials WHERE id = ? LIMIT 1', [packagingId]);
    if (!k.length) throw new StokError('Kemasan tidak ditemukan.', 404);
    throw new StokError(`Stok kemasan "${k[0].nama_kemasan}" tidak cukup (tersisa ${Number(k[0].stok_tersedia)} ${k[0].satuan || 'Pcs'}).`);
  }
  await conn.execute(`UPDATE packaging_materials SET ${STATUS_KEMASAN_SQL} WHERE id = ?`, [packagingId]);
}

/** Kembalikan stok kemasan (mis. olahan dihapus / jumlah dikurangi). */
export async function kembalikanStokKemasan(conn, packagingId, qty) {
  const jumlah = Math.round(Number(qty) || 0);
  if (!packagingId || jumlah <= 0) return;
  await conn.execute('UPDATE packaging_materials SET stok_tersedia = stok_tersedia + ? WHERE id = ?', [jumlah, packagingId]);
  await conn.execute(`UPDATE packaging_materials SET ${STATUS_KEMASAN_SQL} WHERE id = ?`, [packagingId]);
}
