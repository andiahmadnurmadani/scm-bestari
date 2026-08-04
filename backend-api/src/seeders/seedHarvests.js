import { getPool } from '../config/db.js';

/**
 * Seed data panen awal — dijalankan sekali jika tabel harvests masih kosong,
 * agar halaman Panen memiliki data untuk pagination (10 baris/halaman).
 */
export async function seedHarvests() {
  const pool = getPool();

  const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM harvests');
  if (Number(countRows[0].total) > 0) {
    return; // Sudah ada data, jangan duplikasi
  }

  const sampleData = [
    // [kodePanen, namaLahan, varietas, tanggal, kg, grade, petani, status, catatan]
    ['PANEN-2026-001', 'Lahan Sektor A (Tani Makmur)', 'Sorgum Bioguma 1', '2026-05-14', 4850, 'Grade A (Premium)', 'Pak Karso & Kelompok Tani Tani Makmur', 'Selesai', 'Kadar air saat panen 14.2%, warna bulir cokelat kemerahan bersih.'],
    ['PANEN-2026-002', 'Lahan Sektor B (Sedyo Rukun)', 'Sorgum Numbu', '2026-05-18', 3200, 'Grade A (Premium)', 'Ibu Sugiyanti & KWT Sedyo Rukun', 'Tersimpan di Gudang', 'Hasil dipisahkan untuk bahan baku utama Tepung Sorgum Pouch 500g.'],
    ['PANEN-2026-003', 'Lahan Sektor C (Mekar Tani)', 'Sorgum Suri 4 (Manis)', '2026-06-02', 5100, 'Grade B (Standar)', 'Pak Bambang Mulyono', 'Selesai', 'Batang sorgum manis diproses lebih lanjut menjadi Gula Cair Sorgum Nira.'],
    ['PANEN-2026-004', 'Lahan Sektor D (Sorgum Lestari)', 'Sorgum Kawali', '2026-06-25', 6400, 'Grade A (Premium)', 'Pak Suwarto & Kelompok Sorgum Lestari', 'Dalam Proses', 'Prosedur pemisahan bulir di thresher sedang berlangsung di lokasi penjemuran.'],
    ['PANEN-2026-005', 'Lahan Sektor E (Mulia Tani)', 'Sorgum Bioguma 2', '2026-07-10', 2800, 'Grade C (Pakan)', 'Pak Joko Subagyo', 'Siap Panen', 'Prediksi panen raya tanggal 12 Juli, siap kirim armada truk pengangkut.'],
    ['PANEN-2026-006', 'Lahan Sektor F (Karya Tani)', 'Sorgum Suri 4 (Manis)', '2026-07-15', 3900, 'Grade A (Premium)', 'Ibu Sri Rahayu & KWT Karya Tani', 'Selesai', 'Hasil panen berkualitas premium untuk ekspor beras sorgum.'],
    ['PANEN-2026-007', 'Lahan Sektor G (Subur Makmur)', 'Sorgum Numbu', '2026-07-20', 2750, 'Grade B (Standar)', 'Pak Ahmad Fauzi', 'Tersimpan di Gudang', 'Disimpan di Gudang B untuk proses pengolahan tepung.'],
    ['PANEN-2026-008', 'Lahan Sektor H (Tani Lestari)', 'Sorgum Bioguma 1', '2026-07-25', 5300, 'Grade A (Premium)', 'Ibu Rina Marlina', 'Dalam Proses', 'Penjemuran bulir di solar dryer dome kapasitas 2 ton.'],
    ['PANEN-2026-009', 'Lahan Sektor I (Makmur Jaya)', 'Sorgum Kawali', '2026-07-28', 3100, 'Grade B (Standar)', 'Pak Hendra Gunawan', 'Selesai', 'Hasil dipisahkan untuk pakan ternak dan bahan baku rengginang.'],
    ['PANEN-2026-010', 'Lahan Sektor J (Berkah Tani)', 'Sorgum Bioguma 2', '2026-07-30', 4600, 'Grade A (Premium)', 'Ibu Nurul Hidayah', 'Siap Panen', 'Panen raya minggu depan, koordinasi armada truk sedang disiapkan.'],
    ['PANEN-2026-011', 'Lahan Sektor K (Sido Makmur)', 'Sorgum Suri 4 (Manis)', '2026-08-02', 3850, 'Grade B (Standar)', 'Pak Dedi Kurniawan', 'Dalam Proses', 'Batang sorgum manis disadap untuk produksi gula cair nira.'],
    ['PANEN-2026-012', 'Lahan Sektor L (Tani Subur)', 'Sorgum Numbu', '2026-08-05', 2950, 'Grade A (Premium)', 'Ibu Yuni Astuti', 'Selesai', 'Hasil panen disimpan di gudang utama KWT Sorgum.'],
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
