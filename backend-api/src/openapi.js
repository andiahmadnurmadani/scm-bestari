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
      '- Endpoint GET read-only **membutuhkan autentikasi** via header `x-api-key`. Endpoint tulis memakai JWT (login).\n' +
      '- Endpoint **tulis** (POST/PUT/DELETE) hanya bisa diakses dengan **JWT** (login).\n' +
      '- Format respons selalu `{ success, message?, data?, pagination? }`.\n' +
      '- UI interaktif ini bisa digunakan langsung (tombol "Try it").',
    version: '1.0.0',
    contact: {
      name: 'Sorgum SCM',
      email: 'support@sorgumscm.id',
    },
  },
  servers: [
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
        description: 'Token dari POST /auth/login (Authorization: Bearer <token>)',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'API key read-only (dikelola di /api/keys). Header: x-api-key',
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
        tags: ['Autentikasi'],
        summary: 'Ambil profil user aktif',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Profil user' }, 401: { description: 'Token tidak valid' } },
      },
      put: {
        tags: ['Autentikasi'],
        summary: 'Perbarui profil user aktif',
        security: [{ bearerAuth: [] }],
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
        tags: ['Autentikasi'],
        summary: 'Ganti kata sandi',
        security: [{ bearerAuth: [] }],
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
        tags: ['API Key'],
        summary: 'Daftar API key (hanya preview)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar key' }, 401: { description: 'Wajib login' } },
      },
      post: {
        tags: ['API Key'],
        summary: 'Buat API key baru (key penuh hanya ditampilkan sekali)',
        security: [{ bearerAuth: [] }],
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
        tags: ['API Key'],
        summary: 'Aktifkan / nonaktifkan API key',
        security: [{ bearerAuth: [] }],
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
        tags: ['API Key'],
        summary: 'Hapus API key',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Key dihapus' }, 404: { description: 'Key tidak ditemukan' } },
      },
    },

    // ── Panen ─────────────────────────────────────────────────────────────
    '/harvest': {
      get: {
        tags: ['Panen'],
        summary: 'Daftar panen (pagination + filter)',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
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
        tags: ['Panen'],
        summary: 'Tambah data panen',
        security: [{ bearerAuth: [] }],
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
        tags: ['Panen'],
        summary: 'Detail satu panen',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Data panen' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        tags: ['Panen'],
        summary: 'Perbarui data panen',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Panen diperbarui' }, 401: { description: 'Wajib JWT' }, 404: { description: 'Tidak ditemukan' } },
      },
      delete: {
        tags: ['Panen'],
        summary: 'Hapus data panen',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Panen dihapus' }, 401: { description: 'Wajib JWT' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    // ── Varietas ──────────────────────────────────────────────────────────
    '/varieties': {
      get: {
        tags: ['Varietas'],
        summary: 'Daftar varietas sorgum',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        responses: { 200: { description: 'Daftar varietas' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        tags: ['Varietas'],
        summary: 'Tambah varietas',
        security: [{ bearerAuth: [] }],
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
        tags: ['Varietas'],
        summary: 'Perbarui varietas',
        security: [{ bearerAuth: [] }],
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
        tags: ['Varietas'],
        summary: 'Hapus varietas (ditolak jika dipakai data panen)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Varietas dihapus' }, 409: { description: 'Sedang dipakai panen' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    // ── Lahan ─────────────────────────────────────────────────────────────
    '/land': {
      get: {
        tags: ['Lahan'],
        summary: 'Daftar lahan (pagination + search)',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Daftar lahan + pagination' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        tags: ['Lahan'],
        summary: 'Tambah lahan (foto WAJIB)',
        security: [{ bearerAuth: [] }],
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
        tags: ['Lahan'],
        summary: 'Detail satu lahan',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Data lahan' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        tags: ['Lahan'],
        summary: 'Perbarui lahan',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Lahan diperbarui' }, 400: { description: 'Foto kosong ditolak' }, 404: { description: 'Tidak ditemukan' } },
      },
      delete: {
        tags: ['Lahan'],
        summary: 'Hapus lahan',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Lahan dihapus' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    // ── Peralatan ─────────────────────────────────────────────────────────
    '/equipment': {
      get: {
        tags: ['Peralatan'],
        summary: 'Daftar peralatan (pagination + search)',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Daftar peralatan + pagination' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        tags: ['Peralatan'],
        summary: 'Tambah peralatan',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Peralatan dibuat' }, 400: { description: 'Validasi gagal' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/equipment/{id}': {
      get: {
        tags: ['Peralatan'],
        summary: 'Detail peralatan',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Data peralatan' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        tags: ['Peralatan'],
        summary: 'Perbarui peralatan',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Peralatan diperbarui' }, 404: { description: 'Tidak ditemukan' } },
      },
      delete: {
        tags: ['Peralatan'],
        summary: 'Hapus peralatan',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Peralatan dihapus' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    // ── Produksi ──────────────────────────────────────────────────────────
    '/production': {
      get: {
        tags: ['Produksi'],
        summary: 'Daftar batch produksi (pagination + filter)',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'kategori', in: 'query', schema: { type: 'string', enum: ['Raw (Bahan Mentah)', 'Ready to Eat (Siap Konsumsi)'] } },
        ],
        responses: { 200: { description: 'Daftar produksi + pagination' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        tags: ['Produksi'],
        summary: 'Tambah batch produksi',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Batch dibuat' }, 400: { description: 'Validasi gagal' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/production/{id}': {
      get: {
        tags: ['Produksi'],
        summary: 'Detail batch produksi',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Data batch' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        tags: ['Produksi'],
        summary: 'Perbarui batch produksi',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Batch diperbarui' }, 404: { description: 'Tidak ditemukan' } },
      },
      delete: {
        tags: ['Produksi'],
        summary: 'Hapus batch produksi',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Batch dihapus' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    // ── Sertifikat ────────────────────────────────────────────────────────
    '/certificates': {
      get: {
        tags: ['Sertifikat'],
        summary: 'Daftar sertifikat (pagination + search)',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Daftar sertifikat + pagination' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        tags: ['Sertifikat'],
        summary: 'Tambah sertifikat',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Sertifikat dibuat' }, 400: { description: 'Validasi gagal' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/certificates/{id}': {
      get: {
        tags: ['Sertifikat'],
        summary: 'Detail sertifikat',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Data sertifikat' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        tags: ['Sertifikat'],
        summary: 'Perbarui sertifikat',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Sertifikat diperbarui' }, 404: { description: 'Tidak ditemukan' } },
      },
      delete: {
        tags: ['Sertifikat'],
        summary: 'Hapus sertifikat',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Sertifikat dihapus' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    // ── Kemasan ───────────────────────────────────────────────────────────
    '/packaging': {
      get: {
        tags: ['Kemasan'],
        summary: 'Daftar kemasan (pagination + filter kategori)',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'kategori', in: 'query', schema: { type: 'string', enum: ['Standing Pouch', 'Box Custom', 'Karung Bulk', 'Botol Kaca', 'Aksesoris'] } },
        ],
        responses: { 200: { description: 'Daftar kemasan + pagination' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        tags: ['Kemasan'],
        summary: 'Tambah bahan kemasan',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Kemasan dibuat' }, 400: { description: 'Validasi gagal' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/packaging/{id}': {
      get: {
        tags: ['Kemasan'],
        summary: 'Detail kemasan',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Data kemasan' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        tags: ['Kemasan'],
        summary: 'Perbarui kemasan',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Kemasan diperbarui' }, 404: { description: 'Tidak ditemukan' } },
      },
      delete: {
        tags: ['Kemasan'],
        summary: 'Hapus kemasan',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Kemasan dihapus' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    // ── Logistik ──────────────────────────────────────────────────────────
    '/logistics': {
      get: {
        tags: ['Logistik'],
        summary: 'Daftar pengeluaran logistik (pagination + filter)',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'kategori', in: 'query', schema: { type: 'string', enum: ['Bahan Baku', 'Transportasi', 'Operasional', 'Kemasan', 'Perawatan Peralatan', 'Sertifikasi'] } },
        ],
        responses: { 200: { description: 'Daftar logistik + pagination' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        tags: ['Logistik'],
        summary: 'Catat pengeluaran baru',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Transaksi dibuat' }, 400: { description: 'Validasi gagal' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/logistics/{id}': {
      get: {
        tags: ['Logistik'],
        summary: 'Detail pengeluaran',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Data transaksi' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        tags: ['Logistik'],
        summary: 'Perbarui pengeluaran',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Transaksi diperbarui' }, 404: { description: 'Tidak ditemukan' } },
      },
      delete: {
        tags: ['Logistik'],
        summary: 'Hapus pengeluaran',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Transaksi dihapus' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    // ── Notifikasi ────────────────────────────────────────────────────────
    '/notifications': {
      get: {
        tags: ['Notifikasi'],
        summary: 'Daftar notifikasi (max 50, terbaru dulu) + jumlah belum dibaca',
        security: [{ bearerAuth: [] }, { apiKey: [] }],
        responses: { 200: { description: 'Daftar notifikasi + unread' }, 401: { description: 'Butuh JWT atau API key' } },
      },
      post: {
        tags: ['Notifikasi'],
        summary: 'Buat notifikasi',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Notifikasi dibuat' }, 400: { description: 'Judul/pesan wajib' }, 401: { description: 'Wajib JWT' } },
      },
    },
    '/notifications/{id}/read': {
      put: {
        tags: ['Notifikasi'],
        summary: 'Tandai notifikasi dibaca (id = "all" untuk semua)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', example: 'all' } }],
        responses: { 200: { description: 'Notifikasi ditandai dibaca' }, 404: { description: 'Tidak ditemukan' } },
      },
    },
    '/notifications/{id}': {
      delete: {
        tags: ['Notifikasi'],
        summary: 'Hapus notifikasi',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Notifikasi dihapus' }, 404: { description: 'Tidak ditemukan' } },
      },
    },

    // ── CMS ───────────────────────────────────────────────────────────────
    '/cms': {
      get: {
        tags: ['CMS'],
        summary: 'Ambil konten landing page (publik — tanpa auth)',
        responses: { 200: { description: 'Konten CMS (objek JSON)' } },
      },
      put: {
        tags: ['CMS'],
        summary: 'Simpan konten landing page',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', description: 'Objek CmsData lengkap' } } },
        },
        responses: { 200: { description: 'Konten disimpan' }, 401: { description: 'Wajib JWT' } },
      },
      delete: {
        tags: ['CMS'],
        summary: 'Reset konten ke default',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Konten direset' }, 401: { description: 'Wajib JWT' } },
      },
    },
  },
};
