import { getPool } from '../config/db.js';
import { slugNama, tanggalKode } from '../utils/kodeUtil.js';

/**
 * Pengaturan sistem: Kosongkan Data & Isi Data Contoh (seeder).
 *
 * Prinsip "Kosongkan Data":
 *  - Menghapus SEMUA data operasional & master (lahan, tanam, panen, gudang,
 *    sosoh, produksi, varietas, produk, peralatan, sertifikat, kemasan,
 *    logistik, notifikasi).
 *  - MENYIMPAN data login pengguna (`users`) dan konten landing page
 *    (`cms_settings`) agar tetap bisa masuk & website tetap tampil normal.
 */

// Tabel yang dikosongkan (urutan anak → induk; tidak ada FK, tapi tetap logis).
const DATA_TABLES = [
  'warehouse_movements',
  'sosoh_processes',
  'warehouse_stock_batches',
  'production_batches',
  'harvests',
  'plantings',
  'warehouses',
  'lands',
  'equipment',
  'certificates',
  'packaging_materials',
  'logistics_expenses',
  'notifications',
  'varieties',
  'products',
];

// Tabel yang DIPERTAHANKAN saat kosongkan data (login + landing page + kredensial API).
const KEPT_TABLES = ['users', 'cms_settings', 'api_keys'];

// Label ramah untuk ringkasan di UI.
const TABLE_LABEL = {
  warehouse_movements: 'Riwayat gudang',
  sosoh_processes: 'Proses sosoh',
  warehouse_stock_batches: 'Batch stok gudang',
  production_batches: 'Batch produksi (olahan)',
  harvests: 'Data panen',
  plantings: 'Data penanaman',
  warehouses: 'Gudang',
  lands: 'Lahan',
  equipment: 'Sarana & peralatan',
  certificates: 'Sertifikat',
  packaging_materials: 'Data kemasan',
  logistics_expenses: 'Logistik & biaya',
  notifications: 'Notifikasi',
  varieties: 'Master varietas',
  products: 'Master produk olahan',
};

async function countRows(pool, table) {
  try {
    const [r] = await pool.query(`SELECT COUNT(*) AS n FROM ${table}`);
    return Number(r[0].n || 0);
  } catch {
    return null;
  }
}

// ── POST /api/settings/clear-data ──────────────────────────────────────────────
// Kosongkan seluruh data operasional & master, KECUALI users + cms_settings + api_keys.
export async function clearAllData(_req, res) {
  try {
    const pool = getPool();
    const cleared = [];
    const errors = [];

    for (const table of DATA_TABLES) {
      const before = await countRows(pool, table);
      try {
        // TRUNCATE cepat & me-reset AUTO_INCREMENT; fallback DELETE bila tak diizinkan.
        await pool.query(`TRUNCATE TABLE ${table}`);
      } catch (e1) {
        try {
          await pool.query(`DELETE FROM ${table}`);
        } catch (e2) {
          errors.push(`${table}: ${e2.message}`);
          continue;
        }
      }
      cleared.push({ table, label: TABLE_LABEL[table] || table, deleted: before ?? 0 });
    }

    const kept = [];
    for (const table of KEPT_TABLES) {
      kept.push({ table, label: table, kept: await countRows(pool, table) });
    }

    const totalDeleted = cleared.reduce((a, c) => a + c.deleted, 0);
    return res.status(200).json({
      success: true,
      message: errors.length
        ? `Data dikosongkan (${totalDeleted} baris), ${errors.length} tabel dilewati.`
        : `Semua data berhasil dikosongkan (${totalDeleted} baris). Data pengguna & landing page tetap aman.`,
      data: { cleared, kept, totalDeleted, errors },
    });
  } catch (error) {
    console.error('[clearAllData] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengosongkan data.' });
  }
}

