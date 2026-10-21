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
DB_HOST=localhost
DB_PORT=3306
DB_USER=<user_mysql>
DB_PASSWORD=<password_mysql>
DB_NAME=sorgum_scm        # situs demo memakai database terpisah, mis. sorgum_scm_demo
PORT=8000
JWT_SECRET=<string_acak_panjang>
API_KEYS=<api_key_read_only>
```

Database beserta **semua tabel dibuat & dimigrasi otomatis** saat server dijalankan (`src/config/db.js`).

## 📡 Endpoint API

Dokumentasi lengkap & selalu terbaru:

- **Interaktif (Scalar):** `/api/docs` — mis. https://scm.livinglabs.id/api/docs (utama) atau https://scm1.livinglabs.id/api/docs (demo)
- **Markdown:** [`../docs/API.md`](../docs/API.md)
- **Spesifikasi OpenAPI:** [`src/openapi.js`](src/openapi.js) — wajib diperbarui setiap endpoint/field berubah

Ringkasan autentikasi:

| Jenis | Header | Untuk |
|---|---|---|
| JWT (dari `POST /api/auth/login`) | `Authorization: Bearer <token>` | Baca & tulis |
| API key | `x-api-key: <kunci>` | Hanya baca (GET) |
| Publik | — | `/api/health`, `/api/auth/login`, `/api/auth/register`, `GET /api/cms`, `/api/public/trace/:kode` |

Resource yang tersedia: `auth`, `keys`, `land`, `plantings`, `harvest`, `warehouse` (stok, sosoh, riwayat, lacak),
`production`, `products`, `varieties`, `equipment`, `certificates`, `packaging`, `logistics` (Keuangan),
`notifications`, `cms`, `settings`, `public`.

## 🔐 Keamanan

- Password di-hash dengan `bcryptjs` (10 rounds), tidak pernah disimpan plain text.
- Masa berlaku token JWT diatur via `JWT_EXPIRES_IN` (default kode 14 hari; server produksi 7 hari).
- Gunakan `JWT_SECRET` yang kuat di environment production.
