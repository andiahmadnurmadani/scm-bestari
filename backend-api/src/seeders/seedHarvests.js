import { getPool } from '../config/db.js';

/**
 * Seed data panen awal — dijalankan sekali jika tabel harvests masih kosong,
 * agar halaman Panen memiliki data untuk pagination (10 baris/halaman).
 * Kode panen memakai format PN-XXX (konsisten dengan prefix FE: timestampCode('PN-')).
 */
export async function seedHarvests() {
  const pool = getPool();

  const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM harvests');
  if (Number(countRows[0].total) > 0) {
    return; // Sudah ada data, jangan duplikasi
  }

  const sampleData = [
    // [kodePanen, namaLahan, varietas, tanggal, kg, grade, petani, status, catatan]
    ['PN-001', 'Blok A - Sukamaju', 'Sorgum Bioguma 1', '2026-05-14', 4850, 'Grade A (Premium)', 'Pak Karso & KWT Sukamaju Tani', 'Selesai', 'Kadar air saat panen 14.2%, warna bulir cokelat kemerahan bersih.'],
    ['PN-002', 'Blok B - Cisarua', 'Sorgum Kawali', '2026-05-18', 3200, 'Grade A (Premium)', 'Ibu Sugiyanti & Kelompok Tani Cisarua', 'Tersimpan di Gudang', 'Hasil dipisahkan untuk bahan baku utama Tepung Sorgum Pouch 500g.'],
    ['PN-003', 'Blok C - Ciawi', 'Sorgum Suri 4 (Manis)', '2026-06-02', 5100, 'Grade B (Standar)', 'Pak Bambang Mulyono & Gapoktan Ciawi Subur', 'Selesai', 'Batang sorgum manis diproses lebih lanjut menjadi Gula Cair Sorgum Nira.'],
    ['PN-004', 'Blok D - Parung', 'Sorgum Numbu', '2026-06-25', 6400, 'Grade A (Premium)', 'Pak Suwarto & KWT Parung Mandiri', 'Dalam Proses', 'Prosedur pemisahan bulir di thresher sedang berlangsung di lokasi penjemuran.'],
    ['PN-005', 'Blok E - Subang', 'Sorgum Bioguma 2', '2026-07-10', 2800, 'Grade C (Pakan)', 'Pak Joko Subagyo & Kelompok Tani Tani Makmur', 'Siap Panen', 'Prediksi panen raya tanggal 12 Juli, siap kirim armada truk pengangkut.'],
    ['PN-006', 'Blok F - Indramayu', 'Sorgum Suri 4 (Manis)', '2026-07-15', 3900, 'Grade A (Premium)', 'Ibu Sri Rahayu & KWT Indramayu Sorgum', 'Selesai', 'Hasil panen berkualitas premium untuk ekspor beras sorgum.'],
    ['PN-007', 'Blok A - Sukamaju', 'Sorgum Numbu', '2026-07-20', 2750, 'Grade B (Standar)', 'Pak Ahmad Fauzi & KWT Sukamaju Tani', 'Tersimpan di Gudang', 'Disimpan di Gudang B untuk proses pengolahan tepung.'],
    ['PN-008', 'Blok B - Cisarua', 'Sorgum Bioguma 1', '2026-07-25', 5300, 'Grade A (Premium)', 'Ibu Rina Marlina & Kelompok Tani Cisarua', 'Dalam Proses', 'Penjemuran bulir di solar dryer dome kapasitas 2 ton.'],
    ['PN-009', 'Blok C - Ciawi', 'Sorgum Kawali', '2026-07-28', 3100, 'Grade B (Standar)', 'Pak Hendra Gunawan & Gapoktan Ciawi Subur', 'Selesai', 'Hasil dipisahkan untuk pakan ternak dan bahan baku rengginang.'],
    ['PN-010', 'Blok D - Parung', 'Sorgum Bioguma 2', '2026-07-30', 4600, 'Grade A (Premium)', 'Ibu Nurul Hidayah & KWT Parung Mandiri', 'Siap Panen', 'Panen raya minggu depan, koordinasi armada truk sedang disiapkan.'],
    ['PN-011', 'Blok E - Subang', 'Sorgum Suri 4 (Manis)', '2026-08-02', 3850, 'Grade B (Standar)', 'Pak Dedi Kurniawan & Kelompok Tani Tani Makmur', 'Dalam Proses', 'Batang sorgum manis disadap untuk produksi gula cair nira.'],
    ['PN-012', 'Blok F - Indramayu', 'Sorgum Numbu', '2026-08-05', 2950, 'Grade A (Premium)', 'Ibu Yuni Astuti & KWT Indramayu Sorgum', 'Selesai', 'Hasil panen disimpan di gudang utama KWT Sorgum.'],
  ];

  const insertSQL = `
    INSERT INTO harvests
      (kode_panen, nama_lahan, varietas, tanggal_panen, jumlah_hasil_kg,
       kualitas_grade, petani_penanggung_jawab, status, catatan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  for (const row of sampleData) {
    await pool.execute(insertSQL, row);
  }

  console.log(`✓ Seed data panen: ${sampleData.length} baris dimasukkan.`);
}
