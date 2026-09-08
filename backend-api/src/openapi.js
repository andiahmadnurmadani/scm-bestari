/**
 * OpenAPI 3.0 Specification untuk Sorgum SCM API.
 * Ditampilkan via Scalar di endpoint /api/docs.
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Sorgum SCM API',
    description:
      'Dokumentasi API untuk **Sistem Manajemen Rantai Pasok Sorgum** (Kelompok Wanita Tani).\n\n' +
      '## Autentikasi\n' +
      '- **Read (GET)** — butuh JWT Bearer (login) **ATAU** API key. Sertakan header `x-api-key: <kunci>`.\n' +
      '- **Tulis (POST/PUT/DELETE)** — wajib JWT Bearer `Authorization: Bearer <token>` (dari `POST /auth/login`).\n' +
      '- **API key** bisa dibuat melalui menu admin `/api/keys` (hanya JWT) ATAU dikonfigurasi lewat env `API_KEYS` (dipisah koma) di sisi server.\n' +
      '## Format Respons\n' +
      'Setiap respons memakai format `{ success, message?, data?, pagination? }`.\n' +
      '## Server\n' +
      '- Lokal (dev): `http://localhost:8000/api` (default saat `npm run dev`).\n' +
      '- Produksi: `https://scm-bestari.kolab.top/api`.\n' +
      'UI interaktif ini bisa dipakai langsung (tombol "Try it") dengan memilih server di pojok kanan atas.',
    version: '1.0.0',
    contact: {
      name: 'Sorgum SCM',
      email: 'support@sorgumscm.id',
    },
  },
  servers: [
    { url: 'http://localhost:8000/api', description: 'Lokal (development)' },
    { url: 'https://scm-bestari.kolab.top/api', description: 'Produksi (hosting)' },
  ],
  tags: [
    { name: 'Kesehatan', description: 'Cek status server' },
    { name: 'Autentikasi', description: 'Login, daftar, profil, ganti sandi' },
    { name: 'API Key', description: 'Kelola kunci API read-only untuk akses dari luar' },
    { name: 'Panen', description: 'Data panen sorgum' },
    { name: 'Varietas', description: 'Master data varietas sorgum' },
    { name: 'Lahan', description: 'Kelola blok lahan' },
    { name: 'Peralatan', description: 'Sarana & peralatan' },
    { name: 'Produksi', description: 'Batch produksi olahan' },
    { name: 'Sertifikat', description: 'Dokumen sertifikat & perizinan' },
    { name: 'Kemasan', description: 'Stok bahan kemasan' },
    { name: 'Logistik', description: 'Pengeluaran logistik & keuangan' },
    { name: 'Notifikasi', description: 'Notifikasi sistem' },
    { name: 'CMS', description: 'Konten landing page' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT dari POST /auth/login. Header: Authorization: Bearer <token>',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'API key read-only (bisa dari env API_KEYS atau dikelola di /api/keys). Header: x-api-key',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Berhasil.' },
          data: {},
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' },
              hasNext: { type: 'boolean' },
              hasPrev: { type: 'boolean' },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Pesan error.' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          name: { type: 'string', example: 'Admin Sorgum SCM' },
          email: { type: 'string', example: 'admin@sorgum.com' },
          phone: { type: 'string', example: '081234567890' },
          role: { type: 'string', example: 'Admin KWT' },
          avatar: { type: 'string', nullable: true },
          jabatan: { type: 'string' },
          namaKWT: { type: 'string' },
          alamat: { type: 'string' },
          kecamatan: { type: 'string' },
          kabupaten: { type: 'string' },
          bio: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
      Harvest: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          kodePanen: { type: 'string', example: 'PNN-0001' },
          namaLahan: { type: 'string', example: 'Blok A - Sukamaju' },
          varietas: { type: 'string', example: 'Sorgum Bioguma 1' },
          tanggalPanen: { type: 'string', example: '2026-07-15' },
          jumlahHasilKg: { type: 'number', example: 1250.5 },
          kualitasGrade: { type: 'string', enum: ['Grade A (Premium)', 'Grade B (Standar)', 'Grade C (Pakan)'] },
          petaniPenanggungJawab: { type: 'string', example: 'Ibu Siti' },
          status: { type: 'string', enum: ['Siap Panen', 'Dalam Proses', 'Selesai', 'Tersimpan di Gudang'] },
          catatan: { type: 'string' },
          fotoUrl: { type: 'string', nullable: true },
          createdAt: { type: 'string' },
        },
      },
      Variety: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          name: { type: 'string', example: 'Sorgum Bioguma 1' },
          description: { type: 'string' },
          imageUrl: { type: 'string', nullable: true },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string' },
        },
      },
      LandPlot: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          kodeLahan: { type: 'string', example: 'BLK-001' },
          namaLahan: { type: 'string', example: 'Blok A - Sukamaju' },
          lokasiDesa: { type: 'string', example: 'Sukamaju' },
          kecamatan: { type: 'string', example: 'Cisalak' },
          luasHektar: { type: 'number', example: 2.5 },
          varietasSorgum: { type: 'string', example: 'Sorgum Bioguma 1' },
          statusIrigasi: { type: 'string', enum: ['Irigasi Teknis', 'Tadah Hujan', 'Semi Teknis'] },
          jenisTanah: { type: 'string', example: 'Aluvial' },
          pemilikKelompokTani: { type: 'string', example: 'KWT Sukamaju Tani' },
          statusKesiapan: { type: 'string', enum: ['Siap Tanam', 'Masa Pertumbuhan', 'Masa Panen', 'Bera (Istirahat)'] },
          statusBadge: { type: 'string', nullable: true },
          panenLaluTon: { type: 'number', example: 12.4 },
          fotoUrl: { type: 'string', nullable: true },
          latitude: { type: 'number', nullable: true },
          longitude: { type: 'number', nullable: true },
          createdAt: { type: 'string' },
        },
      },
      Equipment: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          kodeAlat: { type: 'string', example: 'ALT-001' },
          namaPeralatan: { type: 'string', example: 'Traktor Roda Dua' },
          kategori: { type: 'string', example: 'Alat Berat' },
          jumlahStok: { type: 'number', example: 2 },
          kondisi: { type: 'string', enum: ['Sangat Baik', 'Baik', 'Perlu Perbaikan', 'Rusak'] },
          status: { type: 'string', enum: ['Tersedia', 'Sedang Digunakan', 'Dalam Perawatan', 'Diarsipkan'] },
          lokasiPenyimpanan: { type: 'string', example: 'Gudang Utama' },
          tanggalPengadaan: { type: 'string', example: '2025-03-10' },
          spesifikasi: { type: 'string' },
          fotoUrl: { type: 'string' },
          terakhirServis: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
      ProductionBatch: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          kodeBatch: { type: 'string', example: 'PRD-0001' },
          namaProduk: { type: 'string', example: 'Tepung Sorgum 250g' },
          kategori: { type: 'string', enum: ['Raw (Bahan Mentah)', 'Ready to Eat (Siap Konsumsi)'] },
          tanggalProduksi: { type: 'string', example: '2026-07-20' },
          tanggalKadaluarsa: { type: 'string', example: '2027-07-20' },
          jumlahHasil: { type: 'number', example: 500 },
          satuan: { type: 'string', example: 'pcs' },
          nomorBatchBahanBaku: { type: 'string' },
          operatorProduksi: { type: 'string' },
          statusQC: { type: 'string', enum: ['Lolos QC', 'Pending QC', 'Revisi Batch'] },
          lokasiGudang: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
      Certificate: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          kodeDokumen: { type: 'string', example: 'CERT-001' },
          namaSertifikat: { type: 'string', example: 'Sertifikat Halal' },
          penerbitSertifikat: { type: 'string', example: 'BPJPH' },
          nomorSertifikat: { type: 'string', example: 'ID31110001294812' },
          tanggalTerbit: { type: 'string', example: '12 Maret 2024' },
          tanggalKadaluarsa: { type: 'string', example: '12 Maret 2028' },
          status: { type: 'string', enum: ['AKTIF', 'PROSES', 'KADALUARSA'] },
          jenisDokumen: { type: 'string', enum: ['Sertifikat Halal', 'Izin P-IRT', 'Uji Lab Nutrisi', 'Sertifikat Organik', 'Lainnya'] },
          fileUrl: { type: 'string' },
          fileName: { type: 'string' },
          fileType: { type: 'string' },
          keterangan: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
      Packaging: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          kodeKemasan: { type: 'string', example: 'KMS-001' },
          namaKemasan: { type: 'string', example: 'Standing Pouch 250g' },
          kategori: { type: 'string', enum: ['Standing Pouch', 'Box Custom', 'Karung Bulk', 'Botol Kaca', 'Aksesoris'] },
          kapasitas: { type: 'string' },
          stokTersedia: { type: 'number', example: 1200 },
          satuan: { type: 'string', example: 'pcs' },
          stokMinimal: { type: 'number', example: 1000 },
          pemasok: { type: 'string' },
          hargaPerUnitRp: { type: 'number', example: 1500 },
          statusStok: { type: 'string', enum: ['Stok Cukup', 'Stok Menipis', 'Habis'] },
          extraData: {},
          createdAt: { type: 'string' },
        },
      },
      FinancialExpense: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          kodeTransaksi: { type: 'string', example: 'INV-0001' },
          tanggal: { type: 'string', example: '14 Mei 2026' },
          kategori: { type: 'string', enum: ['Bahan Baku', 'Transportasi', 'Operasional', 'Kemasan', 'Perawatan Peralatan', 'Sertifikasi'] },
          keteranganVendor: { type: 'string', example: 'PT Transport Jaya' },
          totalBiayaRp: { type: 'number', example: 250000 },
          statusPembayaran: { type: 'string', enum: ['LUNAS', 'PENDING', 'DIBATALKAN'] },
          metodePembayaran: { type: 'string', enum: ['Transfer Bank', 'Kas Tunai', 'E-Wallet', 'Giro'] },
          nomorNotaReceipt: { type: 'string' },
          detailItem: { type: 'array', items: {} },
          catatanNota: { type: 'string' },
          notaUrl: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          judul: { type: 'string', example: 'Sertifikat Halal Diperbarui' },
          pesan: { type: 'string' },
          kategori: { type: 'string', enum: ['sertifikat', 'panen', 'produksi', 'logistik', 'sistem'] },
          isRead: { type: 'boolean', example: false },
          createdAt: { type: 'string' },
        },
      },
      ApiKey: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          nama: { type: 'string', example: 'Aplikasi Laporan' },
          keyPreview: { type: 'string', example: 'sk-abc123...z9x8' },
          isActive: { type: 'boolean', example: true },
          lastUsedAt: { type: 'string', nullable: true },
          createdAt: { type: 'string' },
          revokedAt: { type: 'string', nullable: true },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          name: { type: 'string', example: 'Tepung Sorgum 250g' },
          satuanHasil: { type: 'string', enum: ['Pouch', 'Kg', 'Botol', 'Box', 'Toples', 'Kemasan'], example: 'Pouch' },
          deskripsi: { type: 'string' },
          fotoUrl: { type: 'string', nullable: true },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string' },
        },
      },
      Planting: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          kodeTanam: { type: 'string', example: 'TNM-0001' },
          lahanId: { type: 'string', example: '1' },
          kodeLahan: { type: 'string', nullable: true },
          namaLahan: { type: 'string', nullable: true },
          tanggalTanam: { type: 'string', example: '2026-01-10' },
          estimasiPanen: { type: 'string', example: '2026-04-15' },
          varietas: { type: 'string', example: 'Sorgum Bioguma 1' },
          jumlahLubang: { type: 'number', example: 2000 },
          luasTanam: { type: 'number', nullable: true, example: 1.5 },
          petugas: { type: 'string', example: 'Ibu Siti' },
          statusTanam: { type: 'string', enum: ['Ditanam', 'Tumbuh', 'Siap Panen', 'Gagal', 'Dipanen'] },
          catatan: { type: 'string' },
          fotoUrl: { type: 'string', nullable: true },
          createdAt: { type: 'string' },
          jumlahPanen: { type: 'number', example: 3 },
          panenKeTerakhir: { type: 'number', nullable: true },
        },
      },
      Warehouse: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          kodeGudang: { type: 'string', example: 'GDG-LUS-01' },
          namaGudang: { type: 'string', example: 'Gudang Lahan A' },
          lahanId: { type: 'string', nullable: true },
          lokasi: { type: 'string' },
          totalStokKg: { type: 'number', example: 1500 },
          stokGabahKg: { type: 'number', example: 1000 },
          stokSorgumKg: { type: 'number', example: 500 },
          lahan: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              kodeLahan: { type: 'string' },
              namaLahan: { type: 'string' },
              lokasiDesa: { type: 'string' },
              pemilikKelompokTani: { type: 'string', nullable: true },
            },
          },
          createdAt: { type: 'string' },
        },
      },
      StockBatch: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          gudangId: { type: 'string', example: '1' },
          harvestId: { type: 'string', nullable: true },
          jenis: { type: 'string', enum: ['GABAH', 'SORGUM'], example: 'GABAH' },
          asalBatchId: { type: 'string', nullable: true },
          kodeBatchStok: { type: 'string', example: 'GAB-LUS-10012026-01' },
          jumlahMasukKg: { type: 'number', example: 500 },
          sisaKg: { type: 'number', example: 500 },
          tanggalMasuk: { type: 'string', nullable: true },
          tanggalSosoh: { type: 'string', nullable: true },
          operatorSosoh: { type: 'string', nullable: true },
          asalBatch: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              kodeBatchStok: { type: 'string' },
              jumlahMasukKg: { type: 'number' },
            },
          },
          harvest: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              kodePanen: { type: 'string' },
              tanggalPanen: { type: 'string' },
              varietas: { type: 'string' },
            },
          },
          createdAt: { type: 'string' },
        },
      },
    },
  },
  paths: {
    // ── Health ────────────────────────────────────────────────────────────
    '/health': {
      get: {
        tags: ['Kesehatan'],
        summary: 'Cek status server',
        responses: {
          200: {
            description: 'Server aktif',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Sorgum SCM API is running.',
                  timestamp: '2026-08-08T00:00:00.000Z',
                },
              },
            },
          },
        },
      },
    },

    // ── Auth ──────────────────────────────────────────────────────────────
    '/auth/register': {
      post: {
        tags: ['Autentikasi'],
        summary: 'Daftar akun baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'email', 'password'],
                properties: {
                  fullName: { type: 'string', example: 'Ibu Siti Aminah' },
                  email: { type: 'string', example: 'siti@example.com' },
                  phone: { type: 'string', example: '081234567890' },
                  password: { type: 'string', minLength: 6, example: 'rahasia123' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Berhasil daftar, token + user dikembalikan' },
          400: { description: 'Validasi gagal' },
          409: { description: 'Email sudah terdaftar' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Autentikasi'],
        summary: 'Login (email + sandi)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['usernameOrEmail', 'password'],
                properties: {
                  usernameOrEmail: { type: 'string', example: 'admin@sorgum.com' },
                  password: { type: 'string', example: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Berhasil login',
            content: {
              'application/json': {
                example: {
                  success: true,
                  token: 'eyJhbGciOiJIUzI1NiIs...',
                  user: { id: '1', name: 'Admin Sorgum SCM', email: 'admin@sorgum.com' },
                },
              },
            },
          },
          400: { description: 'Email atau sandi kosong' },
          401: { description: 'Email atau sandi salah' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Autentikasi'],
        summary: 'Logout (stateless — hapus token di sisi klien)',
        responses: { 200: { description: 'Berhasil logout' } },
      },
    },
    '/auth/me': {
      get: {
        security: [{ bearerAuth: [] }],
        tags: ['Autentikasi'],
        summary: 'Ambil profil user aktif',
        responses: { 200: { description: 'Profil user' }, 401: { description: 'Token tidak valid' } },
      },
      put: {
        security: [{ bearerAuth: [] }],
        tags: ['Autentikasi'],
        summary: 'Perbarui profil user aktif',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  avatar: { type: 'string', description: 'Data URL base64 (max 2MB)' },
                  alamat: { type: 'string' },
                  kecamatan: { type: 'string' },
                  kabupaten: { type: 'string' },
                  bio: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Profil diperbarui' }, 400: { description: 'Validasi gagal' }, 401: { description: 'Token tidak valid' } },
      },
    },
    '/auth/me/password': {
      put: {
        security: [{ bearerAuth: [] }],
        tags: ['Autentikasi'],
        summary: 'Ganti kata sandi',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', example: 'password' },
                  newPassword: { type: 'string', minLength: 6, example: 'passwordBaru123' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Sandi diganti' }, 400: { description: 'Sandi salah / terlalu pendek' }, 401: { description: 'Token tidak valid' } },
      },
    },

    // ── API Keys ──────────────────────────────────────────────────────────
    '/keys': {
      get: {
        security: [{ bearerAuth: [] }],
        tags: ['API Key'],
        summary: 'Daftar API key (hanya preview)',
        responses: { 200: { description: 'Daftar key' }, 401: { description: 'Wajib login' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['API Key'],
        summary: 'Buat API key baru (key penuh hanya ditampilkan sekali)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nama'],
                properties: { nama: { type: 'string', example: 'Aplikasi Laporan Tahunan' } },
              },
            },
          },
        },
        responses: {
          201: { description: 'Key dibuat, kembalikan keyValue penuh' },
          400: { description: 'Nama wajib diisi' },
          401: { description: 'Wajib login' },
        },
      },
    },
    '/keys/{id}': {
      put: {
        security: [{ bearerAuth: [] }],
        tags: ['API Key'],
        summary: 'Aktifkan / nonaktifkan API key',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isActive'],
                properties: { isActive: { type: 'boolean', example: false } },
              },
            },
          },
        },
        responses: { 200: { description: 'Key diperbarui' }, 404: { description: 'Key tidak ditemukan' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['API Key'],
        summary: 'Hapus API key',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Key dihapus' }, 404: { description: 'Key tidak ditemukan' } },
      },
    },

    // ── Panen ─────────────────────────────────────────────────────────────
    '/harvest': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Panen'],
        summary: 'Daftar panen (pagination + filter)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Cari di kode/nama lahan/varietas/petani' },
          { name: 'lahan', in: 'query', schema: { type: 'string' } },
          { name: 'varietas', in: 'query', schema: { type: 'string' } },
          { name: 'tanggalAwal', in: 'query', schema: { type: 'string', example: '2026-01-01' } },
          { name: 'tanggalAkhir', in: 'query', schema: { type: 'string', example: '2026-12-31' } },
          { name: 'grade', in: 'query', schema: { type: 'string', enum: ['Grade A (Premium)', 'Grade B (Standar)', 'Grade C (Pakan)'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['Siap Panen', 'Dalam Proses', 'Selesai', 'Tersimpan di Gudang'] } },
        ],
        responses: { 200: { description: 'Daftar panen + pagination' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Panen'],
        summary: 'Tambah data panen',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['namaLahan', 'varietas', 'tanggalPanen', 'jumlahHasilKg', 'petaniPenanggungJawab'],
                properties: {
                  kodePanen: { type: 'string', description: 'Otomatis jika kosong' },
                  namaLahan: { type: 'string', example: 'Blok A - Sukamaju' },
                  varietas: { type: 'string', example: 'Sorgum Bioguma 1' },
                  tanggalPanen: { type: 'string', example: '2026-07-15' },
                  jumlahHasilKg: { type: 'number', example: 1250.5 },
                  kualitasGrade: { type: 'string', enum: ['Grade A (Premium)', 'Grade B (Standar)', 'Grade C (Pakan)'] },
                  petaniPenanggungJawab: { type: 'string', example: 'Ibu Siti' },
                  status: { type: 'string', enum: ['Siap Panen', 'Dalam Proses', 'Selesai', 'Tersimpan di Gudang'] },
                  catatan: { type: 'string' },
                  fotoUrl: { type: 'string', description: 'Data URL base64' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Panen dibuat' }, 400: { description: 'Validasi gagal' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/harvest/{id}': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Panen'],
        summary: 'Detail satu panen',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Data panen' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        security: [{ bearerAuth: [] }],
        tags: ['Panen'],
        summary: 'Perbarui data panen',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Panen diperbarui' }, 401: { description: 'Wajib JWT' }, 404: { description: 'Tidak ditemukan' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Panen'],
        summary: 'Hapus data panen',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Panen dihapus' }, 401: { description: 'Wajib JWT' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    // ── Varietas ──────────────────────────────────────────────────────────
    '/varieties': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Varietas'],
        summary: 'Daftar varietas sorgum',
        responses: { 200: { description: 'Daftar varietas' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Varietas'],
        summary: 'Tambah varietas',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Sorgum Bioguma 4' },
                  description: { type: 'string' },
                  imageUrl: { type: 'string', description: 'Data URL base64' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Varietas dibuat' }, 400: { description: 'Nama wajib' }, 409: { description: 'Nama sudah ada' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/varieties/{id}': {
      put: {
        security: [{ bearerAuth: [] }],
        tags: ['Varietas'],
        summary: 'Perbarui varietas',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  isActive: { type: 'boolean' },
                  imageUrl: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Varietas diperbarui' }, 404: { description: 'Tidak ditemukan' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Varietas'],
        summary: 'Hapus varietas (ditolak jika dipakai data panen)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Varietas dihapus' }, 409: { description: 'Sedang dipakai panen' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    // ── Lahan ─────────────────────────────────────────────────────────────
    '/land': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Lahan'],
        summary: 'Daftar lahan (pagination + search)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Daftar lahan + pagination' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Lahan'],
        summary: 'Tambah lahan (foto WAJIB)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['namaLahan', 'lokasiDesa', 'kecamatan', 'luasHektar', 'fotoUrl'],
                properties: {
                  namaLahan: { type: 'string', example: 'Blok G - Cigombong' },
                  lokasiDesa: { type: 'string', example: 'Cigombong' },
                  kecamatan: { type: 'string', example: 'Cigombong' },
                  luasHektar: { type: 'number', example: 2.0 },
                  varietasSorgum: { type: 'string', example: 'Sorgum Bioguma 1' },
                  statusIrigasi: { type: 'string', enum: ['Irigasi Teknis', 'Tadah Hujan', 'Semi Teknis'] },
                  jenisTanah: { type: 'string' },
                  pemilikKelompokTani: { type: 'string' },
                  statusKesiapan: { type: 'string', enum: ['Siap Tanam', 'Masa Pertumbuhan', 'Masa Panen', 'Bera (Istirahat)'] },
                  panenLaluTon: { type: 'number' },
                  fotoUrl: { type: 'string', description: 'Data URL base64 — WAJIB' },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Lahan dibuat' }, 400: { description: 'Validasi gagal (termasuk foto wajib)' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/land/{id}': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Lahan'],
        summary: 'Detail satu lahan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Data lahan' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        security: [{ bearerAuth: [] }],
        tags: ['Lahan'],
        summary: 'Perbarui lahan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Lahan diperbarui' }, 400: { description: 'Foto kosong ditolak' }, 404: { description: 'Tidak ditemukan' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Lahan'],
        summary: 'Hapus lahan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Lahan dihapus' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    // ── Peralatan ─────────────────────────────────────────────────────────
    '/equipment': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Peralatan'],
        summary: 'Daftar peralatan (pagination + search)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Daftar peralatan + pagination' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Peralatan'],
        summary: 'Tambah peralatan',
        responses: { 201: { description: 'Peralatan dibuat' }, 400: { description: 'Validasi gagal' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/equipment/{id}': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Peralatan'],
        summary: 'Detail peralatan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Data peralatan' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        security: [{ bearerAuth: [] }],
        tags: ['Peralatan'],
        summary: 'Perbarui peralatan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Peralatan diperbarui' }, 404: { description: 'Tidak ditemukan' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Peralatan'],
        summary: 'Hapus peralatan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Peralatan dihapus' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    // ── Produksi ──────────────────────────────────────────────────────────
    '/production': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Produksi'],
        summary: 'Daftar batch produksi (pagination + filter)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'kategori', in: 'query', schema: { type: 'string', enum: ['Raw (Bahan Mentah)', 'Ready to Eat (Siap Konsumsi)'] } },
        ],
        responses: { 200: { description: 'Daftar produksi + pagination' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Produksi'],
        summary: 'Tambah batch produksi',
        responses: { 201: { description: 'Batch dibuat' }, 400: { description: 'Validasi gagal' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/production/{id}': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Produksi'],
        summary: 'Detail batch produksi',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Data batch' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        security: [{ bearerAuth: [] }],
        tags: ['Produksi'],
        summary: 'Perbarui batch produksi',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Batch diperbarui' }, 404: { description: 'Tidak ditemukan' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Produksi'],
        summary: 'Hapus batch produksi',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Batch dihapus' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    // ── Sertifikat ────────────────────────────────────────────────────────
    '/certificates': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Sertifikat'],
        summary: 'Daftar sertifikat (pagination + search)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Daftar sertifikat + pagination' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Sertifikat'],
        summary: 'Tambah sertifikat',
        responses: { 201: { description: 'Sertifikat dibuat' }, 400: { description: 'Validasi gagal' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/certificates/{id}': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Sertifikat'],
        summary: 'Detail sertifikat',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Data sertifikat' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        security: [{ bearerAuth: [] }],
        tags: ['Sertifikat'],
        summary: 'Perbarui sertifikat',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Sertifikat diperbarui' }, 404: { description: 'Tidak ditemukan' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Sertifikat'],
        summary: 'Hapus sertifikat',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Sertifikat dihapus' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    // ── Kemasan ───────────────────────────────────────────────────────────
    '/packaging': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Kemasan'],
        summary: 'Daftar kemasan (pagination + filter kategori)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'kategori', in: 'query', schema: { type: 'string', enum: ['Standing Pouch', 'Box Custom', 'Karung Bulk', 'Botol Kaca', 'Aksesoris'] } },
        ],
        responses: { 200: { description: 'Daftar kemasan + pagination' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Kemasan'],
        summary: 'Tambah bahan kemasan',
        responses: { 201: { description: 'Kemasan dibuat' }, 400: { description: 'Validasi gagal' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/packaging/{id}': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Kemasan'],
        summary: 'Detail kemasan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Data kemasan' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        security: [{ bearerAuth: [] }],
        tags: ['Kemasan'],
        summary: 'Perbarui kemasan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Kemasan diperbarui' }, 404: { description: 'Tidak ditemukan' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Kemasan'],
        summary: 'Hapus kemasan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Kemasan dihapus' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    // ── Logistik ──────────────────────────────────────────────────────────
    '/logistics': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Logistik'],
        summary: 'Daftar pengeluaran logistik (pagination + filter)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'kategori', in: 'query', schema: { type: 'string', enum: ['Bahan Baku', 'Transportasi', 'Operasional', 'Kemasan', 'Perawatan Peralatan', 'Sertifikasi'] } },
        ],
        responses: { 200: { description: 'Daftar logistik + pagination' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Logistik'],
        summary: 'Catat pengeluaran baru',
        responses: { 201: { description: 'Transaksi dibuat' }, 400: { description: 'Validasi gagal' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/logistics/{id}': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Logistik'],
        summary: 'Detail pengeluaran',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Data transaksi' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        security: [{ bearerAuth: [] }],
        tags: ['Logistik'],
        summary: 'Perbarui pengeluaran',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Transaksi diperbarui' }, 404: { description: 'Tidak ditemukan' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Logistik'],
        summary: 'Hapus pengeluaran',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Transaksi dihapus' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    // ── Notifikasi ────────────────────────────────────────────────────────
    '/notifications': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Notifikasi'],
        summary: 'Daftar notifikasi (max 50, terbaru dulu) + jumlah belum dibaca',
        responses: { 200: { description: 'Daftar notifikasi + unread' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Notifikasi'],
        summary: 'Buat notifikasi',
        responses: { 201: { description: 'Notifikasi dibuat' }, 400: { description: 'Judul/pesan wajib' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/notifications/{id}/read': {
      put: {
        security: [{ bearerAuth: [] }],
        tags: ['Notifikasi'],
        summary: 'Tandai notifikasi dibaca (id = "all" untuk semua)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', example: 'all' } }],
        responses: { 200: { description: 'Notifikasi ditandai dibaca' }, 404: { description: 'Tidak ditemukan' } },
      },
    },
    '/notifications/{id}': {
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Notifikasi'],
        summary: 'Hapus notifikasi',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Notifikasi dihapus' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    '/cms': {
      get: {
        tags: ['CMS'],
        summary: 'Ambil konten landing page (publik — tanpa auth)',
        responses: { 200: { description: 'Konten CMS (objek JSON)' } },
      },
      put: {
        security: [{ bearerAuth: [] }],
        tags: ['CMS'],
        summary: 'Simpan konten landing page',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', description: 'Objek CmsData lengkap' } } },
        },
        responses: { 200: { description: 'Konten disimpan' }, 401: { description: 'Wajib JWT' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['CMS'],
        summary: 'Reset konten ke default',
        responses: { 200: { description: 'Konten direset' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/cms/settings/{key}': {
      get: {
        tags: ['CMS'],
        summary: 'Ambil satu setting CMS (mis. app_units)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string', example: 'app_units' } }],
        responses: { 200: { description: 'Nilai setting' }, 401: { description: 'Wajib JWT' } },
      },
      put: {
        tags: ['CMS'],
        summary: 'Simpan satu setting CMS',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string', example: 'app_units' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['value'],
                properties: { value: { type: 'string', description: 'Nilai JSON string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Setting disimpan' }, 401: { description: 'Wajib JWT' } },
      },
    },

    // ── Produk Olahan (Master Data) ──────────────────────────────────────
    '/products': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Produk Olahan'],
        summary: 'Daftar produk olahan (master data)',
        parameters: [
          { name: 'isActive', in: 'query', schema: { type: 'string', enum: ['true', 'false'] }, description: 'Filter produk aktif / nonaktif' },
        ],
        responses: { 200: { description: 'Daftar produk' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Produk Olahan'],
        summary: 'Tambah produk olahan',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Tepung Sorgum 250g' },
                  satuanHasil: { type: 'string', enum: ['Pouch', 'Kg', 'Botol', 'Box', 'Toples', 'Kemasan'], example: 'Pouch' },
                  deskripsi: { type: 'string' },
                  fotoUrl: { type: 'string', description: 'Data URL base64' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Produk dibuat' }, 400: { description: 'Nama wajib' }, 409: { description: 'Nama sudah ada' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/products/{id}': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Produk Olahan'],
        summary: 'Detail produk olahan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Data produk' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        security: [{ bearerAuth: [] }],
        tags: ['Produk Olahan'],
        summary: 'Perbarui produk olahan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  satuanHasil: { type: 'string', enum: ['Pouch', 'Kg', 'Botol', 'Box', 'Toples', 'Kemasan'] },
                  deskripsi: { type: 'string' },
                  fotoUrl: { type: 'string' },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Produk diperbarui' }, 404: { description: 'Tidak ditemukan' }, 401: { description: 'Wajib JWT' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Produk Olahan'],
        summary: 'Hapus produk olahan',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Produk dihapus' }, 404: { description: 'Tidak ditemukan' }, 401: { description: 'Wajib JWT' } },
      },
    },

    // ── Penanaman ────────────────────────────────────────────────────────
    '/plantings': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Penanaman'],
        summary: 'Daftar penanaman (pagination + filter)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Cari kode tanam / varietas / petugas / lahan' },
          { name: 'lahanId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['Ditanam', 'Tumbuh', 'Siap Panen', 'Gagal', 'Dipanen'] } },
        ],
        responses: { 200: { description: 'Daftar penanaman + pagination' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Penanaman'],
        summary: 'Tambah penanaman baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['lahanId', 'tanggalTanam', 'varietas', 'petugas'],
                properties: {
                  kodeTanam: { type: 'string', description: 'Otomatis jika kosong' },
                  lahanId: { type: 'string', example: '1' },
                  tanggalTanam: { type: 'string', example: '2026-01-10' },
                  estimasiPanen: { type: 'string', example: '2026-04-15' },
                  varietas: { type: 'string', example: 'Sorgum Bioguma 1' },
                  jumlahLubang: { type: 'number', example: 2000 },
                  luasTanam: { type: 'number', example: 1.5 },
                  petugas: { type: 'string', example: 'Ibu Siti' },
                  statusTanam: { type: 'string', enum: ['Ditanam', 'Tumbuh', 'Siap Panen', 'Gagal', 'Dipanen'] },
                  catatan: { type: 'string' },
                  fotoUrl: { type: 'string', description: 'Data URL base64' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Penanaman dibuat' }, 400: { description: 'Validasi gagal' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/plantings/{id}': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Penanaman'],
        summary: 'Detail penanaman',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Data penanaman' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        security: [{ bearerAuth: [] }],
        tags: ['Penanaman'],
        summary: 'Perbarui penanaman',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Penanaman diperbarui' }, 404: { description: 'Tidak ditemukan' }, 401: { description: 'Wajib JWT' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Penanaman'],
        summary: 'Hapus penanaman',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Penanaman dihapus' }, 404: { description: 'Tidak ditemukan' }, 401: { description: 'Wajib JWT' } },
      },
    },

    // ── Gudang & Stok ────────────────────────────────────────────────────
    '/warehouse': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Gudang'],
        summary: 'Daftar gudang (pagination + search)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Cari kode/nama/lokasi gudang' },
        ],
        responses: { 200: { description: 'Daftar gudang + pagination' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Gudang'],
        summary: 'Tambah gudang baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['namaGudang'],
                properties: {
                  kodeGudang: { type: 'string', description: 'Otomatis jika kosong' },
                  namaGudang: { type: 'string', example: 'Gudang Lahan A' },
                  lahanId: { type: 'string', description: 'Kosongkan untuk gudang umum' },
                  lokasi: { type: 'string', example: 'Dusun Krajan' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Gudang dibuat' }, 400: { description: 'Validasi gagal' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/warehouse/options': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Gudang'],
        summary: 'Daftar ringkas gudang (untuk dropdown)',
        responses: { 200: { description: 'Daftar {id, kodeGudang, namaGudang}' }, 401: { description: 'Butuh JWT atau API key' } },
      },
    },
    '/warehouse/harvest-options': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Gudang'],
        summary: 'Daftar panen yang belum penuh masuk gudang (untuk dropdown stok masuk)',
        responses: { 200: { description: 'Daftar panen + sisaBelumMasukKg' }, 401: { description: 'Butuh JWT atau API key' } },
      },
    },
    '/warehouse/stock-sorgum/all': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Gudang'],
        summary: 'Semua batch stok SORGUM yang tersedia lintas gudang (untuk dropdown bahan produksi)',
        responses: { 200: { description: 'Daftar batch SORGUM + info gudang' }, 401: { description: 'Butuh JWT atau API key' } },
      },
    },
    '/warehouse/{id}': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Gudang'],
        summary: 'Detail gudang (termasuk stockBatches, movements, sosohList)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Data gudang lengkap' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        security: [{ bearerAuth: [] }],
        tags: ['Gudang'],
        summary: 'Perbarui gudang',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Gudang diperbarui' }, 404: { description: 'Tidak ditemukan' }, 401: { description: 'Wajib JWT' } },
      },
      delete: {
        security: [{ bearerAuth: [] }],
        tags: ['Gudang'],
        summary: 'Hapus gudang (hanya jika stok kosong)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Gudang dihapus' }, 400: { description: 'Masih ada stok' }, 404: { description: 'Tidak ditemukan' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/warehouse/{id}/stock-batches': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Gudang'],
        summary: 'Daftar batch SORGUM tersisa di gudang',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Daftar batch' }, 401: { description: 'Butuh JWT atau API key' } },
      },
    },
    '/warehouse/{id}/history': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Gudang'],
        summary: 'Riwayat aktivitas gudang (masuk/keluar/sosoh)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'bulan', in: 'query', schema: { type: 'string', example: '2026-08' }, description: 'Filter bulan (YYYY-MM)' },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'tipe', in: 'query', schema: { type: 'string', enum: ['MASUK', 'KELUAR', 'SOSOH'] } },
        ],
        responses: { 200: { description: 'Riwayat + pagination' }, 401: { description: 'Butuh JWT atau API key' } },
      },
    },
    '/warehouse/{gudangId}/trace/{batchId}': {
      get: {
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        tags: ['Gudang'],
        summary: 'Trace lengkap batch stok (tanam → panen → gudang → olahan → logistik)',
        parameters: [
          { name: 'gudangId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'batchId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Trace batch' }, 404: { description: 'Batch tidak ditemukan' }, 401: { description: 'Butuh JWT atau API key' } },
      },
    },
    '/warehouse/stock/in': {
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Gudang'],
        summary: 'Catat stok masuk (gabah dari panen)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['harvestId', 'jumlahKg'],
                properties: {
                  harvestId: { type: 'string', example: '1' },
                  jumlahKg: { type: 'number', example: 500 },
                  tanggalMasuk: { type: 'string', example: '2026-08-01', description: 'Opsional, default hari ini' },
                  keterangan: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Stok masuk tercatat' }, 400: { description: 'Melebihi sisa panen / lahan belum punya gudang' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/warehouse/stock/out': {
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Gudang'],
        summary: 'Catat stok keluar (SORGUM untuk olahan)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['gudangId', 'stockBatchId', 'jumlahKg'],
                properties: {
                  gudangId: { type: 'string', example: '1' },
                  stockBatchId: { type: 'string', example: '1' },
                  jumlahKg: { type: 'number', example: 100 },
                  keterangan: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Stok keluar tercatat' }, 400: { description: 'Melebihi sisa batch' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/warehouse/stock/sosoh': {
      post: {
        security: [{ bearerAuth: [] }],
        tags: ['Gudang'],
        summary: 'Proses sosoh (gabah → sorgum)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['gudangId', 'batchGabahId', 'kgGabah', 'kgHasilSorgum'],
                properties: {
                  gudangId: { type: 'string', example: '1' },
                  batchGabahId: { type: 'string', example: '1' },
                  kgGabah: { type: 'number', example: 500 },
                  kgHasilSorgum: { type: 'number', example: 350 },
                  operator: { type: 'string', example: 'Ibu Siti' },
                  keterangan: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Sosoh diproses' }, 400: { description: 'Validasi gagal / hanya batch GABAH' }, 401: { description: 'Wajib JWT' } },
      },
    },

    // ── Public Trace (QR) ────────────────────────────────────────────────
    '/public/trace/{kodeBatchStok}': {
      get: {
        tags: ['Publik'],
        summary: 'Trace batch stok publik via QR (tanpa autentikasi)',
        description: 'Digunakan untuk memindai QR pada kemasan/stok.',
        parameters: [{ name: 'kodeBatchStok', in: 'path', required: true, schema: { type: 'string', example: 'GAB-LUS-10012026-01' } }],
        responses: { 200: { description: 'Data trace publik' }, 404: { description: 'Batch tidak ditemukan' } },
      },
    },
  },
};
