<div align="center">

# 🌾 Sorgum SCM

**Sistem Manajemen Rantai Pasok Sorgum** — untuk Kelompok Wanita Tani (KWT)

Transparansi rantai pasok sorgum dari lahan hingga produk olahan: panen, lahan, peralatan, produksi, sertifikat, kemasan, logistik keuangan, dan konten website.

</div>

---

## 🚀 Menjalankan Frontend + Backend

Project ini memiliki **dua bagian** yang dijalankan terpisah:

### 1. Frontend (React + Vite)

```bash
npm install
npm run dev
```

Frontend berjalan di: `http://localhost:3000`

### 2. Backend API (Node.js + Express + MySQL)

```bash
cd backend-api
npm install
npm run dev
```

Backend berjalan di: `http://localhost:8000`

> Backend otomatis membuat database `sorgum_scm` dan semua tabel di MySQL
> saat pertama kali dijalankan. Konfigurasi koneksi DB ada di `backend-api/.env`.

### Koneksi FE → BE

Frontend memanggil backend di `http://localhost:8000/api` (default).
Untuk mengubahnya, buat file `.env.local` di root:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

Dokumentasi lengkap API: [backend-api/README.md](backend-api/README.md)

---

## 🔑 Akun Demo (Login)

| Peran | Email | Password |
|---|---|---|
| **Admin (single-user)** | `admin@sorgum.com` | `password` |

> Aplikasi single-user: kredensial sudah terisi otomatis di halaman login `http://localhost:3000/login` — tinggal klik **Masuk**.
