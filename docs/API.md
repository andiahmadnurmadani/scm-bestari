# 📘 Dokumentasi API Sorgum SCM

Sistem Manajemen Rantai Pasok Sorgum untuk **Kelompok Wanita Tani (KWT)**.
Semua data di aplikasi — lahan, penanaman, panen, gudang & stok, sosoh, olahan,
peralatan, sertifikat, kemasan, keuangan, notifikasi, dan konten web — bisa
diambil lewat API ini.

> ⚡ **Dokumentasi interaktif (Scalar)** — bisa mencoba langsung semua endpoint:
> - Utama: **https://scm.livinglabs.id/api/docs**
> - Demo: **https://scm1.livinglabs.id/api/docs**
> - Lokal: `http://localhost:8000/api/docs`
>
> Sumber kebenaran spesifikasi: [`backend-api/src/openapi.js`](../backend-api/src/openapi.js).
> Setiap menambah/mengubah endpoint atau field, perbarui file itu juga.

---

## 1. Info Dasar

| Item | Nilai |
|---|---|
| Base URL utama (data asli) | `https://scm.livinglabs.id/api` |
| Base URL demo (data contoh) | `https://scm1.livinglabs.id/api` |
| Base URL lokal | `http://localhost:8000/api` |
| Format | JSON (`Content-Type: application/json`) |
| Baca (GET) | **JWT** (`Authorization: Bearer <token>`) **atau** **API key** (`x-api-key: <kunci>`) |
| Tulis (POST/PUT/DELETE) | Wajib **JWT** |
| Respons sukses | `{ success: true, message?, data?, pagination? }` |
| Respons error | `{ success: false, message: "..." }` |
| Tanggal | `YYYY-MM-DD` (input `DD/MM/YYYY` juga dibaca benar). Zona waktu WIB. |
| ID | Selalu string |
| Gambar / berkas | Data URL base64 (`data:image/jpeg;base64,...`) |

Situs utama dan demo memakai **database, JWT, dan API key yang berbeda** —
kunci dari satu situs tidak berlaku di situs lainnya.

---

## 2. Mendapatkan API Key

- **Dari aplikasi:** login → **Profil** → tab **Pengaturan** → bagian API Key → **Salin**.
- **Lewat API:** `POST /keys` dengan body `{ "nama": "Aplikasi Laporan" }` (butuh JWT).
  Nilai kunci penuh hanya ditampilkan sekali.

```bash
curl -H "x-api-key: sk-..." "https://scm.livinglabs.id/api/harvest?limit=5"
```

> ⚠️ API key bersifat **read-only** (hanya GET). Jangan bagikan ke pihak yang tidak dipercaya.

---

## 3. Login (JWT)

```bash
curl -X POST https://scm.livinglabs.id/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"admin@sorgum.com","password":"<sandi>"}'
```

```json
{ "success": true, "token": "eyJhbGciOiJIUzI1NiIs...", "user": { "id": "1", "name": "Admin Sorgum SCM" } }
```

Masa berlaku token mengikuti `JWT_EXPIRES_IN` di server (produksi: 7 hari). Kirim di header `Authorization: Bearer <token>`.

---

## 4. Alur Data & Aturan Penting

```
Lahan → Penanaman → Panen (maks 3x) → Gudang: GABAH → Sosoh → SORGUM → Olahan → QR Lacak
```

1. **Panen**: satu penanaman maksimal 3 kali panen (`panenKe` 1–3). Tanggal panen tidak boleh
   sebelum tanggal tanam, dan panen ke-1/2/3 harus berurutan tanggalnya. Setelah panen ke-3,
   status penanaman otomatis `Dipanen`.
2. **Stok masuk**: hasil panen masuk gudang sebagai batch **GABAH**
   (`POST /harvest` dengan `stokBatch`, atau `POST /warehouse/stock/in`). Total tidak boleh
   melebihi hasil panen.
3. **Sosoh**: `POST /warehouse/stock/sosoh` mengubah GABAH → batch **SORGUM** (+ rendemen).
4. **Olahan**: `POST /production` dengan `stockBatchId` + `bahanDigunakan` mengurangi stok SORGUM.
   Mengubah jumlah bahan menyesuaikan stok; menghapus olahan mengembalikan bahan.
5. Stok **tidak bisa minus**. Stok panen yang sudah disosoh/dipakai olahan tidak bisa
   diubah atau dihapus lewat panen (respons **409**). Mengubah data lain panen (catatan, foto)
   tanpa mengirim `stokBatch` tidak mengubah stok.

---

## 5. Daftar Endpoint

