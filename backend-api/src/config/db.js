import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ── Konfigurasi Database ──────────────────────────────────────────────────────
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sorgum_scm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
};

// Pool koneksi utama (setelah database dipastikan ada)
let pool = null;

/**
 * Membuat database jika belum ada, lalu mengembalikan connection pool siap pakai.
 * Dipanggil sekali saat server start.
 */
export async function initDatabase() {
  // Koneksi tanpa database untuk bisa CREATE DATABASE
  const conn = await mysql.createConnection({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
  });

  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✓ Database "${DB_CONFIG.database}" siap (auto-create jika belum ada).`);
  } finally {
    await conn.end();
  }

  // Buat pool ke database yang sudah pasti ada
  pool = mysql.createPool(DB_CONFIG);

  // Auto-migrasi: pastikan tabel users ada
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      phone VARCHAR(30) NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'Anggota KWT',
      avatar VARCHAR(500) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✓ Tabel "users" siap.');

  // Migrasi: kolom profil tambahan (dibuat jika belum ada — tabel mungkin sudah ada)
  const profileColumns = [
    ['jabatan', "VARCHAR(100) NULL"],
    ['nama_kwt', "VARCHAR(200) NULL"],
    ['alamat', "VARCHAR(255) NULL"],
    ['kecamatan', "VARCHAR(100) NULL"],
    ['kabupaten', "VARCHAR(100) NULL"],
    ['bio', "TEXT NULL"],
  ];
  for (const [colName, colDef] of profileColumns) {
    try {
      const [colRows] = await pool.query(
        `SELECT COUNT(*) AS total FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = ?`,
        [colName]
      );
      if (Number(colRows[0].total) === 0) {
        await pool.query(`ALTER TABLE users ADD COLUMN \`${colName}\` ${colDef}`);
        console.log(`✓ Kolom "users.${colName}" ditambahkan.`);
      }
    } catch (alterError) {
      console.warn(`⚠ Migrasi users.${colName} dilewati:`, alterError.message);
    }
  }

  // Pastikan avatar bertipe LONGTEXT (untuk menampung base64 foto profil)
  try {
    await pool.query(`ALTER TABLE users MODIFY COLUMN avatar LONGTEXT NULL`);
    console.log('✓ Kolom "users.avatar" dipastikan LONGTEXT.');
  } catch (alterError) {
    console.warn('⚠ Migrasi users.avatar dilewati:', alterError.message);
  }

  // Auto-migrasi: tabel cms_settings (konten landing page)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cms_settings (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(50) NOT NULL UNIQUE,
      data LONGTEXT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✓ Tabel "cms_settings" siap.');

  // Auto-migrasi: pastikan tabel harvests ada
  await pool.query(`
    CREATE TABLE IF NOT EXISTS harvests (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      kode_panen VARCHAR(50) NOT NULL UNIQUE,
      nama_lahan VARCHAR(200) NOT NULL,
      varietas VARCHAR(100) NOT NULL,
      tanggal_panen DATE NOT NULL,
      jumlah_hasil_kg DECIMAL(12,2) NOT NULL DEFAULT 0,
      kualitas_grade ENUM('Grade A (Premium)', 'Grade B (Standar)', 'Grade C (Pakan)') NOT NULL DEFAULT 'Grade A (Premium)',
      petani_penanggung_jawab VARCHAR(200) NOT NULL,
      status ENUM('Siap Panen', 'Dalam Proses', 'Selesai', 'Tersimpan di Gudang') NOT NULL DEFAULT 'Selesai',
      catatan TEXT NULL,
      foto_url LONGTEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✓ Tabel "harvests" siap.');

  // Migrasi: pastikan kolom foto_url bertipe LONGTEXT (untuk menampung base64 gambar)
  // CREATE TABLE IF NOT EXISTS tidak mengubah tabel yang sudah ada, jadi lakukan ALTER.
  try {
    await pool.query(`ALTER TABLE harvests MODIFY COLUMN foto_url LONGTEXT NULL`);
    console.log('✓ Kolom "harvests.foto_url" dipastikan LONGTEXT.');
  } catch (alterError) {
    console.warn('⚠ Migrasi foto_url dilewati:', alterError.message);
  }

  // Auto-migrasi: tabel master varieties
  await pool.query(`
    CREATE TABLE IF NOT EXISTS varieties (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT NULL,
      image_url LONGTEXT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✓ Tabel "varieties" siap.');

  // Migrasi: pastikan kolom image_url ada (untuk menampung base64 gambar)
  // CREATE TABLE IF NOT EXISTS tidak menambah kolom ke tabel yang sudah ada,
  // jadi cek keberadaan kolom dulu via information_schema, lalu ADD COLUMN.
  try {
    const [colRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'varieties' AND COLUMN_NAME = 'image_url'`
    );
    if (Number(colRows[0].total) === 0) {
      await pool.query(`ALTER TABLE varieties ADD COLUMN image_url LONGTEXT NULL`);
      console.log('✓ Kolom "varieties.image_url" ditambahkan (LONGTEXT).');
    } else {
      await pool.query(`ALTER TABLE varieties MODIFY COLUMN image_url LONGTEXT NULL`);
      console.log('✓ Kolom "varieties.image_url" dipastikan LONGTEXT.');
    }
  } catch (alterError) {
    console.warn('⚠ Migrasi varieties.image_url dilewati:', alterError.message);
  }

  // Seed varietas awal jika tabel kosong
  const [vCount] = await pool.query('SELECT COUNT(*) AS total FROM varieties');
  if (Number(vCount[0].total) === 0) {
    const seedVarieties = [
      ['Sorgum Bioguma 1', 'Varietas unggul Balitbangtan, cocok untuk pangan, umur panen ±100 hari.'],
      ['Sorgum Bioguma 2', 'Varietas unggul dengan hasil tinggi, toleran kekeringan.'],
      ['Sorgum Bioguma 3', 'Varietas sorgum manis untuk pangan dan bioetanol.'],
      ['Sorgum Numbu', 'Varietas lokal adaptif, baik untuk tepung dan pakan.'],
      ['Sorgum Kawali', 'Varietas unggul dengan biji besar, hasil melimpah.'],
      ['Sorgum Suri 4 (Manis)', 'Sorgum manis, batangnya disadap untuk gula cair nira.'],
    ];
    for (const v of seedVarieties) {
      await pool.execute('INSERT INTO varieties (name, description) VALUES (?, ?)', v);
    }
    console.log(`✓ Seed varietas: ${seedVarieties.length} baris dimasukkan.`);
  }

  // Auto-migrasi: tabel lands (kelola lahan)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lands (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      kode_lahan VARCHAR(50) NOT NULL UNIQUE,
      nama_lahan VARCHAR(200) NOT NULL,
      lokasi_desa VARCHAR(150) NOT NULL,
      kecamatan VARCHAR(150) NOT NULL,
      luas_hektar DECIMAL(8,2) NOT NULL DEFAULT 0,
      varietas_sorgum VARCHAR(100) NOT NULL,
      status_irigasi ENUM('Irigasi Teknis', 'Tadah Hujan', 'Semi Teknis') NOT NULL DEFAULT 'Irigasi Teknis',
      jenis_tanah VARCHAR(100) NOT NULL,
      pemilik_kelompok_tani VARCHAR(200) NOT NULL,
      status_kesiapan ENUM('Siap Tanam', 'Masa Pertumbuhan', 'Masa Panen', 'Bera (Istirahat)') NOT NULL DEFAULT 'Siap Tanam',
      status_badge VARCHAR(30) NULL,
      panen_lalu_ton DECIMAL(10,2) NULL DEFAULT 0,
      foto_url LONGTEXT NULL,
      latitude DECIMAL(10,7) NULL,
      longitude DECIMAL(10,7) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✓ Tabel "lands" siap.');

  // Migrasi: pastikan kolom foto_url bertipe LONGTEXT
  try {
    await pool.query(`ALTER TABLE lands MODIFY COLUMN foto_url LONGTEXT NULL`);
    console.log('✓ Kolom "lands.foto_url" dipastikan LONGTEXT.');
  } catch (alterError) {
    console.warn('⚠ Migrasi lands.foto_url dilewati:', alterError.message);
  }

  // Seed lahan awal jika tabel kosong (dari mock data frontend)
  const [lCount] = await pool.query('SELECT COUNT(*) AS total FROM lands');
  if (Number(lCount[0].total) === 0) {
    const seedLands = [
      ['BLK-SKM-01', 'Blok A - Sukamaju', 'Sukamaju', 'Cisalak', 2.5, 'Sorgum Bioguma 1', 'Irigasi Teknis', 'Aluvial', 'KWT Sukamaju Tani', 'Siap Tanam', 'AKTIF', 12.4, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'],
      ['BLK-CSR-02', 'Blok B - Cisarua', 'Cisarua', 'Lembang', 1.8, 'Sorgum Kawali', 'Semi Teknis', 'Latosol', 'Kelompok Tani Cisarua', 'Masa Pertumbuhan', 'PERSIAPAN', 9.2, 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80'],
      ['BLK-CAW-03', 'Blok C - Ciawi', 'Ciawi', 'Bogor', 3.2, 'Sorgum Bioguma 2', 'Tadah Hujan', 'Grumosol', 'Gapoktan Ciawi Subur', 'Siap Tanam', 'AKTIF', 15.1, 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80'],
      ['BLK-PRG-04', 'Blok D - Parung', 'Parung', 'Parung', 1.2, 'Sorgum Numbu', 'Irigasi Teknis', 'Aluvial', 'KWT Parung Mandiri', 'Masa Pertumbuhan', 'PEMBESARAN', 5.5, 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80'],
      ['BLK-SBG-05', 'Blok E - Subang', 'Argomulyo', 'Cangkringan', 4.5, 'Sorgum Bioguma 2', 'Irigasi Teknis', 'Vulkanik Regosol', 'Kelompok Tani Tani Makmur', 'Masa Panen', 'AKTIF', 18.3, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'],
      ['BLK-IDM-06', 'Blok F - Indramayu', 'Jatibarang', 'Indramayu', 5.0, 'Sorgum Suri 4 (Manis)', 'Semi Teknis', 'Alluvial Subur', 'KWT Indramayu Sorgum', 'Masa Panen', 'AKTIF', 21.0, 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80'],
    ];
    for (const row of seedLands) {
      await pool.execute(
        `INSERT INTO lands
          (kode_lahan, nama_lahan, lokasi_desa, kecamatan, luas_hektar, varietas_sorgum,
           status_irigasi, jenis_tanah, pemilik_kelompok_tani, status_kesiapan,
           status_badge, panen_lalu_ton, foto_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }
    console.log(`✓ Seed lahan: ${seedLands.length} baris dimasukkan.`);
  }

  // Auto-migrasi: tabel equipment (sarana & peralatan)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS equipment (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      kode_alat VARCHAR(50) NOT NULL UNIQUE,
      nama_peralatan VARCHAR(200) NOT NULL,
      kategori VARCHAR(100) NOT NULL,
      jumlah_stok INT NOT NULL DEFAULT 1,
      kondisi ENUM('Sangat Baik', 'Baik', 'Perlu Perbaikan', 'Rusak') NOT NULL DEFAULT 'Baik',
      status ENUM('Tersedia', 'Sedang Digunakan', 'Dalam Perawatan', 'Diarsipkan') NOT NULL DEFAULT 'Tersedia',
      lokasi_penyimpanan VARCHAR(200) NOT NULL,
      tanggal_pengadaan VARCHAR(50) NULL,
      spesifikasi TEXT NULL,
      foto_url LONGTEXT NULL,
      terakhir_servis VARCHAR(50) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✓ Tabel "equipment" siap.');

  // Migrasi: pastikan kolom foto_url bertipe LONGTEXT
  try {
    await pool.query(`ALTER TABLE equipment MODIFY COLUMN foto_url LONGTEXT NULL`);
    console.log('✓ Kolom "equipment.foto_url" dipastikan LONGTEXT.');
  } catch (alterError) {
    console.warn('⚠ Migrasi equipment.foto_url dilewati:', alterError.message);
  }

  // Seed peralatan awal jika tabel kosong (dari mock data frontend)
  const [eCount] = await pool.query('SELECT COUNT(*) AS total FROM equipment');
  if (Number(eCount[0].total) === 0) {
    const seedEquipment = [
      ['S-001 Hand Tractor', 'Hand Tractor Quick G1000 Kubota 8.5 HP', 'Mesin Olah Tanah', 3, 'Sangat Baik', 'Tersedia', 'Gudang Alat Lahan A (Gubug Tani)', '15 Maret 2024', 'Mesin Diesel Kubota RD 85 DI-1T, Kecepatan 2 Maju 1 Mundur, Kapasitas Kerja 0.12 Ha/Jam.', 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80', '10 April 2026'],
      ['S-002 Thresher', 'Mesin Perontok Sorgum Multi-Guna Model S-500', 'Pascapanen', 2, 'Baik', 'Sedang Digunakan', 'Sentra Pengolahan KWT Sorgum', '10 Juni 2024', 'Motor Penggerak Honda GX200 6.5 HP, Kapasitas Perontokan 500-700 kg/jam, Tingkat Kebersihan 98%.', 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80', '22 Mei 2026'],
      ['S-003 Disc Mill', 'Mesin Penepung Sorgum Disc Mill FFC-23 Stainless', 'Pengolahan Produk', 4, 'Sangat Baik', 'Tersedia', 'Ruang Produksi Tepung KWT', '02 Januari 2025', 'Bahan Full Stainless Steel 304 (Food Grade), Daya Listrik 3 kW 3-Phase, Kehalusan Tepung 80-100 Mesh.', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80', '05 Juni 2026'],
      ['S-004 Solar Dryer', 'Rumah Pengering Efek Rumah Kaca (Solar Dryer Dome)', 'Pengeringan', 1, 'Baik', 'Tersedia', 'Pelataran Penjemuran Lahan B', '18 Agustus 2024', 'Atap Polycarbonate UV Protection, Dinding Kasa Stainless anti serangga, Luas 6x12 Meter, Kapasitas 2 Ton.', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80', '12 Januari 2026'],
      ['S-005 Seed Cleaner', 'Mesin Pembersih Biji Sorgum (Seed Cleaner)', 'Pascapanen', 2, 'Baik', 'Tersedia', 'Gudang Pascapanen KWT', '05 Juli 2024', 'Sistem Ayakan 2 Tingkat + Blower, Kapasitas 300 kg/jam, Cocok untuk biji sorgum.', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80', '18 Maret 2026'],
      ['S-006 Trailer Angkut', 'Trailer Angkut Hasil Panen 1.5 Ton', 'Transportasi', 2, 'Baik', 'Sedang Digunakan', 'Gudang Alat Lahan A', '20 September 2024', 'Dimensi 2.4x1.2m, Rangka Besi Galvanis, Kapasitas Muat 1.5 Ton, Roda 4.', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80', '30 April 2026'],
    ];
    for (const row of seedEquipment) {
      await pool.execute(
        `INSERT INTO equipment
          (kode_alat, nama_peralatan, kategori, jumlah_stok, kondisi, status,
           lokasi_penyimpanan, tanggal_pengadaan, spesifikasi, foto_url, terakhir_servis)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }
    console.log(`✓ Seed peralatan: ${seedEquipment.length} baris dimasukkan.`);
  }

  // Auto-migrasi: tabel production_batches (kelola produksi)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS production_batches (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      kode_batch VARCHAR(50) NOT NULL UNIQUE,
      nama_produk VARCHAR(200) NOT NULL,
      kategori ENUM('Raw (Bahan Mentah)', 'Ready to Eat (Siap Konsumsi)') NOT NULL DEFAULT 'Ready to Eat (Siap Konsumsi)',
      tanggal_produksi VARCHAR(50) NULL,
      tanggal_kadaluarsa VARCHAR(50) NULL,
      jumlah_hasil INT NOT NULL DEFAULT 0,
      satuan VARCHAR(100) NOT NULL,
      nomor_batch_bahan_baku VARCHAR(100) NULL,
      operator_produksi VARCHAR(200) NULL,
      status_qc ENUM('Lolos QC', 'Pending QC', 'Revisi Batch') NOT NULL DEFAULT 'Pending QC',
      lokasi_gudang VARCHAR(200) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✓ Tabel "production_batches" siap.');

  // Seed batch produksi awal
  const [pCount] = await pool.query('SELECT COUNT(*) AS total FROM production_batches');
  if (Number(pCount[0].total) === 0) {
    const seedBatches = [
      ['PRD-2026-001', 'Tepung Sorgum Bioguma White Premium 500g', 'Ready to Eat (Siap Konsumsi)', '15 Mei 2026', '15 Mei 2027', 2500, 'Kemasan (Pouch)', 'HARVEST-S-014', 'Ibu KWT Tani Rahayu (Ny. Hastuti)', 'Lolos QC', 'Gudang A - Rak Pouch Ready'],
      ['PRD-2026-002', 'Rengginang Sorgum Bumbu Savory Herbs', 'Ready to Eat (Siap Konsumsi)', '18 Mei 2026', '18 Nopember 2026', 1800, 'Box (150g)', 'HARVEST-S-012', 'Tim Olahan KWT Pertiwi', 'Lolos QC', 'Gudang A - Rak Box Snack'],
      ['PRD-2026-003', 'Gula Cair Sorgum Nira Manis Murni', 'Ready to Eat (Siap Konsumsi)', '22 Mei 2026', '22 Mei 2028', 850, 'Botol Kaca (350ml)', 'NIRA-S-008', 'Pak Slamet & Tim Ekstraksi Nira', 'Lolos QC', 'Gudang B - Suhu Ruang Terkontrol'],
      ['PRD-2026-004', 'Biji Sorgum Sosoh Kering (Grains Raw)', 'Raw (Bahan Mentah)', '02 Juni 2026', '02 Juni 2027', 4500, 'Kg (Karung Bulk 25kg)', 'HARVEST-S-018', 'Unit Sosoh & Cleaner Lahan B', 'Lolos QC', 'Gudang Raw Material C'],
      ['PRD-2026-005', 'Nira Sorgum Murni (Raw Sap Extractions)', 'Raw (Bahan Mentah)', '10 Juni 2026', '12 Juni 2026', 1200, 'Liter (Drum Cool Container)', 'NIRA-S-010', 'Tim Sadap Nira Batang Sorgum', 'Pending QC', 'Tangki Pendingin Sementara'],
      ['PRD-2026-006', 'Tepung Sorgum Halus Mesh 100 Non-Gluten', 'Raw (Bahan Mentah)', '20 Juni 2026', '20 Juni 2027', 3200, 'Kg (Karung Paper 25kg)', 'HARVEST-S-020', 'Unit Penggilingan Sentra KWT', 'Lolos QC', 'Gudang A - Rak Tepung'],
    ];
    for (const row of seedBatches) {
      await pool.execute(
        `INSERT INTO production_batches
          (kode_batch, nama_produk, kategori, tanggal_produksi, tanggal_kadaluarsa,
           jumlah_hasil, satuan, nomor_batch_bahan_baku, operator_produksi, status_qc, lokasi_gudang)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }
    console.log(`✓ Seed produksi: ${seedBatches.length} baris dimasukkan.`);
  }

  // Auto-migrasi: tabel certificates (kelola sertifikat)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS certificates (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      kode_dokumen VARCHAR(50) NOT NULL UNIQUE,
      nama_sertifikat VARCHAR(200) NOT NULL,
      penerbit_sertifikat VARCHAR(200) NOT NULL,
      nomor_sertifikat VARCHAR(100) NULL,
      tanggal_terbit VARCHAR(50) NULL,
      tanggal_kadaluarsa VARCHAR(50) NULL,
      status ENUM('AKTIF', 'PROSES', 'KADALUARSA') NOT NULL DEFAULT 'PROSES',
      jenis_dokumen ENUM('Sertifikat Halal', 'Izin P-IRT', 'Uji Lab Nutrisi', 'Sertifikat Organik', 'Lainnya') NOT NULL DEFAULT 'Lainnya',
      file_url LONGTEXT NULL,
      file_name VARCHAR(200) NULL,
      file_type ENUM('pdf', 'image') NULL,
      keterangan TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✓ Tabel "certificates" siap.');

  // Placeholder dokumen (SVG inline) agar preview tidak bergantung internet.
  const docSvg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800' viewBox='0 0 600 800'><rect width='600' height='800' fill='#FFF8F0'/><rect x='30' y='30' width='540' height='740' rx='16' fill='#ffffff' stroke='#2C4219' stroke-width='4'/><rect x='70' y='70' width='460' height='96' rx='14' fill='#C3E28D'/><text x='300' y='140' font-family='Arial' font-size='34' font-weight='bold' fill='#172C05' text-anchor='middle'>SERTIFIKAT</text><text x='300' y='200' font-family='Arial' font-size='22' fill='#2C4219' text-anchor='middle'>Produk Olahan Sorgum KWT</text><text x='300' y='430' font-family='Arial' font-size='20' fill='#9CA3AF' text-anchor='middle'>Dokumen PDF legalitas</text><text x='300' y='464' font-family='Arial' font-size='16' fill='#B9BFc4' text-anchor='middle'>Unduh untuk melihat isi dokumen</text><rect x='150' y='560' width='300' height='56' rx='12' fill='#2C4219'/><text x='300' y='598' font-family='Arial' font-size='20' font-weight='bold' fill='#C3E28D' text-anchor='middle'>SORGUM SCM</text></svg>";
  const docPlaceholder = 'data:image/svg+xml,' + encodeURIComponent(docSvg);

  // Seed sertifikat awal
  const [cCount] = await pool.query('SELECT COUNT(*) AS total FROM certificates');
  if (Number(cCount[0].total) === 0) {
    const seedCerts = [
      ['CERT-HALAL-001', 'Sertifikat Halal Produk Olahan Sorgum BPJPH', 'BPJPH Kementerian Agama RI & LPPOM MUI', 'ID311100012948120323', '12 Maret 2024', '12 Maret 2028', 'AKTIF', 'Sertifikat Halal', docPlaceholder, 'Sertifikat_Halal_BPJPH_2024', 'image', 'Mencakup Tepung Sorgum, Rengginang, dan Gula Cair Sorgum KWT Mitra.'],
      ['CERT-PIRT-002', 'Izin Edar P-IRT Tepung & Olahan Sorgum', 'Dinas Kesehatan & PTSP Kabupaten Sleman', 'P-IRT 2063404010892-28', '05 Januari 2023', '05 Januari 2028', 'AKTIF', 'Izin P-IRT', docPlaceholder, 'Izin_PIRT_Sleman_2023', 'image', 'Kelayakan hygiene saniter tempat produksi dan standar kemasan kedap udara.'],
      ['CERT-LAB-003', 'Hasil Uji Lab Bebas Gluten (Gluten-Free Test)', 'Laboratorium Penguji Pangan IPB University', 'LAB-IPB-2025/11/0491', '20 November 2025', '20 November 2026', 'AKTIF', 'Uji Lab Nutrisi', docPlaceholder, 'Hasil_Uji_Lab_GlutenFree_IPB', 'image', 'Terbukti kadar gluten < 5 ppm (Memenuhi standar Internasional Gluten-Free).'],
      ['CERT-ORG-004', 'Sertifikasi Pertanian Organik Indonesia (SNI 6729:2016)', 'Lembaga Sertifikasi Organik (LSO) Inofice', '184-LSO-005-IDN-08-23', '14 Agustus 2023', '14 Agustus 2026', 'PROSES', 'Sertifikat Organik', docPlaceholder, 'Sertifikat_Organik_SNI_2023', 'image', 'Sedang dalam pengajuan perpanjangan audit surveillance tahunan ke-3.'],
      ['CERT-LAB-005', 'Uji Laboratorium Indeks Glikemik Rendah (GI 52)', 'Laboratorium Gizi Universitas Gadjah Mada', 'UGM-NUTR-2022-8971', '10 Februari 2022', '10 Februari 2025', 'KADALUARSA', 'Uji Lab Nutrisi', docPlaceholder, 'Uji_GI_UGM_2022', 'image', 'Perlu pembaruan uji untuk memperkuat klaim low-GI pada kemasan.'],
    ];
    for (const row of seedCerts) {
      await pool.execute(
        `INSERT INTO certificates
          (kode_dokumen, nama_sertifikat, penerbit_sertifikat, nomor_sertifikat,
           tanggal_terbit, tanggal_kadaluarsa, status, jenis_dokumen,
           file_url, file_name, file_type, keterangan)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }
    console.log(`✓ Seed sertifikat: ${seedCerts.length} baris dimasukkan.`);
  }

  // Perbaiki baris sertifikat lama yang masih menunjuk file eksternal
  // (w3.org dummy.pdf / images.unsplash.com) agar preview tidak error offline.
  try {
    const [badRows] = await pool.query(
      `SELECT id, kode_dokumen FROM certificates
       WHERE file_url LIKE '%www.w3.org%' OR file_url LIKE '%unsplash.com%'`
    );
    if (badRows.length > 0) {
      await pool.query(
        `UPDATE certificates
         SET file_url = ?, file_type = 'image',
             file_name = CONCAT(COALESCE(file_name, 'Dokumen_Sertifikat'), '_local')
         WHERE file_url LIKE '%www.w3.org%' OR file_url LIKE '%unsplash.com%'`,
        [docPlaceholder]
      );
      console.log(`✓ ${badRows.length} sertifikat dengan URL eksternal diperbaiki → placeholder lokal.`);
    }
  } catch (migrateError) {
    console.warn('⚠ Perbaikan file_url sertifikat dilewati:', migrateError.message);
  }

  // Auto-migrasi: tabel packaging_materials (kelola kemasan)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS packaging_materials (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      kode_kemasan VARCHAR(50) NOT NULL UNIQUE,
      nama_kemasan VARCHAR(200) NOT NULL,
      kategori ENUM('Standing Pouch', 'Box Custom', 'Karung Bulk', 'Botol Kaca', 'Aksesoris') NOT NULL DEFAULT 'Standing Pouch',
      kapasitas VARCHAR(50) NULL,
      stok_tersedia INT NOT NULL DEFAULT 0,
      satuan VARCHAR(50) NOT NULL DEFAULT 'Pcs',
      stok_minimal INT NOT NULL DEFAULT 0,
      pemasok VARCHAR(200) NULL,
      harga_per_unit_rp BIGINT NOT NULL DEFAULT 0,
      status_stok ENUM('Stok Cukup', 'Stok Menipis', 'Habis') NOT NULL DEFAULT 'Stok Cukup',
      extra_data LONGTEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✓ Tabel "packaging_materials" siap.');

  // Auto-migrasi: pastikan kolom extra_data ada (untuk tabel lama)
  try {
    const [pCols] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'packaging_materials' AND COLUMN_NAME = 'extra_data'`
    );
    if (pCols.length === 0) {
      await pool.query(`ALTER TABLE packaging_materials ADD COLUMN extra_data LONGTEXT NULL`);
      console.log('✓ Kolom "packaging_materials.extra_data" ditambahkan.');
    }
  } catch (extraErr) {
    console.warn('⚠ Migrasi extra_data kemasan dilewati:', extraErr.message);
  }

  // Seed kemasan awal
  const [pkCount] = await pool.query('SELECT COUNT(*) AS total FROM packaging_materials');
  if (Number(pkCount[0].total) === 0) {
    // Placeholder foto (data URL base64 1x1 transparan) supaya semua data dummy punya foto
    const dummyFoto =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const seedPackaging = [
      { kode: 'KMG-001', nama: 'Standing Pouch Alufoil Ziplock Valve 500g', kategori: 'Standing Pouch', kapasitas: '500 gram', stok: 4200, satuan: 'Pcs', min: 1000, pemasok: 'PT Kemasan Mulia Jaya Yogyakarta', harga: 1850, status: 'Stok Cukup' },
      { kode: 'KMG-002', nama: 'Standing Pouch Window Craft Paper 250g', kategori: 'Standing Pouch', kapasitas: '250 gram', stok: 650, satuan: 'Pcs', min: 1000, pemasok: 'PT Kemasan Mulia Jaya Yogyakarta', harga: 1400, status: 'Stok Menipis' },
      { kode: 'KMG-003', nama: 'Box Duplex Custom Printing Rengginang 150g', kategori: 'Box Custom', kapasitas: '150 gram', stok: 2800, satuan: 'Pcs', min: 500, pemasok: 'CV Cetak Offset Nusantara', harga: 2200, status: 'Stok Cukup' },
      { kode: 'KMG-004', nama: 'Botol Kaca Marasca 350ml Tutup Segel Aluminium', kategori: 'Botol Kaca', kapasitas: '350 ml', stok: 0, satuan: 'Botol', min: 300, pemasok: 'PT Glassindo Industri Indonesia', harga: 4500, status: 'Habis' },
      { kode: 'KMG-005', nama: 'Karung Woven PP Food Grade 25kg Laminated', kategori: 'Karung Bulk', kapasitas: '25 kg', stok: 1500, satuan: 'Karung', min: 300, pemasok: 'PT Karung Jaya Plastindo', harga: 3500, status: 'Stok Cukup' },
    ];
    for (const row of seedPackaging) {
      await pool.execute(
        `INSERT INTO packaging_materials
          (kode_kemasan, nama_kemasan, kategori, kapasitas, stok_tersedia, satuan,
           stok_minimal, pemasok, harga_per_unit_rp, status_stok, extra_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.kode, row.nama, row.kategori, row.kapasitas, row.stok, row.satuan,
         row.min, row.pemasok, row.harga, row.status,
         JSON.stringify({ komposisi: '', nilaiGizi: {}, akg: [], riwayat: [], imageDataUrl: dummyFoto })]
      );
    }
    console.log(`✓ Seed kemasan: ${seedPackaging.length} baris dimasukkan.`);
  }

  // Auto-migrasi data lama: kode lama (KMG-POUCH-500, dll) → format KMG-00x
  // + isi extra_data.imageDataUrl placeholder supaya semua punya foto.
  try {
    const dummyFoto =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const [legacyRows] = await pool.execute(
      `SELECT id, kode_kemasan FROM packaging_materials
       WHERE kode_kemasan NOT REGEXP '^KMG-[0-9]{3}$'`
    );
    let nextSeq = 6; // lanjut dari seed KMG-001..005
    // Cari MAX KMG-xxx yang sudah ada untuk menghindari tabrakan
    const [allCodes] = await pool.execute(
      `SELECT kode_kemasan FROM packaging_materials WHERE kode_kemasan REGEXP '^KMG-[0-9]{3}$'`
    );
    for (const c of allCodes) {
      const m = String(c.kode_kemasan).match(/^KMG-(\d{3})$/);
      if (m) nextSeq = Math.max(nextSeq, parseInt(m[1], 10) + 1);
    }
    for (const row of legacyRows) {
      const newCode = `KMG-${String(nextSeq).padStart(3, '0')}`;
      nextSeq += 1;
      // Ambil extra_data lama kalau ada, lalu pastikan imageDataUrl terisi
      const [ex] = await pool.execute(
        'SELECT extra_data FROM packaging_materials WHERE id = ? LIMIT 1',
        [row.id]
      );
      let extra = {};
      if (ex[0]?.extra_data) {
        try { extra = JSON.parse(ex[0].extra_data); } catch { extra = {}; }
      }
      if (!extra.imageDataUrl) extra.imageDataUrl = dummyFoto;
      await pool.execute(
        'UPDATE packaging_materials SET kode_kemasan = ?, extra_data = ? WHERE id = ?',
        [newCode, JSON.stringify(extra), row.id]
      );
    }
    if (legacyRows.length > 0) {
      console.log(`✓ Migrasi kemasan: ${legacyRows.length} baris lama disesuaikan (kode + foto).`);
    }
  } catch (migrateErr) {
    console.warn('⚠ Migrasi data kemasan lama dilewati:', migrateErr.message);
  }

  // Auto-migrasi: tabel logistics_expenses (logistik & keuangan)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS logistics_expenses (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      kode_transaksi VARCHAR(50) NOT NULL UNIQUE,
      tanggal VARCHAR(50) NULL,
      kategori ENUM('Bahan Baku', 'Transportasi', 'Operasional', 'Kemasan', 'Perawatan Peralatan', 'Sertifikasi') NOT NULL DEFAULT 'Operasional',
      keterangan_vendor VARCHAR(255) NULL,
      total_biaya_rp BIGINT NOT NULL DEFAULT 0,
      status_pembayaran ENUM('LUNAS', 'PENDING', 'DIBATALKAN') NOT NULL DEFAULT 'LUNAS',
      metode_pembayaran ENUM('Transfer Bank', 'Kas Tunai', 'E-Wallet', 'Giro') NOT NULL DEFAULT 'Kas Tunai',
      nomor_nota_receipt VARCHAR(100) NULL,
      catatan_nota TEXT NULL,
      detail_item JSON NULL,
      nota_url LONGTEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✓ Tabel "logistics_expenses" siap.');

  // Seed logistik awal
  const [lCount2] = await pool.query('SELECT COUNT(*) AS total FROM logistics_expenses');
  if (Number(lCount2[0].total) === 0) {
    const seedExpenses = [
      ['LOG-TRX-001', '14 Mei 2026', 'Bahan Baku', 'Beli Pupuk Organik / CV BioTech Agriculture', 3500000, 'LUNAS', 'Transfer Bank', 'INV/BIOTECH/2026/05/112', 'Pembelian 50 karung pupuk kompos organik terverifikasi SNI.', JSON.stringify([{ nama: 'Pupuk Kompos Granul Organik 25kg', qty: 40, hargaSatuan: 70000 }, { nama: 'Pupuk Hayati Cair Bio-Activator 5L', qty: 7, hargaSatuan: 100000 }]), 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'],
      ['LOG-TRX-002', '12 Mei 2026', 'Transportasi', 'Sewa Truk Distribusi Hasil Panen / Jasa Angkut Sleman', 1200000, 'PENDING', 'Transfer Bank', 'NOTA-JSA-8812', 'Pengangkutan 4.5 ton hasil panen sorgum basah dari Lahan A ke Rumah Pengeringan.', JSON.stringify([{ nama: 'Jasa Sewa Truk Colt Diesel 6-Roda', qty: 1, hargaSatuan: 1000000 }, { nama: 'Biaya Bongkar Muat Tenaga Kerja', qty: 4, hargaSatuan: 50000 }]), 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=600&q=80'],
      ['LOG-TRX-003', '10 Mei 2026', 'Operasional', 'Perbaikan Alat Semprot Hama / Bengkel Tani Makmur', 450000, 'LUNAS', 'Kas Tunai', 'KW-BKL-0921', 'Ganti selang fleksibel & nozzle kuningan sprayer elektrik S-002.', JSON.stringify([{ nama: 'Nozzle Kuningan Precision High Spray', qty: 2, hargaSatuan: 125000 }, { nama: 'Selang High Pressure 10 Meter', qty: 1, hargaSatuan: 100000 }, { nama: 'Ongkos Jasa Servis Mechanic', qty: 1, hargaSatuan: 100000 }]), 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80'],
      ['LOG-TRX-004', '04 Mei 2026', 'Kemasan', 'Pembelian Standing Pouch & Box Kemasan / PT Kemasan Mulia Jaya', 2750000, 'LUNAS', 'Transfer Bank', 'INV/KMJ/2026/05/089', 'Pembelian 1.000 pcs standing pouch 500g + 500 box duplex custom.', JSON.stringify([{ nama: 'Standing Pouch Alufoil 500g', qty: 1000, hargaSatuan: 1850 }, { nama: 'Box Duplex Custom 150g', qty: 500, hargaSatuan: 2200 }]), 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'],
    ];
    for (const row of seedExpenses) {
      await pool.execute(
        `INSERT INTO logistics_expenses
          (kode_transaksi, tanggal, kategori, keterangan_vendor, total_biaya_rp,
           status_pembayaran, metode_pembayaran, nomor_nota_receipt, catatan_nota,
           detail_item, nota_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }
    console.log(`✓ Seed logistik: ${seedExpenses.length} baris dimasukkan.`);
  }

  // Auto-migrasi: tabel notifications (notifikasi operasional)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      judul VARCHAR(200) NOT NULL,
      pesan TEXT NOT NULL,
      kategori ENUM('sertifikat', 'panen', 'produksi', 'logistik', 'sistem') NOT NULL DEFAULT 'sistem',
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✓ Tabel "notifications" siap.');

  // Seed notifikasi awal
  const [nCount] = await pool.query('SELECT COUNT(*) AS total FROM notifications');
  if (Number(nCount[0].total) === 0) {
    const seedNotif = [
      ['Sertifikat Halal Diperbarui', 'BPJPH No. ID31110001294812 berstatus AKTIF.', 'sertifikat', 0],
      ['Pencatatan Panen Sektor C', 'Hasil panen 1.850 kg sorgum varietas Bioguma berhasil diinput.', 'panen', 0],
      ['Stok Kemasan Menipis', 'Standing Pouch Window 250g tersisa 650 pcs, di bawah stok minimal 1000.', 'logistik', 0],
    ];
    for (const row of seedNotif) {
      await pool.execute(
        `INSERT INTO notifications (judul, pesan, kategori, is_read) VALUES (?, ?, ?, ?)`,
        row
      );
    }
    console.log(`✓ Seed notifikasi: ${seedNotif.length} baris dimasukkan.`);
  }

  return pool;
}

/** Mengambil pool koneksi (pastikan initDatabase() sudah dipanggil). */
export function getPool() {
  if (!pool) {
    throw new Error('Database belum diinisialisasi. Panggil initDatabase() terlebih dahulu.');
  }
  return pool;
}

/** Helper: eksekusi query dengan parameter. */
export async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}
