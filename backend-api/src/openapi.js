/**
 * OpenAPI 3.0 Specification untuk Sorgum SCM API.
 * Ditampilkan via Scalar di endpoint /api/docs.
 *
 * PENTING: file ini harus selalu sesuai dengan routes/ & controllers/.
 * Setiap menambah/mengubah endpoint atau field respons, perbarui juga di sini.
 */

// ── Helper penyusun spesifikasi (agar konsisten & ringkas) ───────────────────
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const READ = [{ bearerAuth: [] }, { apiKey: [] }]; // GET: JWT atau API key
const WRITE = [{ bearerAuth: [] }];               // tulis: wajib JWT
const idParam = (name = 'id', desc = 'ID data') => ({ name, in: 'path', required: true, schema: { type: 'string' }, description: desc });
const q = (name, schema, description) => ({ name, in: 'query', schema, ...(description ? { description } : {}) });
const pageParams = [
  q('page', { type: 'integer', default: 1 }),
  q('limit', { type: 'integer', default: 10, maximum: 100 }, 'Maksimal 100 per halaman'),
  q('search', { type: 'string' }, 'Kata kunci pencarian'),
];
const json = (schema, example) => ({ 'application/json': { schema, ...(example ? { example } : {}) } });
const body = (schema, required = true) => ({ required, content: json(schema) });
const ok = (schema, description = 'Berhasil') => ({
  description,
  content: json({ allOf: [ref('ApiResponse'), { type: 'object', properties: { data: schema } }] }),
});
const okList = (item, description = 'Daftar data + pagination') => ({
  description,
  content: json({
    allOf: [ref('ApiResponse'), { type: 'object', properties: { data: { type: 'array', items: item }, pagination: ref('Pagination') } }],
  }),
});
const okArray = (item, description = 'Daftar data') => ({
  description,
  content: json({ allOf: [ref('ApiResponse'), { type: 'object', properties: { data: { type: 'array', items: item } } }] }),
});
const err = (description) => ({ description, content: json(ref('ErrorResponse')) });
const E400 = err('Validasi gagal (pesan menjelaskan penyebabnya)');
const E401 = err('Butuh autentikasi (JWT / API key)');
const E401W = err('Wajib JWT Bearer (API key hanya untuk baca)');
const E404 = err('Data tidak ditemukan');
const E409 = err('Konflik data (duplikat / stok sudah terpakai)');

/** CRUD standar: list + detail (baca) & create/update/delete (tulis). */
function crud({ base, tag, label, item, input, listParams = pageParams, list = 'paged', noDetail = false }) {
  const paths = {};
  paths[base] = {
    get: {
      security: READ, tags: [tag], summary: `Daftar ${label}`,
      parameters: listParams,
      responses: { 200: list === 'paged' ? okList(item) : okArray(item), 401: E401 },
    },
    post: {
      security: WRITE, tags: [tag], summary: `Tambah ${label}`,
      requestBody: body(input),
      responses: { 201: ok(item, 'Data dibuat'), 400: E400, 401: E401W, 409: E409 },
    },
  };
  paths[`${base}/{id}`] = {
    ...(noDetail ? {} : {
      get: { security: READ, tags: [tag], summary: `Detail ${label}`, parameters: [idParam()], responses: { 200: ok(item), 401: E401, 404: E404 } },
    }),
    put: {
      security: WRITE, tags: [tag], summary: `Perbarui ${label} (kirim hanya field yang diubah)`,
      parameters: [idParam()], requestBody: body(input),
      responses: { 200: ok(item, 'Data diperbarui'), 400: E400, 401: E401W, 404: E404, 409: E409 },
    },
    delete: {
      security: WRITE, tags: [tag], summary: `Hapus ${label}`,
      parameters: [idParam()],
      responses: { 200: { description: 'Data dihapus' }, 401: E401W, 404: E404, 409: E409 },
    },
  };
  return paths;
}

const tanggal = (example = '2026-10-21') => ({ type: 'string', format: 'date', example, description: 'Format YYYY-MM-DD (DD/MM/YYYY juga diterima)' });
const nullableStr = { type: 'string', nullable: true };