// ── POST /api/settings/seed-data ───────────────────────────────────────────────
// Isi data contoh lengkap (seeder) yang saling terhubung & bisa dilacak.
export async function seedDemoData(_req, res) {
  try {
    const pool = getPool();

    // Cegah tumpang tindih: hanya boleh bila data masih kosong.
    const existingLands = await countRows(pool, 'lands');
    if (existingLands && existingLands > 0) {
      return res.status(409).json({
        success: false,
        message: 'Data sudah terisi. Gunakan "Kosongkan Data" dulu sebelum mengisi data contoh.',
      });
    }

    const today = new Date();
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const dt = (d, h = 9) => `${iso(d)} ${String(h).padStart(2, '0')}:00:00`;

    const ins = async (table, obj) => {
      const cols = Object.keys(obj);
      const [r] = await pool.execute(
        `INSERT INTO ${table} (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
        Object.values(obj)
      );
      return r.insertId;
    };

    // Pastikan kode unik (kalau bentrok, tambah -02, -03, …)
    const buatKode = async (table, col, base) => {
      let kode = base;
      let n = 1;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const [r] = await pool.execute(`SELECT id FROM ${table} WHERE ${col} = ? LIMIT 1`, [kode]);
        if (r.length === 0) return kode;
        n += 1;
        kode = `${base}-${String(n).padStart(2, '0')}`;
      }
    };

    const counts = {};
    // Kumpulan gambar demo yang RELEVAN & BERBEDA (disajikan dari /demo/*.webp).
    // Path relatif agar bekerja baik di dev (Vite) maupun produksi (nginx).
    const IMG = {
      // foto lahan sorgum (berbeda-beda per lahan)
      lahan: [
        '/demo/lahan_mexico.webp',
        '/demo/lahan_elsalvador.webp',
        '/demo/lahan_ethiopia.webp',
        '/demo/lahan_mesir.webp',
        '/demo/lahan_panen1.webp',
        '/demo/lahan_siappanen.webp',
      ],
      // foto panen / gabah (bergilir)
      panen: [
        '/demo/panen_1.webp',
        '/demo/panen_2.webp',
        '/demo/panen_3.webp',
        '/demo/panen_4.webp',
        '/demo/sorghum_grain.webp',
      ],
      // foto produk olahan
      produk: {
        'Tepung Sorgum': '/demo/produk_3.webp',
        'Beras Sorgum': '/demo/produk_4.webp',
        'Keripik Sorgum': '/demo/produk_2.webp',
        'Gula Cair Nira Sorgum': '/demo/produk_1.webp',
      },
      biji: '/demo/sorghum_grain.webp',
    };

    // 1) Master varietas (gambar biji sorgum)
    const varieties = [
      ['Sorgum Bioguma 1', 'Varietas unggul Balitbangtan, cocok untuk pangan, umur ±100 hari.', 100],
      ['Sorgum Numbu', 'Varietas lokal adaptif, baik untuk tepung dan pakan.', 95],
      ['Sorgum Suri 4 (Manis)', 'Sorgum manis, batangnya disadap untuk gula cair nira.', 115],
      ['Sorgum Kawali', 'Varietas unggul dengan biji besar, hasil melimpah.', 100],
    ];
    for (const [name, description, lama_panen] of varieties) {
      await ins('varieties', { name, description, image_url: IMG.biji, lama_panen, is_active: 1 });
    }
    counts.varieties = varieties.length;

    // 2) Master produk olahan (gambar sesuai jenis produk)
    const products = [
      ['Tepung Sorgum', 'Pouch', 'Tepung halus dari biji sorgum sosoh.'],
      ['Beras Sorgum', 'Pouch', 'Beras sorgum sosoh siap masak.'],
      ['Keripik Sorgum', 'Pouch', 'Keripik renyah berbahan tepung sorgum.'],
      ['Gula Cair Nira Sorgum', 'Botol', 'Gula cair dari nira batang sorgum manis.'],
    ];
    for (const [name, satuan_hasil, deskripsi] of products) {
      await ins('products', { name, satuan_hasil, deskripsi, foto_url: IMG.produk[name] || IMG.biji, is_active: 1 });
    }
    counts.products = products.length;

    // 3) Lahan + penanaman (beberapa musim tanam) + panen + gudang + stok + sosoh
    // Tiap lahan boleh punya >1 penanaman (musim). Tiap penanaman punya panen
    // ratoon 1..3 — di UI, panen dari penanaman yang sama berwarna sama.
    const landDefs = [
      {
        nama: 'Lahan Blok A', desa: 'Bojongmanggu', kec: 'Bojongmanggu', luas: 1.2,
        varietas: 'Sorgum Bioguma 1', lama: 100, petugas: 'Asep Sunandar', statusKesiapan: 'Masa Panen',
        seasons: [
          { tanamOffset: -390, panenCount: 3, sosohFirst: true },
          { tanamOffset: -170, panenCount: 2, sosohFirst: true },
        ],
      },
      {
        nama: 'Lahan Blok B', desa: 'Lengkong', kec: 'Lengkong', luas: 0.8,
        varietas: 'Sorgum Numbu', lama: 95, petugas: 'Dedi Mulyana', statusKesiapan: 'Masa Panen',
        seasons: [
          { tanamOffset: -300, panenCount: 2, sosohFirst: true },
          { tanamOffset: -110, panenCount: 1, sosohFirst: true },
        ],
      },
      {
        nama: 'Lahan Blok C', desa: 'Padawaas', kec: 'Padawaas', luas: 1.5,
        varietas: 'Sorgum Suri 4 (Manis)', lama: 115, petugas: 'Rina Herawati', statusKesiapan: 'Masa Panen',
        seasons: [
          { tanamOffset: -250, panenCount: 1, sosohFirst: false },
          { tanamOffset: -120, panenCount: 0, sosohFirst: false },
        ],
      },
      {
        nama: 'Lahan Blok D', desa: 'Cikancung', kec: 'Cikancung', luas: 1.0,
        varietas: 'Sorgum Kawali', lama: 100, petugas: 'Bambang Sutrisno', statusKesiapan: 'Masa Pertumbuhan',
        seasons: [
          // Penanaman baru (baru ditanam) → status "Ditanam", sama seperti input manual
          { tanamOffset: -5, panenCount: 0, sosohFirst: false },
        ],
      },
    ];

    counts.lands = 0; counts.plantings = 0; counts.harvests = 0;
    counts.warehouses = 0; counts.stockBatches = 0; counts.sosoh = 0; counts.movements = 0;

    const sorgumBatches = []; // untuk produksi olahan

    for (let li = 0; li < landDefs.length; li += 1) {
      const L = landDefs[li];
      // Gambar berbeda per lahan (bergilir dari daftar)
      const fotoLahan = IMG.lahan[li % IMG.lahan.length];
      const firstTanam = addDays(today, L.seasons[0].tanamOffset);
      const tglDaftar = addDays(firstTanam, -5);
      const kodeLahan = await buatKode('lands', 'kode_lahan', `${slugNama(L.nama)}-${tanggalKode(tglDaftar)}`);
      const lahanId = await ins('lands', {
        kode_lahan: kodeLahan,
        nama_lahan: L.nama,
        lokasi_desa: L.desa,
        kecamatan: L.kec,
        luas_hektar: L.luas,
        varietas_sorgum: L.varietas,
        status_irigasi: 'Irigasi Teknis',
        jenis_tanah: 'Latosol',
        jumlah_lubang: Math.round(L.luas * 16000),
        pemilik_kelompok_tani: 'KWT Sorgum Sejahtera',
        status_kesiapan: L.statusKesiapan,
        status_badge: 'Aktif',
        panen_lalu_ton: 0,
        foto_url: fotoLahan,
        latitude: -6.95 + Math.random() * 0.05,
        longitude: 107.6 + Math.random() * 0.05,
      });
      counts.lands += 1;

      // Gudang untuk lahan ini
      const kodeGudang = await buatKode('warehouses', 'kode_gudang', `GDG-${slugNama(L.nama)}-01`);
      const gudangId = await ins('warehouses', {
        kode_gudang: kodeGudang,
        nama_gudang: `Gudang ${L.nama}`,
        lahan_id: lahanId,
        lokasi: L.desa,
        kapasitas_kg: Math.round(L.luas * 3000),
        total_stok_kg: 0,
      });
      counts.warehouses += 1;

      // Beberapa musim penanaman per lahan
      for (let s = 0; s < L.seasons.length; s += 1) {
        const S = L.seasons[s];
        const musim = s + 1;
        const tglTanam = addDays(today, S.tanamOffset);
        const tglEstimasi = addDays(tglTanam, L.lama);
        const sudahPanen = S.panenCount > 0;
        // Status tanam dihitung dari umur tanam agar konsisten dengan input manual:
        // baru ditanam → "Ditanam"; sedang tumbuh → "Tumbuh"; mendekati/lewat umur → "Siap Panen".
        const umurHari = Math.round((today - tglTanam) / 86400000);
        let statusTanam;
        if (sudahPanen) statusTanam = 'Dipanen';
        else if (umurHari >= L.lama) statusTanam = 'Siap Panen';
        else if (umurHari >= 15) statusTanam = 'Tumbuh';
        else statusTanam = 'Ditanam';
        const kodeTanam = await buatKode('plantings', 'kode_tanam', `${slugNama(L.nama)}-${tanggalKode(tglTanam)}-${String(musim).padStart(2, '0')}`);
        const plantingId = await ins('plantings', {
          kode_tanam: kodeTanam,
          lahan_id: lahanId,
          tanggal_tanam: iso(tglTanam),
          estimasi_panen: iso(tglEstimasi),
          varietas: L.varietas,
          jumlah_lubang: Math.round(L.luas * 16000),
          luas_tanam: L.luas,
          petugas: L.petugas,
          status_tanam: statusTanam,
          catatan: `Musim tanam ke-${musim} (data demo).`,
          foto_url: fotoLahan,
        });
        counts.plantings += 1;

        // Panen 1..N (ratoon) untuk musim ini
        for (let k = 1; k <= S.panenCount; k += 1) {
          const tglPanen = addDays(tglTanam, L.lama + (k - 1) * 45);
          const hasilKg = Math.round(L.luas * 2200) - (k - 1) * Math.round(L.luas * 350);
          const kodePanen = await buatKode('harvests', 'kode_panen', `${slugNama(L.nama)}-${tanggalKode(tglPanen)}-0${k}`);
          const periodeHari = Math.round((tglPanen - tglTanam) / 86400000);
          // Gambar panen berbeda-beda (bergilir)
          const fotoPanen = IMG.panen[(counts.harvests) % IMG.panen.length];
          const hid = await ins('harvests', {
            kode_panen: kodePanen,
            nama_lahan: L.nama,
            varietas: L.varietas,
            tanggal_panen: iso(tglPanen),
            jumlah_hasil_kg: hasilKg,
            kualitas_grade: k === 1 ? 'Grade A (Premium)' : 'Grade B (Standar)',
            petani_penanggung_jawab: L.petugas,
            status: 'Tersimpan di Gudang',
            catatan: `Panen ke-${k}, musim ${musim} (data demo).`,
            foto_url: fotoPanen,
            panen_ke: k,
            persen_hama: k === 1 ? 3.5 : 6,
            jenis_hama: k === 1 ? 'Burung' : 'Ulat grayak',
            lahan_id: lahanId,
            planting_id: plantingId,
            periode_hari: periodeHari,
          });
          counts.harvests += 1;

          // Stok masuk (GABAH) — seluruh hasil panen
          const kodeBatchGabah = await buatKode('warehouse_stock_batches', 'kode_batch_stok', `GAB-${kodePanen}`);
          const sbId = await ins('warehouse_stock_batches', {
            gudang_id: gudangId,
            harvest_id: hid,
            kode_batch_stok: kodeBatchGabah,
            jumlah_masuk_kg: hasilKg,
            sisa_kg: hasilKg,
            tanggal_masuk: dt(addDays(tglPanen, 1), 8),
            jenis: 'GABAH',
          });
          counts.stockBatches += 1;
          await ins('warehouse_movements', {
            gudang_id: gudangId,
            tipe: 'MASUK',
            jumlah_kg: hasilKg,
            keterangan: `Hasil panen ${kodePanen}`,
            harvest_id: hid,
            stock_batch_id: sbId,
          });
          counts.movements += 1;

          // Sosoh panen pertama musim ini → SORGUM
          if (S.sosohFirst && k === 1) {
            const kgGabah = Math.round(hasilKg * 0.7);
            const kgHasil = Math.round(kgGabah * 0.65);
            const kodeBatchSorgum = await buatKode('warehouse_stock_batches', 'kode_batch_stok', `SRG-${kodePanen}`);
            const sbSorgumId = await ins('warehouse_stock_batches', {
              gudang_id: gudangId,
              harvest_id: hid,
              kode_batch_stok: kodeBatchSorgum,
              jumlah_masuk_kg: kgHasil,
              sisa_kg: kgHasil,
              tanggal_masuk: dt(addDays(tglPanen, 3), 10),
              jenis: 'SORGUM',
              asal_batch_id: sbId,
              tanggal_sosoh: dt(addDays(tglPanen, 3), 10),
              operator_sosoh: L.petugas,
            });
            counts.stockBatches += 1;
            // Kurangi batch gabah
            await pool.execute('UPDATE warehouse_stock_batches SET sisa_kg = sisa_kg - ? WHERE id = ?', [kgGabah, sbId]);
            const rendemen = Math.round((kgHasil / kgGabah) * 1000) / 10;
            const kodeSosoh = await buatKode('sosoh_processes', 'kode_sosoh', `SOS-${String(counts.sosoh + 1).padStart(3, '0')}`);
            await ins('sosoh_processes', {
              kode_sosoh: kodeSosoh,
              gudang_id: gudangId,
              batch_gabah_id: sbId,
              batch_sorgum_id: sbSorgumId,
              kg_gabah_dipakai: kgGabah,
              kg_sorgum_hasil: kgHasil,
              rendemen_persen: rendemen,
              operator: L.petugas,
              keterangan: `Sosoh musim ${musim} (data demo).`,
            });
            counts.sosoh += 1;
            await ins('warehouse_movements', {
              gudang_id: gudangId, tipe: 'KELUAR', jumlah_kg: kgGabah,
              keterangan: `Gabah ${kodeBatchGabah} disosoh menjadi ${kodeBatchSorgum}`,
              stock_batch_id: sbId, harvest_id: hid,
            });
            await ins('warehouse_movements', {
              gudang_id: gudangId, tipe: 'MASUK', jumlah_kg: kgHasil,
              keterangan: `Hasil sosoh ${kodeBatchGabah} → ${kodeBatchSorgum}`,
              stock_batch_id: sbSorgumId, harvest_id: hid,
            });
            counts.movements += 2;

            sorgumBatches.push({
              id: sbSorgumId, gudangId, lahanId, plantingId, harvestId: hid,
              kodePanen, kodeBatch: kodeBatchSorgum, namaLahan: L.nama, varietas: L.varietas, tglPanen, kg: kgHasil,
            });
          }
        }
      }
    }

    // 4) Produksi olahan dari batch SORGUM
    counts.production = 0;
    const produksiDefs = [
      { produk: 'Beras Sorgum', satuan: 'Pouch', perKg: 2, tanggalOffset: -60 },
      { produk: 'Tepung Sorgum', satuan: 'Pouch', perKg: 2.5, tanggalOffset: -45 },
      { produk: 'Keripik Sorgum', satuan: 'Pouch', perKg: 3, tanggalOffset: -30 },
      { produk: 'Beras Sorgum', satuan: 'Pouch', perKg: 2, tanggalOffset: -15 },
      { produk: 'Gula Cair Nira Sorgum', satuan: 'Botol', perKg: 1.5, tanggalOffset: -7 },
    ];
    for (let i = 0; i < Math.min(produksiDefs.length, sorgumBatches.length); i += 1) {
      const P = produksiDefs[i];
      const B = sorgumBatches[i];
      const qtyBahan = Math.min(B.kg, Math.round(B.kg * 0.5));
      const jumlahHasil = Math.round(qtyBahan * P.perKg);
      const tglProduksi = addDays(today, P.tanggalOffset);
      const kodeBatch = await buatKode('production_batches', 'kode_batch', `PRD-${slugNama(B.namaLahan)}-${tanggalKode(tglProduksi)}-0${i + 1}`);
      const [pr] = await pool.execute(
        `SELECT id, satuan_hasil FROM products WHERE name = ? LIMIT 1`, [P.produk]
      );
      const productId = pr[0]?.id || null;
      const pid = await ins('production_batches', {
        kode_batch: kodeBatch,
        nama_produk: P.produk,
        product_id: productId,
        kategori: 'Siap Konsumsi (Ready to Eat)',
        tanggal_produksi: iso(tglProduksi),
        tanggal_kadaluarsa: iso(addDays(tglProduksi, 180)),
        jumlah_hasil: jumlahHasil,
        satuan: P.satuan,
        bahan_digunakan: qtyBahan,
        satuan_bahan: 'Kg',
        nomor_batch_bahan_baku: B.kodeBatch,
        operator_produksi: 'Tim Produksi KWT',
        status_qc: 'Lolos QC',
        lokasi_gudang: B.namaLahan,
        lahan_id: B.lahanId,
        planting_id: B.plantingId,
        harvest_id: B.harvestId,
        gudang_id: B.gudangId,
        stock_batch_id: B.id,
      });
      counts.production += 1;
      await pool.execute('UPDATE warehouse_stock_batches SET sisa_kg = sisa_kg - ? WHERE id = ?', [qtyBahan, B.id]);
      await ins('warehouse_movements', {
        gudang_id: B.gudangId, tipe: 'KELUAR', jumlah_kg: qtyBahan,
        keterangan: `Dipakai batch ${kodeBatch}`, production_id: pid,
        stock_batch_id: B.id, harvest_id: B.harvestId,
      });
      counts.movements += 1;
    }

    // 5) Sarana & peralatan
    const equipments = [
      ['Mesin Perontok Sorgum', 'Pascapanen', 1, 'Baik', 'Tersedia', 'Gudang Utama'],
      ['Mesin Sosoh / Huller', 'Pengolahan', 1, 'Sangat Baik', 'Tersedia', 'Gudang Utama'],
      ['Mesin Penepung (Disk Mill)', 'Pengolahan', 1, 'Baik', 'Tersedia', 'Gudang Utama'],
      ['Terpal Jemur', 'Pascapanen', 10, 'Baik', 'Tersedia', 'Gudang Utama'],
      ['Alat Semprot Hama', 'Budidaya', 4, 'Perlu Perbaikan', 'Dalam Perawatan', 'Gudang Peralatan'],
    ];
    for (let i = 0; i < equipments.length; i += 1) {
      const [nama, kategori, stok, kondisi, status, lokasi] = equipments[i];
      await ins('equipment', {
        kode_alat: `ALT-${String(i + 1).padStart(2, '0')}`,
        nama_peralatan: nama,
        kategori,
        jumlah_stok: stok,
        kondisi,
        status,
        lokasi_penyimpanan: lokasi,
        tanggal_pengadaan: iso(addDays(today, -400 + i * 20)),
        spesifikasi: 'Unit contoh (data demo).',
        terakhir_servis: iso(addDays(today, -30)),
        foto_url: IMG.lahan[i % IMG.lahan.length],
      });
    }
    counts.equipment = equipments.length;

    // 6) Sertifikat
    const certs = [
      ['Sertifikat Halal', 'BPJPH', 'ID-0001-2026', 'Sertifikat Halal', 'AKTIF', -200, 700],
      ['Izin P-IRT', 'Dinas Kesehatan', 'P-IRT-2026-001', 'Izin P-IRT', 'AKTIF', -150, 900],
      ['Uji Lab Nutrisi', 'Lab Universitas', 'LAB-2026-045', 'Uji Lab Nutrisi', 'PROSES', -60, 300],
    ];
    for (let i = 0; i < certs.length; i += 1) {
      const [nama, penerbit, nomor, jenis, status, terbitOff, kadaluarsaOff] = certs[i];
      await ins('certificates', {
        kode_dokumen: `DOK-${String(i + 1).padStart(2, '0')}`,
        nama_sertifikat: nama,
        penerbit_sertifikat: penerbit,
        nomor_sertifikat: nomor,
        tanggal_terbit: iso(addDays(today, terbitOff)),
        tanggal_kadaluarsa: iso(addDays(today, kadaluarsaOff)),
        status,
        jenis_dokumen: jenis,
        file_type: 'pdf',
        keterangan: 'Dokumen contoh (data demo).',
      });
    }
    counts.certificates = certs.length;

    // 7) Data kemasan
    const packs = [
      ['Standing Pouch 500g', 'Standing Pouch', '500 gram', 2000, 200, 'CV Kemas Jaya', 1500, 'Stok Cukup'],
      ['Standing Pouch 1kg', 'Standing Pouch', '1 kg', 1200, 200, 'CV Kemas Jaya', 2200, 'Stok Cukup'],
      ['Botol Kaca 250ml', 'Botol Kaca', '250 ml', 300, 100, 'PT Gelas Nusantara', 4500, 'Stok Menipis'],
      ['Box Custom Olahan', 'Box Custom', '20x15x8 cm', 500, 150, 'Percetakan Sinar', 3200, 'Stok Cukup'],
    ];
    for (let i = 0; i < packs.length; i += 1) {
      const [nama, kategori, kapasitas, stok, minimal, pemasok, harga, status] = packs[i];
      await ins('packaging_materials', {
        kode_kemasan: `PKG-${String(i + 1).padStart(2, '0')}`,
        nama_kemasan: nama,
        kategori,
        kapasitas,
        stok_tersedia: stok,
        satuan: 'Pcs',
        stok_minimal: minimal,
        pemasok,
        harga_per_unit_rp: harga,
        status_stok: status,
      });
    }
    counts.packaging = packs.length;

    // 8) Logistik & biaya
    const logis = [
      ['Bahan Baku', 'Pembelian bahan pendukung produksi', 1500000, 'LUNAS', 'Transfer Bank', -30],
      ['Transportasi', 'Distribusi produk ke pasar', 450000, 'LUNAS', 'Kas Tunai', -20],
      ['Kemasan', 'Pembelian standing pouch', 900000, 'PENDING', 'E-Wallet', -10],
      ['Operasional', 'Listrik & air produksi', 300000, 'LUNAS', 'Kas Tunai', -5],
    ];
    for (let i = 0; i < logis.length; i += 1) {
      const [kategori, ket, biaya, status, metode, off] = logis[i];
      await ins('logistics_expenses', {
        kode_transaksi: `TRX-${String(i + 1).padStart(2, '0')}`,
        tanggal: iso(addDays(today, off)),
        kategori,
        keterangan_vendor: ket,
        total_biaya_rp: biaya,
        status_pembayaran: status,
        metode_pembayaran: metode,
        nomor_nota_receipt: `NOTA-${String(i + 1).padStart(3, '0')}`,
      });
    }
    counts.logistics = logis.length;

    // 9) Notifikasi
    const notifs = [
      ['Panen tercatat', 'Panen baru telah dicatat pada Lahan Blok A.', 'panen'],
      ['Produksi selesai', 'Batch olahan Keripik Sorgum telah lolos QC.', 'produksi'],
      ['Sertifikat akan kadaluarsa', 'Izin P-IRT akan kadaluarsa dalam 90 hari.', 'sertifikat'],
      ['Stok kemasan menipis', 'Botol Kaca 250ml tersisa sedikit.', 'sistem'],
    ];
    for (const [judul, pesan, kategori] of notifs) {
      await ins('notifications', { judul, pesan, kategori, is_read: 0 });
    }
    counts.notifications = notifs.length;

    // 10) Sinkronkan total stok tiap gudang dari batch (biar konsisten)
    await pool.query(
      `UPDATE warehouses w
       SET total_stok_kg = COALESCE((SELECT SUM(sb.sisa_kg) FROM warehouse_stock_batches sb WHERE sb.gudang_id = w.id), 0)`
    );

    return res.status(201).json({
      success: true,
      message: 'Data contoh berhasil diisi. Silakan jelajahi menu Lahan, Panen, Gudang, dan Olahan.',
      data: { counts },
    });
  } catch (error) {
    console.error('[seedDemoData] Error:', error.message);
    return res.status(500).json({ success: false, message: `Gagal mengisi data contoh: ${error.message}` });
  }
}
