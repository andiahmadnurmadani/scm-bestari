# Sorgum SCM - Backend API

Backend API untuk **Sistem Manajemen Rantai Pasok Sorgum** menggunakan **Node.js (Express)** dan **MySQL**.

## 📦 Tech Stack

- **Node.js** (>= 18) + Express 4
- **MySQL** via `mysql2` (connection pool)
- **bcryptjs** untuk hash password
- **jsonwebtoken** (JWT) untuk autentikasi
- **cors** + **dotenv**

## 🚀 Menjalankan

```bash
cd backend-api
npm install
npm run dev      # development (auto-restart via node --watch)
# atau
npm start        # production
```

Server berjalan di: `http://localhost:8000`

> Pastikan file `.env` sudah diisi (lihat `.env.example`).

## 🗄️ Konfigurasi Database

Edit `.env`:

```
DB_HOST=192.168.27.240
DB_PORT=3306
DB_USER=root
DB_PASSWORD=kolab@777
DB_NAME=sorgum_scm
```

Database `sorgum_scm` dan tabel `users` **dibuat otomatis** saat server pertama kali dijalankan.

## 📡 Endpoint API

| Method | Endpoint            | Auth  | Deskripsi                              |
|--------|---------------------|-------|----------------------------------------|
| GET    | `/api/health`       | -     | Health check server                    |
| POST   | `/api/auth/register`| -     | Daftar akun baru                       |
| POST   | `/api/auth/login`   | -     | Login & dapatkan token JWT             |
| POST   | `/api/auth/logout`  | -     | Logout (stateless, kompatibilitas)     |
| GET    | `/api/auth/me`             | -     | Profil user aktif (Bearer token)     |
| PUT    | `/api/auth/me`              | -     | Update profil (name, phone, jabatan, namaKWT, alamat, kecamatan, kabupaten, bio, avatar) |
| PUT    | `/api/auth/me/password`     | -     | Ganti kata sandi (currentPassword, newPassword) |
| GET    | `/api/cms`           | -      | Ambil konten landing page (publik)      |
| PUT    | `/api/cms`           | Bearer | Simpan seluruh konten landing page (JSON) |
| DELETE | `/api/cms`           | Bearer | Reset konten landing page ke default    |
| GET    | `/api/harvest`      | -     | List panen (pagination: `?page=&limit=&search=`) |
| GET    | `/api/harvest/:id`  | -     | Detail satu data panen                 |
| POST   | `/api/harvest`      | -     | Tambah data panen baru                 |
| PUT    | `/api/harvest/:id`  | -     | Update data panen                      |
| DELETE | `/api/harvest/:id`  | -     | Hapus data panen                       |
| GET    | `/api/varieties`    | -     | Master data varietas sorgum            |
| POST   | `/api/varieties`    | -     | Tambah varietas baru                   |
| PUT    | `/api/varieties/:id`| -     | Update varietas                        |
| DELETE | `/api/varieties/:id`| -     | Hapus varietas (ditolak jika dipakai)  |
| GET    | `/api/land`         | -     | List lahan (pagination: `?page=&limit=&search=`) |
| GET    | `/api/land/:id`     | -     | Detail satu lahan                      |
| POST   | `/api/land`         | -     | Tambah lahan baru                      |
| PUT    | `/api/land/:id`     | -     | Update lahan                           |
| DELETE | `/api/land/:id`     | -     | Hapus lahan                            |
| GET    | `/api/equipment`    | -     | List peralatan (pagination: `?page=&limit=&search=`) |
| GET    | `/api/equipment/:id`| -     | Detail satu peralatan                  |
| POST   | `/api/equipment`    | -     | Tambah peralatan baru                  |
| PUT    | `/api/equipment/:id`| -     | Update peralatan                       |
| DELETE | `/api/equipment/:id`| -     | Hapus peralatan                        |
| GET    | `/api/production`   | -     | List batch produksi (pagination: `?page=&limit=&search=&kategori=`) |
| GET    | `/api/production/:id`| -    | Detail satu batch produksi             |
| POST   | `/api/production`   | -     | Tambah batch produksi                  |
| PUT    | `/api/production/:id`| -    | Update batch produksi                  |
| DELETE | `/api/production/:id`| -    | Hapus batch produksi                   |
| GET    | `/api/certificates` | -     | List sertifikat (pagination: `?page=&limit=&search=`) |
| GET    | `/api/certificates/:id`| -  | Detail satu sertifikat                 |
| POST   | `/api/certificates` | -     | Tambah/unggah sertifikat               |
| PUT    | `/api/certificates/:id`| -  | Update sertifikat                      |
| DELETE | `/api/certificates/:id`| -  | Hapus sertifikat                       |
| GET    | `/api/packaging`    | -     | List kemasan (pagination: `?page=&limit=&search=&kategori=`) |
| GET    | `/api/packaging/:id`| -     | Detail satu kemasan                    |
| POST   | `/api/packaging`    | -     | Tambah kemasan (status stok otomatis)  |
| PUT    | `/api/packaging/:id`| -     | Update kemasan (status stok otomatis)  |
| DELETE | `/api/packaging/:id`| -     | Hapus kemasan                          |
| GET    | `/api/logistics`    | -     | List transaksi (pagination: `?page=&limit=&search=&kategori=`) |
| GET    | `/api/logistics/:id`| -     | Detail satu transaksi                  |
| POST   | `/api/logistics`    | -     | Tambah transaksi (detailItem JSON)     |
| PUT    | `/api/logistics/:id`| -     | Update transaksi                       |
| DELETE | `/api/logistics/:id`| -     | Hapus transaksi                        |