// ── Spesifikasi ──────────────────────────────────────────────────────────────
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Sorgum SCM API',
    version: '1.1.0',
    description:
      'Dokumentasi API **Sistem Manajemen Rantai Pasok Sorgum** (Kelompok Wanita Tani).\n\n' +
      'Semua data di aplikasi (lahan, penanaman, panen, gudang & stok, sosoh, olahan, peralatan, sertifikat, kemasan, keuangan, notifikasi, konten web) bisa diambil lewat API ini.\n\n' +
      '## Autentikasi\n' +
      '- **Baca (GET)** — JWT Bearer **atau** API key di header `x-api-key: <kunci>`.\n' +
      '- **Tulis (POST/PUT/DELETE)** — wajib JWT `Authorization: Bearer <token>` dari `POST /auth/login`.\n' +
      '- API key dibuat lewat `POST /keys` (butuh JWT) atau env `API_KEYS` di server.\n\n' +
      '## Format\n' +
      '- Respons: `{ success, message?, data?, pagination? }`. Error: `{ success: false, message }`.\n' +
      '- Tanggal dikirim & diterima sebagai `YYYY-MM-DD` (input `DD/MM/YYYY` juga dibaca benar). Waktu memakai WIB.\n' +
      '- ID dikirim sebagai string. Gambar/berkas = data URL base64.\n' +
      '- List memakai `?page` & `?limit` (maks 100).\n\n' +
      '## Aturan data penting\n' +
      '- Satu penanaman maksimal **3 kali panen** (`panenKe` 1–3). Tanggal panen tidak boleh sebelum tanggal tanam & harus urut.\n' +
      '- Stok gudang: panen masuk sebagai **GABAH**, disosoh menjadi **SORGUM**, SORGUM dipakai untuk olahan. Stok tidak bisa minus.\n' +
      '- Stok panen yang sudah disosoh/dipakai olahan tidak bisa diubah/dihapus lewat panen (respons 409).\n' +
      '- Mengubah/menghapus olahan otomatis menyesuaikan/mengembalikan stok bahan.\n\n' +
      '## QR Code\n' +
      '- Batch stok & olahan punya `traceUrl` (halaman lacak) dan `qrUrl` (gambar QR) di respons API.\n' +
      '- Kemasan punya `publicUrl` (halaman produk) dan `qrUrl`. Kemasan dihubungkan ke produk lewat `productId`.\n' +
      '- Gambar QR publik: `GET /public/qr/trace/{kodeBatchStok}` dan `GET /public/qr/kemasan/{kodeKemasan}` (`?format=png|svg&size=512`).\n\n' +
      '## Server\n' +
      '- Utama (data asli): `https://scm.livinglabs.id/api`\n' +
      '- Demo (data contoh): `https://scm1.livinglabs.id/api`\n' +
      '- Lokal: `http://localhost:8000/api`',
    contact: { name: 'Sorgum SCM' },
  },
  servers: [
    { url: 'https://scm.livinglabs.id/api', description: 'Utama (data asli)' },
    { url: 'https://scm1.livinglabs.id/api', description: 'Demo (data contoh)' },
    { url: 'http://localhost:8000/api', description: 'Lokal (development)' },
  ],
  tags: [
    { name: 'Kesehatan', description: 'Cek status server' },
    { name: 'Autentikasi', description: 'Login, daftar, profil, ganti sandi' },
    { name: 'API Key', description: 'Kunci API read-only untuk akses dari luar' },
    { name: 'Lahan', description: 'Blok lahan' },
    { name: 'Penanaman', description: 'Musim tanam per lahan' },
    { name: 'Panen', description: 'Hasil panen (maks 3x per penanaman)' },
    { name: 'Gudang', description: 'Gudang, batch stok (gabah/sorgum), stok masuk/keluar, sosoh, riwayat & lacak' },
    { name: 'Produksi', description: 'Batch produk olahan' },
    { name: 'Produk Olahan', description: 'Master produk olahan' },
    { name: 'Varietas', description: 'Master varietas sorgum' },
    { name: 'Peralatan', description: 'Sarana & peralatan' },
    { name: 'Sertifikat', description: 'Dokumen sertifikat & perizinan' },
    { name: 'Kemasan', description: 'Stok bahan kemasan' },
    { name: 'Keuangan', description: 'Catatan pengeluaran (menu Keuangan)' },
    { name: 'Notifikasi', description: 'Notifikasi sistem' },
    { name: 'CMS', description: 'Konten landing page & pengaturan aplikasi' },
    { name: 'Pengaturan Data', description: 'Kosongkan / isi data contoh' },
    { name: 'Publik', description: 'Tanpa autentikasi (halaman lacak QR)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token dari POST /auth/login' },
      apiKey: { type: 'apiKey', in: 'header', name: 'x-api-key', description: 'API key read-only (env API_KEYS atau dikelola di /keys)' },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Berhasil.' },
          data: {},
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Tanggal panen tidak boleh sebelum tanggal tanam (2026-10-07).' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' },
          totalPages: { type: 'integer' }, hasNext: { type: 'boolean' }, hasPrev: { type: 'boolean' },
        },
      },

      // ── Pengguna ──
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' },
          role: { type: 'string', example: 'Admin KWT' }, avatar: nullableStr, jabatan: { type: 'string' },
          namaKWT: { type: 'string' }, alamat: { type: 'string' }, kecamatan: { type: 'string' },
          kabupaten: { type: 'string' }, bio: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ProfileInput: {
        type: 'object',
        properties: {
          name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, jabatan: { type: 'string' },
          namaKWT: { type: 'string' }, alamat: { type: 'string' }, kecamatan: { type: 'string' }, kabupaten: { type: 'string' },
          bio: { type: 'string' }, avatar: { type: 'string', description: 'Data URL JPG/PNG/WebP, maks 2 MB' },
        },
      },
      ApiKey: {
        type: 'object',
        properties: {
          id: { type: 'string' }, nama: { type: 'string' }, keyPreview: { type: 'string', example: 'sk-sorgum-ab...9f3c' },
          isActive: { type: 'boolean' }, lastUsedAt: nullableStr, createdAt: { type: 'string' }, revokedAt: nullableStr,
        },
      },

      // ── Lahan & penanaman ──
      LandPlot: {
        type: 'object',
        properties: {
          id: { type: 'string' }, kodeLahan: { type: 'string', example: 'BAS-07102026' }, namaLahan: { type: 'string' },
          lokasiDesa: { type: 'string' }, kecamatan: { type: 'string' }, luasHektar: { type: 'number' },
          varietasSorgum: { type: 'string' }, statusIrigasi: { type: 'string', enum: ['Irigasi Teknis', 'Tadah Hujan', 'Semi Teknis'] },
          jenisTanah: { type: 'string' }, jumlahLubang: { type: 'integer' }, pemilikKelompokTani: { type: 'string' },
          statusKesiapan: { type: 'string', enum: ['Siap Tanam', 'Masa Pertumbuhan', 'Masa Panen', 'Bera (Istirahat)'] },
          statusBadge: { type: 'string' }, panenLaluTon: { type: 'number' }, fotoUrl: { type: 'string' },
          latitude: { type: 'number', nullable: true }, longitude: { type: 'number', nullable: true }, createdAt: { type: 'string' },
        },
      },
      LandInput: {
        type: 'object',
        required: ['namaLahan', 'lokasiDesa', 'kecamatan', 'luasHektar', 'fotoUrl'],
        properties: {
          kodeLahan: { type: 'string', description: 'Otomatis jika kosong' }, namaLahan: { type: 'string', description: 'Unik (tidak peka huruf besar/kecil)' },
          lokasiDesa: { type: 'string' }, kecamatan: { type: 'string' }, luasHektar: { type: 'number', example: 0.5 },
          varietasSorgum: { type: 'string' }, statusIrigasi: { type: 'string', enum: ['Irigasi Teknis', 'Tadah Hujan', 'Semi Teknis'] },
          jenisTanah: { type: 'string' }, jumlahLubang: { type: 'integer' }, pemilikKelompokTani: { type: 'string' },
          statusKesiapan: { type: 'string', enum: ['Siap Tanam', 'Masa Pertumbuhan', 'Masa Panen', 'Bera (Istirahat)'] },
          statusBadge: { type: 'string' }, panenLaluTon: { type: 'number' }, fotoUrl: { type: 'string', description: 'Data URL base64 (wajib saat tambah)' },
          latitude: { type: 'number' }, longitude: { type: 'number' },
        },
      },
      Planting: {
        type: 'object',
        properties: {
          id: { type: 'string' }, kodeTanam: { type: 'string' }, lahanId: { type: 'string' }, kodeLahan: { type: 'string' },
          namaLahan: { type: 'string' }, tanggalTanam: tanggal('2026-10-07'), estimasiPanen: { ...tanggal('2027-01-15'), nullable: true },
          varietas: { type: 'string' }, jumlahLubang: { type: 'integer' }, luasTanam: { type: 'number', nullable: true },
          petugas: { type: 'string' }, statusTanam: { type: 'string', enum: ['Ditanam', 'Tumbuh', 'Siap Panen', 'Gagal', 'Dipanen'], description: 'Otomatis "Dipanen" setelah panen ke-3' },
          catatan: { type: 'string' }, fotoUrl: nullableStr, createdAt: { type: 'string' },
          jumlahPanen: { type: 'integer' }, panenKeTerakhir: { type: 'integer', nullable: true },
        },
      },
      PlantingInput: {
        type: 'object',
        required: ['lahanId', 'tanggalTanam', 'varietas'],
        properties: {
          kodeTanam: { type: 'string', description: 'Otomatis jika kosong' }, lahanId: { type: 'string' },
          tanggalTanam: tanggal('2026-10-07'), estimasiPanen: { ...tanggal('2027-01-15'), description: 'Tidak boleh sebelum tanggal tanam' },
          varietas: { type: 'string' }, jumlahLubang: { type: 'integer' }, luasTanam: { type: 'number' }, petugas: { type: 'string' },
          statusTanam: { type: 'string', enum: ['Ditanam', 'Tumbuh', 'Siap Panen', 'Gagal', 'Dipanen'] }, catatan: { type: 'string' }, fotoUrl: { type: 'string' },
        },
      },

      // ── Panen ──
      Harvest: {
        type: 'object',
        properties: {
          id: { type: 'string' }, kodePanen: { type: 'string', example: 'BAS-19102026-01' }, namaLahan: { type: 'string' },
          varietas: { type: 'string' }, tanggalPanen: tanggal('2026-10-19'), jumlahHasilKg: { type: 'number' },
          kualitasGrade: { type: 'string', enum: ['Grade A (Premium)', 'Grade B (Standar)', 'Grade C (Pakan)'] },
          petaniPenanggungJawab: { type: 'string' }, status: { type: 'string', enum: ['Siap Panen', 'Dalam Proses', 'Selesai', 'Tersimpan di Gudang'] },
          catatan: { type: 'string' }, fotoUrl: nullableStr, lahanId: nullableStr, plantingId: nullableStr,
          periodeHari: { type: 'integer', nullable: true, description: 'Umur tanam saat panen (hari)' },
          panenKe: { type: 'integer', minimum: 1, maximum: 3 }, persenHama: { type: 'number', nullable: true }, jenisHama: { type: 'string' },
          lahan: { type: 'object', nullable: true, properties: { id: { type: 'string' }, kodeLahan: { type: 'string' }, namaLahan: { type: 'string' }, lokasiDesa: { type: 'string' }, luasHektar: { type: 'number' } } },
          planting: { type: 'object', nullable: true, properties: { id: { type: 'string' }, kodeTanam: { type: 'string' }, tanggalTanam: { type: 'string' }, estimasiPanen: nullableStr, varietas: { type: 'string' }, jumlahLubang: { type: 'integer' }, petugas: { type: 'string' } } },
          sudahMasukKg: { type: 'number', description: 'Jumlah GABAH dari panen ini yang sudah masuk gudang' },
          sisaBelumMasukKg: { type: 'number', nullable: true },
          stockBatches: { type: 'array', items: ref('StockBatch'), description: 'Hanya di GET /harvest/{id}' },
          createdAt: { type: 'string' },
        },
      },
      HarvestInput: {
        type: 'object',
        required: ['namaLahan', 'varietas', 'tanggalPanen', 'jumlahHasilKg'],
        properties: {
          kodePanen: { type: 'string', description: 'Otomatis jika kosong' }, lahanId: { type: 'string' },
          plantingId: { type: 'string', description: 'Jika kosong → penanaman terakhir di lahan' },
          namaLahan: { type: 'string' }, varietas: { type: 'string' }, tanggalPanen: tanggal('2026-10-21'),
          jumlahHasilKg: { type: 'number', example: 12 }, panenKe: { type: 'integer', minimum: 1, maximum: 3, description: 'Kosong → nomor berikutnya yang tersedia' },
          kualitasGrade: { type: 'string', enum: ['Grade A (Premium)', 'Grade B (Standar)', 'Grade C (Pakan)'] },
          petaniPenanggungJawab: { type: 'string' }, status: { type: 'string', enum: ['Siap Panen', 'Dalam Proses', 'Selesai', 'Tersimpan di Gudang'] },
          catatan: { type: 'string' }, fotoUrl: { type: 'string' }, persenHama: { type: 'number', minimum: 0, maximum: 100 }, jenisHama: { type: 'string' },
          gudangId: { type: 'string', description: 'Gudang tujuan stok (default: gudang lahan)' },
          stokBatch: {
            type: 'array', description: 'Pecahan stok GABAH yang masuk gudang (total ≤ jumlahHasilKg). Tidak dikirim saat edit → stok tidak diubah.',
            items: { type: 'object', properties: { jumlahKg: { type: 'number' }, keterangan: { type: 'string' } } },
          },
        },
      },

      // ── Gudang ──
      Warehouse: {
        type: 'object',
        properties: {
          id: { type: 'string' }, kodeGudang: { type: 'string', example: 'GDG-BAS-01' }, namaGudang: { type: 'string' },
          lahanId: nullableStr, lokasi: { type: 'string' }, totalStokKg: { type: 'number' },
          stokGabahKg: { type: 'number' }, stokSorgumKg: { type: 'number' },
          lahan: { type: 'object', nullable: true, properties: { id: { type: 'string' }, kodeLahan: { type: 'string' }, namaLahan: { type: 'string' }, lokasiDesa: { type: 'string' }, pemilikKelompokTani: { type: 'string' } } },
          createdAt: { type: 'string' },
        },
      },
      WarehouseDetail: {
        allOf: [ref('Warehouse'), {
          type: 'object',
          properties: {
            stockBatches: { type: 'array', items: ref('StockBatch') },
            movements: { type: 'array', items: ref('WarehouseMovement') },
            sosohList: { type: 'array', items: { type: 'object' } },
          },
        }],
      },
      StockBatch: {
        type: 'object',
        properties: {
          id: { type: 'string' }, gudangId: { type: 'string' }, harvestId: nullableStr,
          jenis: { type: 'string', enum: ['GABAH', 'SORGUM'] }, asalBatchId: nullableStr,
          kodeBatchStok: { type: 'string', example: 'SRG-BAS-19102026-01' }, jumlahMasukKg: { type: 'number' }, sisaKg: { type: 'number' },
          tanggalMasuk: { type: 'string' }, tanggalSosoh: nullableStr, operatorSosoh: nullableStr,
          asalBatch: { type: 'object', nullable: true, properties: { id: { type: 'string' }, kodeBatchStok: { type: 'string' } } },
          harvest: { type: 'object', nullable: true }, kodePanen: nullableStr,
          traceUrl: { type: 'string', nullable: true, description: 'Halaman lacak publik (isi QR)', example: 'https://scm.livinglabs.id/trace/SRG-BAS-19102026-01' },
          qrUrl: { type: 'string', nullable: true, description: 'Gambar QR (PNG; tambah ?format=svg)', example: 'https://scm.livinglabs.id/api/public/qr/trace/SRG-BAS-19102026-01' },
          createdAt: { type: 'string' },
        },
      },
      WarehouseMovement: {
        type: 'object',
        properties: {
          id: { type: 'string' }, gudangId: { type: 'string' }, tipe: { type: 'string', enum: ['MASUK', 'KELUAR'] },
          jumlahKg: { type: 'number' }, keterangan: { type: 'string' }, harvestId: nullableStr, productionId: nullableStr,
          stockBatchId: nullableStr, kodePanen: nullableStr, kodeBatch: nullableStr, kodeBatchStok: nullableStr,
          namaProduk: nullableStr, createdAt: { type: 'string' },
        },
      },
      HistoryItem: {
        type: 'object',
        description: 'Riwayat gabungan gudang. createdAt = tanggal kejadian (tanggal masuk / tanggal produksi / waktu sosoh).',
        properties: {
          id: { type: 'string', example: 'M-12 / S-3' }, tipe: { type: 'string', enum: ['MASUK', 'KELUAR', 'SOSOH'] },
          jumlahKg: { type: 'number' }, keterangan: nullableStr, createdAt: { type: 'string' }, kodeBatch: nullableStr,
          kodeSosoh: nullableStr, kodeBatchGabah: nullableStr, kodeBatchSorgum: nullableStr,
          kgGabah: { type: 'number', nullable: true }, kgSorgum: { type: 'number', nullable: true },
          rendemen: { type: 'number', nullable: true }, operator: nullableStr,
        },
      },
      BatchTrace: {
        type: 'object',
        description: 'Jejak lengkap satu batch stok: lahan → tanam → panen → gudang/sosoh → olahan. Versi publik (/public/trace) menyertakan lahan.kelompokTani & kecamatan, serta produksi[].fotoUrl, deskripsi, kapasitas, komposisi, nilaiGizi, fotos (dari kemasan produk).',
        properties: {
          batch: { type: 'object' }, gudang: { type: 'object' }, lahan: { type: 'object', nullable: true },
          tanam: { type: 'object', nullable: true }, panen: { type: 'object', nullable: true },
          movements: { type: 'array', items: { type: 'object' } }, produksi: { type: 'array', items: { type: 'object' } },
          logistik: { type: 'array', items: { type: 'object' } },
        },
      },

      // ── Produksi & master ──
      ProductionBatch: {
        type: 'object',
        properties: {
          id: { type: 'string' }, kodeBatch: { type: 'string', example: 'PRD-BAS-19102026-01' }, namaProduk: { type: 'string' },
          productId: nullableStr, tanggalProduksi: tanggal('2026-10-19'), tanggalKadaluarsa: { type: 'string' },
          jumlahHasil: { type: 'number' }, satuan: { type: 'string', example: 'Pouch' },
          bahanDigunakan: { type: 'number', nullable: true, description: 'Kg sorgum yang dipakai' }, satuanBahan: { type: 'string' },
          nomorBatchBahanBaku: { type: 'string' }, operatorProduksi: { type: 'string' },
          statusQC: { type: 'string', enum: ['Lolos QC', 'Pending QC', 'Revisi Batch'] }, lokasiGudang: { type: 'string' },
          lahanId: nullableStr, plantingId: nullableStr, harvestId: nullableStr, gudangId: nullableStr, stockBatchId: nullableStr,
          lahan: { type: 'object', nullable: true }, planting: { type: 'object', nullable: true }, harvest: { type: 'object', nullable: true },
          gudang: { type: 'object', nullable: true },
          stockBatch: { type: 'object', nullable: true, properties: { id: { type: 'string' }, kodeBatchStok: { type: 'string' }, jenis: { type: 'string' }, asalBatch: { type: 'object', nullable: true } } },
          traceUrl: { type: 'string', nullable: true, description: 'Halaman lacak publik (isi QR)', example: 'https://scm.livinglabs.id/trace/SRG-BAS-19102026-01' },
          qrUrl: { type: 'string', nullable: true, description: 'Gambar QR (PNG; tambah ?format=svg)', example: 'https://scm.livinglabs.id/api/public/qr/trace/SRG-BAS-19102026-01' },
          createdAt: { type: 'string' },
        },
      },
      ProductionInput: {
        type: 'object',
        required: ['namaProduk'],
        properties: {
          kodeBatch: { type: 'string', description: 'Otomatis: PRD-<lahan>-<DDMMYYYY>-<no>' }, namaProduk: { type: 'string' },
          productId: { type: 'string' }, tanggalProduksi: tanggal('2026-10-21'), tanggalKadaluarsa: tanggal('2027-04-21'),
          jumlahHasil: { type: 'number' }, satuan: { type: 'string' },
          bahanDigunakan: { type: 'number', description: 'Kg sorgum dipakai — mengurangi stok batch (harus jenis SORGUM)' },
          satuanBahan: { type: 'string', default: 'Kg' }, gudangId: { type: 'string' }, stockBatchId: { type: 'string' },
          harvestId: { type: 'string' }, nomorBatchBahanBaku: { type: 'string' }, operatorProduksi: { type: 'string' },
          statusQC: { type: 'string', enum: ['Lolos QC', 'Pending QC', 'Revisi Batch'] }, lokasiGudang: { type: 'string' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string' }, name: { type: 'string', example: 'Tepung Sorgum' },
          satuanHasil: { type: 'string', enum: ['Pouch', 'Kg', 'Botol', 'Box', 'Toples', 'Kemasan'] },
          deskripsi: { type: 'string' }, fotoUrl: nullableStr, isActive: { type: 'boolean' }, createdAt: { type: 'string' },
        },
      },
      ProductInput: {
        type: 'object', required: ['name'],
        properties: {
          name: { type: 'string' }, satuanHasil: { type: 'string', enum: ['Pouch', 'Kg', 'Botol', 'Box', 'Toples', 'Kemasan'] },
          deskripsi: { type: 'string' }, fotoUrl: { type: 'string' }, isActive: { type: 'boolean' },
        },
      },
      Variety: {
        type: 'object',
        properties: {
          id: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, imageUrl: nullableStr,
          lamaPanen: { type: 'integer', description: 'Umur panen (hari) — dipakai untuk perkiraan panen', example: 100 },
          isActive: { type: 'boolean' }, createdAt: { type: 'string' },
        },
      },
      VarietyInput: {
        type: 'object', required: ['name'],
        properties: { name: { type: 'string' }, description: { type: 'string' }, imageUrl: { type: 'string' }, lamaPanen: { type: 'integer' }, isActive: { type: 'boolean' } },
      },

      // ── Lain-lain ──
      Equipment: {
        type: 'object',
        properties: {
          id: { type: 'string' }, kodeAlat: { type: 'string' }, namaPeralatan: { type: 'string' },
          kategori: { type: 'string', enum: ['Pascapanen', 'Pengolahan Produk', 'Pengemasan'], description: 'Data lama bisa berisi kategori lain' },
          jumlahStok: { type: 'integer' }, kondisi: { type: 'string', enum: ['Sangat Baik', 'Baik', 'Perlu Perbaikan', 'Rusak'] },
          status: { type: 'string', enum: ['Tersedia', 'Sedang Digunakan', 'Dalam Perawatan', 'Diarsipkan'] },
          lokasiPenyimpanan: { type: 'string' }, tanggalPengadaan: { type: 'string' }, spesifikasi: { type: 'string' },
          fotoUrl: nullableStr, terakhirServis: { type: 'string' }, createdAt: { type: 'string' },
        },
      },
      EquipmentInput: {
        type: 'object', required: ['namaPeralatan', 'kategori', 'jumlahStok'],
        properties: {
          kodeAlat: { type: 'string' }, namaPeralatan: { type: 'string' }, kategori: { type: 'string', enum: ['Pascapanen', 'Pengolahan Produk', 'Pengemasan'] },
          jumlahStok: { type: 'integer' }, kondisi: { type: 'string', enum: ['Sangat Baik', 'Baik', 'Perlu Perbaikan', 'Rusak'] },
          status: { type: 'string', enum: ['Tersedia', 'Sedang Digunakan', 'Dalam Perawatan', 'Diarsipkan'] },
          lokasiPenyimpanan: { type: 'string' }, tanggalPengadaan: tanggal(), spesifikasi: { type: 'string' }, fotoUrl: { type: 'string' }, terakhirServis: tanggal(),
        },
      },
      Certificate: {
        type: 'object',
        properties: {
          id: { type: 'string' }, kodeDokumen: { type: 'string' }, namaSertifikat: { type: 'string' }, penerbitSertifikat: { type: 'string' },
          nomorSertifikat: { type: 'string' }, tanggalTerbit: { type: 'string' }, tanggalKadaluarsa: { type: 'string' },
          status: { type: 'string', enum: ['AKTIF', 'PROSES', 'KADALUARSA'] },
          jenisDokumen: { type: 'string', enum: ['Sertifikat Halal', 'Izin P-IRT', 'Uji Lab Nutrisi', 'Sertifikat Organik', 'Lainnya'] },
          fileUrl: nullableStr, fileName: { type: 'string' }, fileType: { type: 'string' }, keterangan: { type: 'string' }, createdAt: { type: 'string' },
        },
      },
      CertificateInput: {
        type: 'object', required: ['namaSertifikat', 'penerbitSertifikat'],
        properties: {
          kodeDokumen: { type: 'string' }, namaSertifikat: { type: 'string' }, penerbitSertifikat: { type: 'string' }, nomorSertifikat: { type: 'string' },
          tanggalTerbit: tanggal(), tanggalKadaluarsa: tanggal('2028-10-21'), status: { type: 'string', enum: ['AKTIF', 'PROSES', 'KADALUARSA'] },
          jenisDokumen: { type: 'string', enum: ['Sertifikat Halal', 'Izin P-IRT', 'Uji Lab Nutrisi', 'Sertifikat Organik', 'Lainnya'] },
          fileUrl: { type: 'string', description: 'Data URL base64' }, fileName: { type: 'string' }, fileType: { type: 'string' }, keterangan: { type: 'string' },
        },
      },
      Packaging: {
        type: 'object',
        properties: {
          id: { type: 'string' }, kodeKemasan: { type: 'string', example: 'KMG-001' }, namaKemasan: { type: 'string' },
          productId: { ...nullableStr, description: 'Produk olahan yang dikemas' },
          product: { type: 'object', nullable: true, properties: { id: { type: 'string' }, name: { type: 'string' }, satuanHasil: { type: 'string' }, fotoUrl: nullableStr } },
          kategori: { type: 'string', enum: ['Standing Pouch', 'Box Custom', 'Karung Bulk', 'Botol Kaca', 'Aksesoris'] },
          kapasitas: { type: 'string' }, stokTersedia: { type: 'integer' }, satuan: { type: 'string' }, stokMinimal: { type: 'integer' },
          pemasok: { type: 'string' }, hargaPerUnitRp: { type: 'number' }, statusStok: { type: 'string' },
          extraData: { type: 'object', nullable: true, description: 'komposisi, nilaiGizi, akg, riwayat, imagesDataUrl (1–4 foto)' },
          publicUrl: { type: 'string', description: 'Halaman publik kemasan (isi QR)', example: 'https://scm.livinglabs.id/kemasan/KMG-001' },
          qrUrl: { type: 'string', description: 'Gambar QR kemasan (PNG; tambah ?format=svg)', example: 'https://scm.livinglabs.id/api/public/qr/kemasan/KMG-001' },
          createdAt: { type: 'string' },
        },
      },
      PackagingInput: {
        type: 'object', required: ['namaKemasan'],
        properties: {
          kodeKemasan: { type: 'string', description: 'Otomatis KMG-xxx jika kosong' }, namaKemasan: { type: 'string' },
          productId: { type: 'string', nullable: true, description: 'ID produk olahan (GET /products)' },
          kategori: { type: 'string', enum: ['Standing Pouch', 'Box Custom', 'Karung Bulk', 'Botol Kaca', 'Aksesoris'] },
          kapasitas: { type: 'string' }, stokTersedia: { type: 'integer' }, satuan: { type: 'string' }, stokMinimal: { type: 'integer' },
          pemasok: { type: 'string' }, hargaPerUnitRp: { type: 'number' },
          extraData: { type: 'object', description: 'komposisi, nilaiGizi, akg, imagesDataUrl (wajib ≥1 foto saat tambah)' },
        },
      },
      FinancialExpense: {
        type: 'object',
        properties: {
          id: { type: 'string' }, kodeTransaksi: { type: 'string' }, tanggal: { type: 'string' },
          kategori: { type: 'string', enum: ['Bahan Baku', 'Transportasi', 'Operasional', 'Kemasan', 'Perawatan Peralatan', 'Sertifikasi'] },
          keteranganVendor: { type: 'string', description: 'Deskripsi transaksi' }, totalBiayaRp: { type: 'number' },
          statusPembayaran: { type: 'string', enum: ['LUNAS', 'PENDING', 'DIBATALKAN'] },
          metodePembayaran: { type: 'string', enum: ['Transfer Bank', 'Kas Tunai', 'E-Wallet', 'Giro'] },
          nomorNotaReceipt: { type: 'string' },
          detailItem: { type: 'array', items: { type: 'object', properties: { nama: { type: 'string' }, qty: { type: 'number' }, hargaSatuan: { type: 'number' } } } },
          catatanNota: { type: 'string' }, notaUrl: { type: 'string' }, createdAt: { type: 'string' },
        },
      },
      FinancialExpenseInput: {
        type: 'object', required: ['keteranganVendor'],
        properties: {
          kodeTransaksi: { type: 'string' }, tanggal: tanggal(),
          kategori: { type: 'string', enum: ['Bahan Baku', 'Transportasi', 'Operasional', 'Kemasan', 'Perawatan Peralatan', 'Sertifikasi'] },
          keteranganVendor: { type: 'string', description: 'Deskripsi transaksi', example: 'Beli pupuk NPK 2 karung' }, totalBiayaRp: { type: 'number' },
          statusPembayaran: { type: 'string', enum: ['LUNAS', 'PENDING', 'DIBATALKAN'] },
          metodePembayaran: { type: 'string', enum: ['Transfer Bank', 'Kas Tunai', 'E-Wallet', 'Giro'] },
          nomorNotaReceipt: { type: 'string' },
          detailItem: { type: 'array', items: { type: 'object', properties: { nama: { type: 'string' }, qty: { type: 'number' }, hargaSatuan: { type: 'number' } } } },
          catatanNota: { type: 'string' }, notaUrl: { type: 'string', description: 'Data URL base64' },
        },
      },
      PublicKemasan: {
        type: 'object',
        description: 'Data halaman publik dari QR kemasan (tanpa harga, pemasok, stok)',
        properties: {
          kemasan: { type: 'object', properties: { kodeKemasan: { type: 'string' }, namaKemasan: { type: 'string' }, kategori: { type: 'string' }, kapasitas: { type: 'string' }, fotos: { type: 'array', items: { type: 'string' } }, komposisi: { type: 'string' }, nilaiGizi: { type: 'object' }, akg: { type: 'array', items: { type: 'object' } }, publicUrl: { type: 'string' }, qrUrl: { type: 'string' } } },
          produk: { type: 'object', nullable: true, properties: { name: { type: 'string' }, deskripsi: { type: 'string' }, fotoUrl: nullableStr, satuanHasil: { type: 'string' } } },
          batches: {
            type: 'array', description: '10 batch olahan terbaru dari produk ini',
            items: { type: 'object', properties: { kodeBatch: { type: 'string' }, tanggalProduksi: nullableStr, tanggalKadaluarsa: nullableStr, jumlahHasil: { type: 'number' }, satuan: { type: 'string' }, namaLahan: nullableStr, lokasiDesa: nullableStr, kecamatan: nullableStr, kelompokTani: nullableStr, varietas: nullableStr, tanggalTanam: nullableStr, tanggalPanen: nullableStr, umurTanamHari: { type: 'integer', nullable: true }, petani: { ...nullableStr, description: 'Petani penanggung jawab panen' }, pengolah: { ...nullableStr, description: 'Penanggung jawab produksi' }, kodeBatchStok: nullableStr, traceUrl: nullableStr, qrUrl: nullableStr } },
          },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string' }, judul: { type: 'string' }, pesan: { type: 'string' },
          kategori: { type: 'string', enum: ['sertifikat', 'panen', 'produksi', 'logistik', 'sistem'] },
          isRead: { type: 'boolean' }, createdAt: { type: 'string' },
        },
      },
    },
  },

  paths: {
    // ── Kesehatan ─────────────────────────────────────────────────────────
    '/health': {
      get: { tags: ['Kesehatan'], summary: 'Cek server berjalan', responses: { 200: { description: 'Server OK' } } },
    },

    // ── Autentikasi ───────────────────────────────────────────────────────
    '/auth/register': {
      post: {
        tags: ['Autentikasi'], summary: 'Daftar akun baru',
        requestBody: body({ type: 'object', required: ['fullName', 'email', 'password'], properties: { fullName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, password: { type: 'string', minLength: 6 } } }),
        responses: { 201: { description: 'Akun dibuat (token + user)' }, 400: E400, 409: err('Email sudah terdaftar') },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Autentikasi'], summary: 'Login — mendapatkan token JWT',
        requestBody: { required: true, content: json({ type: 'object', required: ['usernameOrEmail', 'password'], properties: { usernameOrEmail: { type: 'string', example: 'admin@sorgum.com' }, password: { type: 'string' } } }) },
        responses: {
          200: { description: 'Berhasil login', content: json({ type: 'object', properties: { success: { type: 'boolean' }, token: { type: 'string' }, user: ref('User') } }) },
          400: E400, 401: err('Email atau sandi salah'),
        },
      },
    },
    '/auth/logout': {
      post: { tags: ['Autentikasi'], summary: 'Logout (stateless — hapus token di klien)', responses: { 200: { description: 'Berhasil logout' } } },
    },
    '/auth/me': {
      get: { security: WRITE, tags: ['Autentikasi'], summary: 'Profil pengguna yang login', responses: { 200: ok(ref('User')), 401: E401W } },
      put: { security: WRITE, tags: ['Autentikasi'], summary: 'Perbarui profil', requestBody: body(ref('ProfileInput')), responses: { 200: ok(ref('User')), 400: E400, 401: E401W } },
    },
    '/auth/me/password': {
      put: {
        security: WRITE, tags: ['Autentikasi'], summary: 'Ganti kata sandi',
        requestBody: body({ type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 6 } } }),
        responses: { 200: { description: 'Sandi diganti' }, 400: E400, 401: E401W },
      },
    },

    // ── API Key (khusus JWT) ──────────────────────────────────────────────
    '/keys': {
      get: { security: WRITE, tags: ['API Key'], summary: 'Daftar API key (nilai disamarkan)', responses: { 200: okArray(ref('ApiKey')), 401: E401W } },
      post: {
        security: WRITE, tags: ['API Key'], summary: 'Buat API key baru (nilai penuh hanya ditampilkan sekali)',
        requestBody: body({ type: 'object', required: ['nama'], properties: { nama: { type: 'string', example: 'Integrasi Dashboard Dinas' } } }),
        responses: { 201: { description: 'API key dibuat' }, 400: E400, 401: E401W },
      },
    },
    '/keys/active': {
      get: { security: WRITE, tags: ['API Key'], summary: 'API key aktif lengkap (untuk halaman Pengaturan)', responses: { 200: { description: 'Key aktif' }, 401: E401W } },
    },
    '/keys/{id}': {
      put: { security: WRITE, tags: ['API Key'], summary: 'Aktif/nonaktifkan API key', parameters: [idParam()], requestBody: body({ type: 'object', properties: { isActive: { type: 'boolean' } } }), responses: { 200: { description: 'Diperbarui' }, 401: E401W, 404: E404 } },
      delete: { security: WRITE, tags: ['API Key'], summary: 'Cabut API key', parameters: [idParam()], responses: { 200: { description: 'Dicabut' }, 401: E401W, 404: E404 } },
    },

    // ── Lahan ─────────────────────────────────────────────────────────────
    ...crud({ base: '/land', tag: 'Lahan', label: 'lahan', item: ref('LandPlot'), input: ref('LandInput') }),

    // ── Penanaman ─────────────────────────────────────────────────────────
    ...crud({
      base: '/plantings', tag: 'Penanaman', label: 'penanaman', item: ref('Planting'), input: ref('PlantingInput'),
      listParams: [...pageParams, q('lahanId', { type: 'string' }), q('status', { type: 'string', enum: ['Ditanam', 'Tumbuh', 'Siap Panen', 'Gagal', 'Dipanen'] })],
    }),

    // ── Panen ─────────────────────────────────────────────────────────────
    ...crud({
      base: '/harvest', tag: 'Panen', label: 'panen', item: ref('Harvest'), input: ref('HarvestInput'),
      listParams: [
        ...pageParams,
        q('lahanId', { type: 'string' }), q('plantingId', { type: 'string' }), q('lahan', { type: 'string' }, 'Nama lahan'),
        q('varietas', { type: 'string' }), q('tanggalAwal', tanggal('2026-01-01')), q('tanggalAkhir', tanggal('2026-12-31')),
        q('grade', { type: 'string', enum: ['Grade A (Premium)', 'Grade B (Standar)', 'Grade C (Pakan)'] }),
        q('status', { type: 'string', enum: ['Siap Panen', 'Dalam Proses', 'Selesai', 'Tersimpan di Gudang'] }),
      ],
    }),

    // ── Gudang ────────────────────────────────────────────────────────────
    ...crud({ base: '/warehouse', tag: 'Gudang', label: 'gudang', item: ref('Warehouse'), input: { type: 'object', required: ['namaGudang'], properties: { kodeGudang: { type: 'string' }, namaGudang: { type: 'string' }, lahanId: { type: 'string' }, lokasi: { type: 'string' } } } }),
    '/warehouse/options': {
      get: { security: READ, tags: ['Gudang'], summary: 'Ringkasan semua gudang (untuk pilihan)', responses: { 200: okArray({ type: 'object', properties: { id: { type: 'string' }, kodeGudang: { type: 'string' }, namaGudang: { type: 'string' }, totalStokKg: { type: 'number' }, lahanId: { type: 'string' }, namaLahan: { type: 'string' } } }), 401: E401 } },
    },
    '/warehouse/harvest-options': {
      get: { security: READ, tags: ['Gudang'], summary: 'Panen yang masih punya sisa belum masuk gudang', responses: { 200: okArray(ref('Harvest')), 401: E401 } },
    },
    '/warehouse/stock-sorgum/all': {
      get: { security: READ, tags: ['Gudang'], summary: 'Semua batch SORGUM bersisa di semua gudang (bahan olahan)', responses: { 200: okArray(ref('StockBatch')), 401: E401 } },
    },
    '/warehouse/{id}/stock-batches': {
      get: {
        security: READ, tags: ['Gudang'], summary: 'Batch stok di satu gudang',
        parameters: [
          idParam('id', 'ID gudang'),
          q('jenis', { type: 'string', enum: ['SORGUM', 'GABAH', 'SEMUA'], default: 'SORGUM' }),
          q('termasukHabis', { type: 'boolean', default: false }, 'Sertakan batch yang sisanya 0'),
        ],
        responses: { 200: okArray(ref('StockBatch')), 401: E401 },
      },
    },
    '/warehouse/{id}/history': {
      get: {
        security: READ, tags: ['Gudang'], summary: 'Riwayat gudang (masuk, keluar, sosoh)',
        parameters: [
          idParam('id', 'ID gudang'), ...pageParams,
          q('bulan', { type: 'string', example: '2026-10' }, 'YYYY-MM — berdasarkan tanggal kejadian'),
          q('tipe', { type: 'string', enum: ['MASUK', 'KELUAR', 'SOSOH'] }),
        ],
        responses: { 200: okList(ref('HistoryItem')), 401: E401 },
      },
    },
    '/warehouse/{gudangId}/trace/{batchId}': {
      get: {
        security: READ, tags: ['Gudang'], summary: 'Lacak lengkap satu batch stok',
        parameters: [idParam('gudangId', 'ID gudang'), idParam('batchId', 'ID batch stok')],
        responses: { 200: ok(ref('BatchTrace')), 401: E401, 404: E404 },
      },
    },
    '/warehouse/stock/in': {
      post: {
        security: WRITE, tags: ['Gudang'], summary: 'Stok masuk (GABAH) dari panen',
        requestBody: body({ type: 'object', required: ['harvestId', 'jumlahKg'], properties: { harvestId: { type: 'string' }, jumlahKg: { type: 'number', description: '≤ sisa panen yang belum masuk' }, tanggalMasuk: tanggal(), keterangan: { type: 'string' } } }),
        responses: { 201: { description: 'Batch GABAH dibuat' }, 400: E400, 401: E401W, 404: E404 },
      },
    },
    '/warehouse/stock/sosoh': {
      post: {
        security: WRITE, tags: ['Gudang'], summary: 'Proses sosoh: GABAH → SORGUM',
        requestBody: body({ type: 'object', required: ['gudangId', 'batchGabahId', 'kgGabah', 'kgHasilSorgum'], properties: { gudangId: { type: 'string' }, batchGabahId: { type: 'string' }, kgGabah: { type: 'number' }, kgHasilSorgum: { type: 'number', description: '≤ kgGabah' }, operator: { type: 'string' }, keterangan: { type: 'string' } } }),
        responses: { 201: { description: 'Batch SORGUM dibuat + rendemen' }, 400: E400, 401: E401W, 404: E404 },
      },
    },
    '/warehouse/stock/out': {
      post: {
        security: WRITE, tags: ['Gudang'], summary: 'Stok keluar dari batch SORGUM',
        requestBody: body({ type: 'object', required: ['gudangId', 'stockBatchId', 'jumlahKg'], properties: { gudangId: { type: 'string' }, stockBatchId: { type: 'string' }, jumlahKg: { type: 'number' }, productionId: { type: 'string' }, keterangan: { type: 'string' } } }),
        responses: { 200: { description: 'Stok dikeluarkan' }, 400: E400, 401: E401W, 404: E404 },
      },
    },

    // ── Produksi ──────────────────────────────────────────────────────────
    ...crud({
      base: '/production', tag: 'Produksi', label: 'batch olahan', item: ref('ProductionBatch'), input: ref('ProductionInput'),
      listParams: [...pageParams, q('lahanId', { type: 'string' }), q('harvestId', { type: 'string' })],
    }),

    // ── Master ────────────────────────────────────────────────────────────
    ...crud({ base: '/products', tag: 'Produk Olahan', label: 'produk olahan', item: ref('Product'), input: ref('ProductInput'), listParams: [q('isActive', { type: 'boolean' })], list: 'array' }),
    ...crud({ base: '/varieties', tag: 'Varietas', label: 'varietas', item: ref('Variety'), input: ref('VarietyInput'), listParams: [], list: 'array', noDetail: true }),

    // ── Peralatan, sertifikat, kemasan, keuangan ──────────────────────────
    ...crud({
      base: '/equipment', tag: 'Peralatan', label: 'peralatan', item: ref('Equipment'), input: ref('EquipmentInput'),
      listParams: [...pageParams, q('status', { type: 'string' }), q('kondisi', { type: 'string' }), q('perhatian', { type: 'string', enum: ['1'] }, 'Isi 1 → hanya alat yang sedang dipakai atau butuh perhatian')],
    }),
    ...crud({ base: '/certificates', tag: 'Sertifikat', label: 'sertifikat', item: ref('Certificate'), input: ref('CertificateInput') }),
    ...crud({
      base: '/packaging', tag: 'Kemasan', label: 'kemasan', item: ref('Packaging'), input: ref('PackagingInput'),
      listParams: [...pageParams, q('kategori', { type: 'string', enum: ['Standing Pouch', 'Box Custom', 'Karung Bulk', 'Botol Kaca', 'Aksesoris'] }), q('productId', { type: 'string' }, 'Kemasan milik produk tertentu')],
    }),
    ...crud({
      base: '/logistics', tag: 'Keuangan', label: 'transaksi pengeluaran', item: ref('FinancialExpense'), input: ref('FinancialExpenseInput'),
      listParams: [...pageParams, q('kategori', { type: 'string', enum: ['Bahan Baku', 'Transportasi', 'Operasional', 'Kemasan', 'Perawatan Peralatan', 'Sertifikasi'] })],
    }),

    // ── Notifikasi ────────────────────────────────────────────────────────
    '/notifications': {
      get: {
        security: READ, tags: ['Notifikasi'], summary: 'Daftar notifikasi (+ jumlah belum dibaca)',
        responses: { 200: { description: 'Daftar notifikasi', content: json({ type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: ref('Notification') }, unread: { type: 'integer' } } }) }, 401: E401 },
      },
      post: {
        security: WRITE, tags: ['Notifikasi'], summary: 'Buat notifikasi',
        requestBody: body({ type: 'object', required: ['judul', 'pesan'], properties: { judul: { type: 'string' }, pesan: { type: 'string' }, kategori: { type: 'string', enum: ['sertifikat', 'panen', 'produksi', 'logistik', 'sistem'] } } }),
        responses: { 201: ok(ref('Notification')), 400: E400, 401: E401W },
      },
    },
    '/notifications/{id}/read': {
      put: { security: WRITE, tags: ['Notifikasi'], summary: 'Tandai dibaca (id = "all" untuk semua)', parameters: [idParam()], responses: { 200: { description: 'Ditandai dibaca' }, 401: E401W } },
    },
    '/notifications/{id}': {
      delete: { security: WRITE, tags: ['Notifikasi'], summary: 'Hapus notifikasi', parameters: [idParam()], responses: { 200: { description: 'Dihapus' }, 401: E401W, 404: E404 } },
    },

    // ── CMS ───────────────────────────────────────────────────────────────
    '/cms': {
      get: { tags: ['CMS'], summary: 'Konten landing page (publik)', responses: { 200: ok({ type: 'object', description: 'Objek konten (siteName, hero*, stats, featureCards, footer*, …)' }) } },
      put: { security: WRITE, tags: ['CMS'], summary: 'Simpan konten landing page (kirim objek konten lengkap)', requestBody: body({ type: 'object' }), responses: { 200: { description: 'Tersimpan' }, 401: E401W } },
      delete: { security: WRITE, tags: ['CMS'], summary: 'Reset konten ke bawaan', responses: { 200: { description: 'Direset' }, 401: E401W } },
    },
    '/cms/settings/{key}': {
      get: { security: READ, tags: ['CMS'], summary: 'Ambil pengaturan aplikasi (mis. app_units)', parameters: [idParam('key', 'Kunci pengaturan, mis. app_units')], responses: { 200: ok({ type: 'object', nullable: true }), 401: E401 } },
      put: { security: WRITE, tags: ['CMS'], summary: 'Simpan pengaturan (body = objek pengaturan)', parameters: [idParam('key', 'Kunci pengaturan')], requestBody: body({ type: 'object' }), responses: { 200: { description: 'Tersimpan' }, 400: E400, 401: E401W } },
    },

    // ── Pengaturan Data ───────────────────────────────────────────────────
    '/settings/clear-data': {
      post: { security: WRITE, tags: ['Pengaturan Data'], summary: 'KOSONGKAN semua data operasional (akun, konten web & API key tetap). Tidak bisa dibatalkan.', responses: { 200: { description: 'Data dikosongkan + ringkasan jumlah baris' }, 401: E401W } },
    },
    '/settings/seed-data': {
      post: { security: WRITE, tags: ['Pengaturan Data'], summary: 'Isi data contoh lengkap (hanya bila data masih kosong)', responses: { 201: { description: 'Data contoh dibuat' }, 401: E401W, 409: err('Data sudah ada — kosongkan dulu') } },
    },

    // ── Publik ────────────────────────────────────────────────────────────
    '/public/kemasan/{kodeKemasan}': {
      get: {
        tags: ['Publik'], summary: 'Info produk dari QR kemasan (komposisi, gizi, batch yang bisa dilacak)',
        parameters: [idParam('kodeKemasan', 'Kode kemasan, mis. KMG-001')],
        responses: { 200: ok(ref('PublicKemasan')), 404: E404 },
      },
    },
    '/public/qr/trace/{kodeBatchStok}': {
      get: {
        tags: ['Publik'], summary: 'Gambar QR lacak batch stok (menuju /trace/{kode})',
        parameters: [idParam('kodeBatchStok', 'Kode batch stok'), ...[
          q('format', { type: 'string', enum: ['png', 'svg'], default: 'png' }),
          q('size', { type: 'integer', minimum: 128, maximum: 1024, default: 512 }, 'Lebar gambar PNG (px)'),
        ]],
        responses: {
          200: { description: 'Gambar QR', content: { 'image/png': { schema: { type: 'string', format: 'binary' } }, 'image/svg+xml': { schema: { type: 'string' } } } },
          404: E404,
        },
      },
    },
    '/public/qr/kemasan/{kodeKemasan}': {
      get: {
        tags: ['Publik'], summary: 'Gambar QR kemasan (menuju /kemasan/{kode})',
        parameters: [idParam('kodeKemasan', 'Kode kemasan'), ...[
          q('format', { type: 'string', enum: ['png', 'svg'], default: 'png' }),
          q('size', { type: 'integer', minimum: 128, maximum: 1024, default: 512 }, 'Lebar gambar PNG (px)'),
        ]],
        responses: {
          200: { description: 'Gambar QR', content: { 'image/png': { schema: { type: 'string', format: 'binary' } }, 'image/svg+xml': { schema: { type: 'string' } } } },
          404: E404,
        },
      },
    },
    '/public/trace/{kodeBatchStok}': {
      get: {
        tags: ['Publik'], summary: 'Lacak asal-usul produk dari kode batch stok (dipakai QR)',
        parameters: [idParam('kodeBatchStok', 'Kode batch stok, mis. SRG-BAS-19102026-01')],
        responses: { 200: ok(ref('BatchTrace')), 404: E404 },
      },
    },
  },
};

// Detail gudang mengembalikan data lengkap (batch stok, mutasi, sosoh)
openApiSpec.paths['/warehouse/{id}'].get.responses[200] = ok(ref('WarehouseDetail'));

// Alias lama (kompatibilitas) — sama dengan /logistics
openApiSpec.paths['/logistics/expenses'] = {
  get: { ...openApiSpec.paths['/logistics'].get, deprecated: true, summary: 'Alias lama dari GET /logistics' },
  post: { ...openApiSpec.paths['/logistics'].post, deprecated: true, summary: 'Alias lama dari POST /logistics' },
};