Keterangan Auth: **R** = JWT atau API key · **W** = wajib JWT · **—** = publik.

### Kesehatan & Autentikasi
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/health` | — | Cek status server |
| POST | `/auth/register` | — | Daftar akun (`fullName`, `email`, `phone`, `password`) |
| POST | `/auth/login` | — | Login → token JWT (`usernameOrEmail`, `password`) |
| POST | `/auth/logout` | — | Logout (stateless) |
| GET | `/auth/me` | W | Profil user |
| PUT | `/auth/me` | W | Update profil (`name`, `email`, `phone`, `jabatan`, `namaKWT`, `alamat`, `kecamatan`, `kabupaten`, `bio`, `avatar`) |
| PUT | `/auth/me/password` | W | Ganti sandi (`currentPassword`, `newPassword`) |

### API Key
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/keys` | W | Daftar key (nilai disamarkan) |
| GET | `/keys/active` | W | Key aktif lengkap (untuk halaman Pengaturan) |
| POST | `/keys` | W | Buat key (`nama`) |
| PUT | `/keys/:id` | W | Aktif/nonaktifkan (`isActive`) |
| DELETE | `/keys/:id` | W | Cabut key |

### Lahan — `/land`
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/land` | R | List (`page`, `limit`, `search`) |
| GET | `/land/:id` | R | Detail |
| POST | `/land` | W | Tambah (**foto wajib**, nama lahan unik) |
| PUT | `/land/:id` | W | Update |
| DELETE | `/land/:id` | W | Hapus |

### Penanaman — `/plantings`
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/plantings` | R | List (`page`, `limit`, `search`, `lahanId`, `status`) — termasuk `jumlahPanen`, `panenKeTerakhir` |
| GET | `/plantings/:id` | R | Detail |
| POST | `/plantings` | W | Tambah (`lahanId`, `tanggalTanam`, `varietas`, `estimasiPanen`, …) |
| PUT | `/plantings/:id` | W | Update — ganti tanggal tanam menghitung ulang umur panen |
| DELETE | `/plantings/:id` | W | Hapus (ditolak 409 bila sudah ada panen) |

### Panen — `/harvest`
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/harvest` | R | List (`page`, `limit`, `search`, `lahanId`, `plantingId`, `lahan`, `varietas`, `tanggalAwal`, `tanggalAkhir`, `grade`, `status`) |
| GET | `/harvest/:id` | R | Detail + `stockBatches` |
| POST | `/harvest` | W | Tambah (`panenKe`, `persenHama`, `jenisHama`, `gudangId`, `stokBatch[]`, …) |
| PUT | `/harvest/:id` | W | Update (lihat aturan stok di bagian 4) |
| DELETE | `/harvest/:id` | W | Hapus (409 bila stoknya sudah terpakai) |

### Gudang & Stok — `/warehouse`
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/warehouse` | R | List gudang + `stokGabahKg`, `stokSorgumKg` |
| GET | `/warehouse/:id` | R | Detail + `stockBatches`, `movements`, `sosohList` |
| POST | `/warehouse` | W | Tambah gudang (`namaGudang`, `lahanId`, `lokasi`) |
| PUT | `/warehouse/:id` | W | Update |
| DELETE | `/warehouse/:id` | W | Hapus |
| GET | `/warehouse/options` | R | Ringkasan semua gudang |
| GET | `/warehouse/harvest-options` | R | Panen yang masih punya sisa belum masuk gudang |
| GET | `/warehouse/stock-sorgum/all` | R | Semua batch SORGUM bersisa (bahan olahan) |
| GET | `/warehouse/:id/stock-batches` | R | Batch stok gudang. Default SORGUM bersisa; `?jenis=GABAH\|SORGUM\|SEMUA&termasukHabis=true` untuk semua |
| GET | `/warehouse/:id/history` | R | Riwayat masuk/keluar/sosoh (`page`, `limit`, `search`, `bulan=YYYY-MM`, `tipe`). Tanggal = tanggal kejadian |
| GET | `/warehouse/:gudangId/trace/:batchId` | R | Lacak lengkap satu batch |
| POST | `/warehouse/stock/in` | W | Stok masuk GABAH (`harvestId`, `jumlahKg`, `tanggalMasuk`, `keterangan`) |
| POST | `/warehouse/stock/sosoh` | W | Sosoh (`gudangId`, `batchGabahId`, `kgGabah`, `kgHasilSorgum`, `operator`) |
| POST | `/warehouse/stock/out` | W | Stok keluar SORGUM (`gudangId`, `stockBatchId`, `jumlahKg`, `keterangan`) |

