<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8a80e089-38bc-4eae-9110-9971470de8a1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

## 🚀 Menjalankan Frontend + Backend (Sorgum SCM)

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

> Backend otomatis membuat database `sorgum_scm` dan tabel `users` di MySQL
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
