# 📘 Dokumentasi API Sorgum SCM

Sistem Manajemen Rantai Pasok Sorgum untuk **Kelompok Wanita Tani (KWT)**.

> ⚡ **Dokumentasi interaktif (Scalar):** jalankan backend, lalu buka
> **`http://localhost:8000/api/docs`** — bisa mencoba langsung semua endpoint.

---

## 1. Info Dasar

| Item | Nilai |
|---|---|
| Base URL | `http://localhost:8000/api` |
| Format | JSON (`Content-Type: application/json`) |
| Autentikasi | **JWT** (`Authorization: Bearer <token>`) atau **API Key** (`x-api-key`) untuk GET |
| Respons sukses | `{ success: true, data?, pagination? }` |
| Respons error | `{ success: false, message: "..." }` |

Semua endpoint data (GET) bisa diakses dengan **JWT** (hasil login) **ATAU** **API key** (read-only).
Endpoint **tulis** (POST/PUT/DELETE) **hanya** bisa dengan JWT.

---

## 2. Cara Mendapatkan API Key

1. Login ke dashboard → **Profil** → tab **Pengaturan**.
2. Isi nama key (contoh: "Aplikasi Laporan") → klik **Buat API Key**.
3. **Salin key-nya sekarang** — hanya ditampilkan sekali!
4. Gunakan di header `x-api-key`.

```bash
curl -H "x-api-key: sk-abc123..." \
  http://localhost:8000/api/harvest?limit=5
```

> ⚠️ API key **read-only**: hanya bisa memanggil endpoint GET.
> Jangan bagikan API key ke pihak yang tidak dipercaya.

---

## 3. Autentikasi (JWT)

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"admin@sorgum.com","password":"password"}'
```

Respons:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "1", "name": "Admin Sorgum SCM", "email": "admin@sorgum.com" }
}
```

Pakai token untuk endpoint terproteksi:

```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8000/api/harvest
```

---

## 4. Contoh Fetch (JavaScript)

### Dengan API Key (read-only)

```js
const res = await fetch('http://localhost:8000/api/harvest?limit=10', {
  headers: { 'x-api-key': 'sk-abc123...' },
});
const json = await res.json();
console.log(json.data);
```

### Dengan JWT (baca & tulis)

```js
const res = await fetch('http://localhost:8000/api/harvest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer <TOKEN>',
  },
  body: JSON.stringify({
    namaLahan: 'Blok A - Sukamaju',
    varietas: 'Sorgum Bioguma 1',
    tanggalPanen: '2026-07-15',
    jumlahHasilKg: 1250.5,
    petaniPenanggungJawab: 'Ibu Siti',
  }),
});
```

---

## 5. Daftar Endpoint

### Kesehatan
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/health` | — | Cek status server |

### Autentikasi
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| POST | `/auth/register` | — | Daftar akun |
| POST | `/auth/login` | — | Login → token JWT |
| POST | `/auth/logout` | — | Logout (stateless) |
| GET | `/auth/me` | JWT | Profil user |
| PUT | `/auth/me` | JWT | Update profil |
| PUT | `/auth/me/password` | JWT | Ganti sandi |

### API Key
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/keys` | JWT | Daftar key (preview) |
| POST | `/keys` | JWT | Buat key baru |
| PUT | `/keys/:id` | JWT | Aktif/nonaktifkan |
| DELETE | `/keys/:id` | JWT | Hapus key |

### Panen — `/harvest`
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/harvest` | JWT / API key | List + filter (`page`, `limit`, `search`, `lahan`, `varietas`, `tanggalAwal`, `tanggalAkhir`, `grade`, `status`) |
| GET | `/harvest/:id` | JWT / API key | Detail |
| POST | `/harvest` | JWT | Tambah |
| PUT | `/harvest/:id` | JWT | Update |
| DELETE | `/harvest/:id` | JWT | Hapus |

### Varietas — `/varieties`
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/varieties` | JWT / API key | List |
| POST | `/varieties` | JWT | Tambah |
| PUT | `/varieties/:id` | JWT | Update |
| DELETE | `/varieties/:id` | JWT | Hapus (ditolak jika dipakai panen) |

### Lahan — `/land`
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/land` | JWT / API key | List + `search` |
| GET | `/land/:id` | JWT / API key | Detail |
| POST | `/land` | JWT | Tambah (**foto wajib**) |
| PUT | `/land/:id` | JWT | Update |
| DELETE | `/land/:id` | JWT | Hapus |

### Peralatan — `/equipment`
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/equipment` | JWT / API key | List + `search` |
| GET | `/equipment/:id` | JWT / API key | Detail |
| POST | `/equipment` | JWT | Tambah |
| PUT | `/equipment/:id` | JWT | Update |
| DELETE | `/equipment/:id` | JWT | Hapus |

### Produksi — `/production`
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/production` | JWT / API key | List + `search`, `kategori` |
| GET | `/production/:id` | JWT / API key | Detail |
| POST | `/production` | JWT | Tambah |
| PUT | `/production/:id` | JWT | Update |
| DELETE | `/production/:id` | JWT | Hapus |

### Sertifikat — `/certificates`
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/certificates` | JWT / API key | List + `search` |
| GET | `/certificates/:id` | JWT / API key | Detail |
| POST | `/certificates` | JWT | Tambah |
| PUT | `/certificates/:id` | JWT | Update |
| DELETE | `/certificates/:id` | JWT | Hapus |

### Kemasan — `/packaging`
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/packaging` | JWT / API key | List + `search`, `kategori` |
| GET | `/packaging/:id` | JWT / API key | Detail |
| POST | `/packaging` | JWT | Tambah |
| PUT | `/packaging/:id` | JWT | Update |
| DELETE | `/packaging/:id` | JWT | Hapus |

### Logistik — `/logistics`
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/logistics` | JWT / API key | List + `search`, `kategori` |
| GET | `/logistics/:id` | JWT / API key | Detail |
| POST | `/logistics` | JWT | Tambah |
| PUT | `/logistics/:id` | JWT | Update |
| DELETE | `/logistics/:id` | JWT | Hapus |

### Notifikasi — `/notifications`
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/notifications` | JWT / API key | List (max 50) + `unread` |
| POST | `/notifications` | JWT | Tambah |
| PUT | `/notifications/:id/read` | JWT | Tandai dibaca (`all` = semua) |
| DELETE | `/notifications/:id` | JWT | Hapus |

### CMS — `/cms`
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/cms` | — (publik) | Konten landing page |
| PUT | `/cms` | JWT | Simpan konten |
| DELETE | `/cms` | JWT | Reset ke default |

---

## 6. Pagination

Semua endpoint list mendukung pagination:

```text
?page=1&limit=10
```

`limit` maksimal **100**. Respons:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 7. Kode Status

| Kode | Arti |
|---|---|
| 200 / 201 | Sukses |
| 400 | Validasi gagal (field wajib / enum tidak valid) |
| 401 | Belum login / token / API key tidak valid |
| 404 | Data tidak ditemukan |
| 409 | Duplikat / sedang dipakai |
| 500 | Kesalahan server |