### Produksi (Olahan) — `/production`
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/production` | R | List (`page`, `limit`, `search`, `lahanId`, `harvestId`) + data asal (lahan, tanam, panen, gudang, batch) |
| GET | `/production/:id` | R | Detail |
| POST | `/production` | W | Tambah (`namaProduk`, `productId`, `tanggalProduksi`, `jumlahHasil`, `stockBatchId`, `bahanDigunakan`, …) |
| PUT | `/production/:id` | W | Update — stok bahan ikut disesuaikan |
| DELETE | `/production/:id` | W | Hapus — bahan dikembalikan ke stok |

### Master Data
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/products` | R | Produk olahan (`isActive`) |
| GET | `/products/:id` | R | Detail produk |
| POST / PUT / DELETE | `/products`, `/products/:id` | W | Kelola produk (`name`, `satuanHasil`, `deskripsi`, `fotoUrl`, `isActive`) |
| GET | `/varieties` | R | Varietas (termasuk `lamaPanen` = umur panen hari) |
| POST / PUT / DELETE | `/varieties`, `/varieties/:id` | W | Kelola varietas |

### Peralatan, Sertifikat, Kemasan, Keuangan
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/equipment` | R | List (`page`, `limit`, `search`, `status`, `kondisi`, `perhatian=1`) |
| GET | `/certificates` | R | List (`page`, `limit`, `search`) |
| GET | `/packaging` | R | List (`page`, `limit`, `search`, `kategori`) |
| GET | `/logistics` | R | Catatan pengeluaran / menu **Keuangan** (`page`, `limit`, `search`, `kategori`) |
| GET | `/<resource>/:id` | R | Detail untuk keempat resource di atas |
| POST / PUT / DELETE | `/<resource>`, `/<resource>/:id` | W | Tambah / ubah / hapus |

Kategori peralatan: `Pascapanen`, `Pengolahan Produk`, `Pengemasan`.
Field `keteranganVendor` pada pengeluaran = **Deskripsi** transaksi.
`/logistics/expenses` adalah alias lama dari `/logistics`.

### Notifikasi — `/notifications`
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/notifications` | R | List (maks 50) + `unread` |
| POST | `/notifications` | W | Tambah (`judul`, `pesan`, `kategori`) |
| PUT | `/notifications/:id/read` | W | Tandai dibaca (`all` = semua) |
| DELETE | `/notifications/:id` | W | Hapus |

### CMS & Pengaturan
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/cms` | — | Konten landing page |
| PUT | `/cms` | W | Simpan konten (objek lengkap) |
| DELETE | `/cms` | W | Reset ke default |
| GET | `/cms/settings/:key` | R | Pengaturan aplikasi (mis. `app_units`) |
| PUT | `/cms/settings/:key` | W | Simpan pengaturan (body = objek) |
| POST | `/settings/clear-data` | W | ⚠️ Kosongkan semua data operasional (tidak bisa dibatalkan) |
| POST | `/settings/seed-data` | W | Isi data contoh (hanya bila data kosong) |

### Publik
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/public/trace/:kodeBatchStok` | — | Lacak asal-usul produk (dipakai QR) |

---

## 6. Contoh (JavaScript)

```js
const BASE = 'https://scm.livinglabs.id/api';

// Baca dengan API key — semua panen + data gudang
const panen = await (await fetch(`${BASE}/harvest?limit=100`, {
  headers: { 'x-api-key': 'sk-...' },
})).json();

// Tulis dengan JWT — catat panen ke-1 dan langsung masuk gudang
await fetch(`${BASE}/harvest`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    lahanId: '1', plantingId: '1', namaLahan: 'Blok A - Sukamaju', varietas: 'Merah',
    tanggalPanen: '2026-10-21', jumlahHasilKg: 12, panenKe: 1, petaniPenanggungJawab: 'Ibu Sri',
    stokBatch: [{ jumlahKg: 12, keterangan: 'Masuk gudang' }],
  }),
});
```

---

## 7. Pagination

`?page=1&limit=10` (maks `limit` **100**):

```json
{ "success": true, "data": [], "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5, "hasNext": true, "hasPrev": false } }
```

---

## 8. Kode Status

| Kode | Arti |
|---|---|
| 200 / 201 | Sukses |
| 400 | Validasi gagal (field wajib, enum, tanggal, stok tidak cukup) |
| 401 | Belum login / token / API key tidak valid, atau API key dipakai untuk menulis |
| 404 | Data tidak ditemukan |
| 409 | Duplikat, sedang dipakai, atau stok sudah terpakai |
| 500 | Kesalahan server |