### Contoh Request Panen

**List dengan pagination (10 baris/halaman)**
```
GET /api/harvest?page=1&limit=10
GET /api/harvest?page=2&limit=10&search=Bioguma
```

**Tambah data panen**
```json
POST /api/harvest
{
  "namaLahan": "Lahan Sektor A (Tani Makmur)",
  "varietas": "Sorgum Bioguma 1",
  "tanggalPanen": "2026-05-14",
  "jumlahHasilKg": 4850,
  "kualitasGrade": "Grade A (Premium)",
  "petaniPenanggungJawab": "Pak Karso",
  "status": "Selesai",
  "catatan": "Catatan panen"
}
```

### Contoh Request Varietas

**Tambah varietas dengan gambar (base64)**
```json
POST /api/varieties
{
  "name": "Sorgum Bioguma 1",
  "description": "Varietas unggul Balitbangtan",
  "imageUrl": "data:image/png;base64,iVBORw0KG..."
}
```

**Update varietas**
```json
PUT /api/varieties/1
{
  "name": "Sorgum Bioguma 1",
  "description": "Deskripsi baru",
  "imageUrl": "data:image/png;base64,..." // atau null untuk hapus gambar
}
```

### Contoh Request

**Register**
```json
POST /api/auth/register
{
  "fullName": "Ibu Hastuti",
  "email": "hastuti@kwt.id",
  "phone": "081234567890",
  "password": "rahasia123"
}
```

**Login**
```json
POST /api/auth/login
{
  "usernameOrEmail": "hastuti@kwt.id",
  "password": "rahasia123"
}
```

**Me** (header)
```
GET /api/auth/me
Authorization: Bearer <token>
```

### Contoh Response

```json
{
  "success": true,
  "message": "Login berhasil.",
  "token": "eyJhbGciOi...",
  "user": {
    "id": "1",
    "name": "Ibu Hastuti",
    "email": "hastuti@kwt.id",
    "phone": "081234567890",
    "role": "Anggota KWT",
    "avatar": null
  }
}
```

## 🔐 Keamanan

- Password di-hash dengan `bcryptjs` (10 rounds), tidak pernah disimpan plain text.
- Token JWT kedaluwarsa dalam 7 hari (bisa diatur via `JWT_EXPIRES_IN`).
- Gunakan `JWT_SECRET` yang kuat di environment production.
