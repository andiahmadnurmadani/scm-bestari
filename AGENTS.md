# AGENTS.md — Panduan untuk AI Agent (Sorgum SCM)

> Dokumen ini adalah sumber kebenaran utama bagi agent AI yang bekerja di repo ini.
> Baca SELURUHNYA sebelum mengubah kode. Semua aturan di sini bersifat mengikat.

---

## 1. Gambaran Proyek

**Sorgum SCM** = Sistem Manajemen Rantai Pasok Sorgum untuk **Kelompok Wanita Tani (KWT)**.
Aplikasi **single-user** (satu admin) dengan landing page publik + dashboard admin.

**Pengguna utama: orang tua (ibu-ibu KWT)** → SEMUA teks UI (label, placeholder, notifikasi,
tombol) harus **bahasa Indonesia sederhana**, tanpa istilah teknis/asing
(JANGAN pakai: *Qty, Tonase, Unit, Grade* — pakai: *Jumlah, Berat Hasil, Satuan, Mutu*).

### Fitur inti
- Landing page (CMS-driven) + login
- Dashboard dengan metrik, grafik panen, donut produksi, filter periode
- Kelola: Panen, Lahan (dengan peta), Peralatan, Produksi, Sertifikat, Kemasan, Logistik (keuangan), Varietas
- Profil (foto avatar base64, ganti password), Notifikasi (bel), CMS konten landing

### Arsitektur (2 bagian terpisah, dijalankan bersamaan)
```
Sorgum-SCM/
├── src/                  # FRONTEND: React 19 + Vite 6 + TypeScript + Tailwind v4
│   ├── App.tsx           # Routing utama
│   ├── pages/public/     # LandingPage, LoginPage
│   ├── pages/admin/      # 12 halaman dashboard
│   ├── components/
│   │   ├── common/       # Button, Modal, Badge, Toast, ActionButtons, StatCard, ApiOfflineBanner
│   │   ├── layout/       # AdminLayout, AdminSidebar, AdminHeader, AdminFooter, PublicNavbar/Footer
│   │   └── MapPicker.tsx, MapView.tsx
│   ├── api/              # axiosClient + endpoints/ (1 file per resource)
│   ├── context/          # CmsContext (konten landing, default + localStorage/backend)
│   ├── types.ts          # Semua interface FE
│   └── utils/kodeGenerator.ts
└── backend-api/          # BACKEND: Node 22 + Express 4 + MySQL (mysql2)
    └── src/
        ├── server.js     # Entry: init DB → seed → listen :8000
        ├── config/db.js  # Schema lengkap + auto-migrasi + seed (557 baris!)
        ├── controllers/  # 11 controller (auth, harvest, land, ...)
        ├── routes/       # 11 router, pola CRUD seragam
        ├── middleware/   # authMiddleware (JWT)
        └── seeders/      # seedHarvests.js
```

---

## 2. Stack & Versi

| Layer | Teknologi |
|---|---|
| Frontend | React 19, Vite 6, TypeScript 5.8, Tailwind CSS v4 (`@tailwindcss/vite`), react-router-dom 7, axios, lucide-react (icon), motion, leaflet + react-leaflet, @types/google.maps |
| Backend | Node (ESM, `"type": "module"`), Express 4, mysql2/promise, jsonwebtoken, bcryptjs, morgan, cors, dotenv |
| DB | MySQL 8 (utf8mb4_unicode_ci), auto-create database `sorgum_scm` saat start |
| Peta | Google Maps JS **hanya untuk render peta**. Search & reverse-geocode → **Nominatim (OpenStreetMap)**. **JANGAN panggil Google Places/Geocoding API** (billing error) |

---

## 3. Menjalankan (dev)

```bash
# Terminal 1 — Frontend (port 3000)
npm install
npm run dev

# Terminal 2 — Backend (port 8000)
cd backend-api
npm install
npm run dev
```

- FE: http://localhost:3000 — BE: http://localhost:8000/api/health
- Login demo: `admin@sorgum.com` / `password` (terisi otomatis di form login)
- Backend **auto-create** database + tabel + seed data saat pertama start.
  Kredensial MySQL di `backend-api/.env` (lihat `.env.example`).
- FE→BE URL: `VITE_API_BASE_URL` di `.env.local` root (default `http://localhost:8000/api`).

---

## 4. Perintah Verifikasi (WAJIB sebelum bilang selesai)

```bash
npm run lint            # ROOT: tsc --noEmit — satu-satunya lint FE. Wajib PASS.
node --check <file.js>  # BACKEND: cek syntax per file JS (tidak ada linter backend)
```

- **Jangan pernah** klaim selesai tanpa `npm run lint` PASS (FE) / `node --check` (BE).
- Dev server tidak perlu di-restart untuk TS (Vite HMR). Backend pakai `node --watch`.

---

## 5. Pola Kode — Frontend

### 5.1 API Layer (WAJIB lewat axiosClient)
- Semua request lewat `src/api/axiosClient.ts` → baseURL dari env, auto-attach `Bearer` token
  dari localStorage `token`, interceptor global (event `api:offline`/`api:online` untuk ApiOfflineBanner).
- Jangan panggil `fetch()` langsung untuk data app. Pengecualian: Nominatim di MapPicker/MapView.
- Setiap resource punya 1 file di `src/api/endpoints/` (mis. `harvestApi.ts`):
  `getAll(params)`, `getById(id)`, `create(data)`, `update(id, data)`, `delete(id)`.
- Backend return shape: `{ success, message?, data?, pagination? }`. Error message ada di
  `err.response?.data?.message` — TAMPILKAN ke user via Toast, jangan telan.

### 5.2 Komponen Umum (`src/components/common/`)
| Komponen | Kegunaan / Aturan |
|---|---|
| `Button.tsx` | Tombol: `variant="primary\|secondary\|danger\|ghost"`, `size`, `loading` |
| `Modal.tsx` | **`if (!isOpen) return null`** → children UNMOUNT saat tutup. State form di dalam modal harus di-reset oleh parent saat buka. Escape & backdrop menutup. |
| `Toast.tsx` | Notifikasi floating pojok kanan atas, auto-hilang 3.5s. **SEMUA notifikasi sukses/error pakai ini** — jangan `alert()` native, jangan banner inline di atas form. |
| `ActionButtons.tsx` | Tombol konsisten Detail/Edit/Hapus: Eye hijau `#2C4219`, Edit3 amber-700, Trash2 red-600, `min-h-8 px-2.5 py-1.5 rounded-lg gap-1.5 text-[11px] font-bold`. Pakai `show={{detail,edit,delete}}` untuk subset. |
| `Badge.tsx` | `variant="success\|warning\|error\|neutral"` |
| `StatCard.tsx` | Kartu metrik dashboard |
| `ApiOfflineBanner.tsx` | Banner global saat backend mati (dipasang di App.tsx) |

### 5.3 Pola Halaman Admin (konsisten di 12 halaman)
1. State: `dataList`, `loading`, `page/limit/total/totalPages`, `searchTerm` (dari `useAdminSearch`),
   `selectedDetail`, `deleteTarget`, `formData`, `toast`.
2. `fetchData()` di `useEffect` + panggil ulang setelah create/update/delete.
3. **Input angka**: gunakan `value={formData.x || ''}` dan state string — JANGAN default `0`/`1`
   (user kesulitan menghapus angka). Konversi `Number(x)` saat save/payload.
4. **Notifikasi**: `setToast({ msg, type: 'success'|'error' })` → render `<Toast>` di akhir komponen.
5. **Hapus**: modal konfirmasi (`deleteTarget` + tombol "Ya, Hapus").
6. **Kode transaksi**: `nextCode(prefix, items, digits)` dari `utils/kodeGenerator.ts`
   (hindari duplikat saat data dihapus).
7. Ekspor CSV/Excel/PDF: pola di LogistikPage (Blob + download), pakai Toast untuk error/kosong.

### 5.4 Peta (MapPicker.tsx / MapView.tsx)
- `loadGoogleMaps()` **singleton** module-level: cek `window.google.maps.Map` dulu, `script.onerror` reset.
- Search & reverse geocode → `https://nominatim.openstreetmap.org/search|reverse` (JSON, `accept-language=id`, `countrycodes=id`).
- Marker: merah `#D32F2F`, 24×32 px, anchor (12,32), SVG data URI (jangan diperbesar lagi).
- Kedua komponen harus fitur sama (map type control, street view, fullscreen).
- Pola "Coba Lagi": `{ loadPromise = null; setState('loading'); loadGoogleMaps().then(...).catch(...) }`.

### 5.5 CMS (CmsContext)
- `defaultCms` di `CmsContext.tsx` adalah fallback; tersimpan ke backend `cms_settings`
  (key→JSON) + `localStorage` cache. Ubah lewat `CmsPage` (9 tab) — JANGAN hardcode
  konten landing di LandingPage (semua baca `cms.*`).

---

## 6. Pola Kode — Backend

### 6.1 Route ↔ Controller (CRUD seragam)
```js
// routes/harvestRoutes.js
router.get('/', getHarvests);        // pagination: ?page&limit&search&filter...
router.get('/:id', getHarvestById);
router.post('/', createHarvest);
router.put('/:id', updateHarvest);
router.delete('/:id', deleteHarvest);
```
- Register semua route di `server.js` di bawah prefix `/api/...`.
- Controller memakai `getPool()` / `query()` dari `config/db.js`.
- Response error selalu `{ success: false, message: '...' }` + status HTTP tepat
  (400 validasi, 401 auth, 404 not found, 409 duplikat, 500 server).
- Setiap handler dibungkus try/catch dengan `console.error('[nama] Error:', ...)`.

### 6.2 Auth (JWT)
- `authenticateToken` (middleware) verifikasi `Authorization: Bearer <token>` → `req.userId`.
- Token: `jwt.sign({ sub: String(userId) }, JWT_SECRET, { expiresIn: '7d' })`.
- Endpoint: POST `/api/auth/register|login|logout`, GET `/api/auth/me`,
  PUT `/api/auth/me` (profil), PUT `/api/auth/me/password`.
- Logout stateless (hapus token di FE saja).

### 6.3 Database (`backend-api/src/config/db.js`) — BACA SEBELUM AKSES DATA
- **Schema lengkap + seed ada di sini (bukan file .sql terpisah)**. `initDatabase()`
  auto-create DB & tabel, auto-migrasi kolom baru, auto-seed jika tabel kosong.
- Tabel: `users, cms_settings, harvests, varieties, lands, equipment, production_batches,
  certificates, packaging_materials, logistics_expenses, notifications`.
- Pola migrasi kolom baru: cek `information_schema.COLUMNS` → `ALTER TABLE ... ADD COLUMN`
  (jangan ubah CREATE TABLE saja — tabel lama tidak ter-update).
- Gambar/foto disimpan sebagai **base64 data URL di kolom LONGTEXT** (`foto_url`, `avatar`,
  `file_url`, `image_url`) — bukan file upload.
- Kategori/status disimpan sebagai ENUM — **bandingkan dengan nilai persis** (TS error jika
  string tidak ada di enum, mis. `'Transportasi & Bensin'` ≠ `'Transportasi'`).

### 6.4 Gotcha Tanggal (PENTING)
- `logistics_expenses.tanggal` adalah **VARCHAR(50)** — seed memakai `'14 Mei 2026'`.
  `new Date('14 Mei 2026')` → INVALID. Gunakan helper `parseTanggal` yang mendukung
  `YYYY-MM-DD`, `14 Mei 2026`, `05/08/2026`.
- `harvests.tanggal_panen` dan `lands` menggunakan DATE/DECIMAL — perhatikan perbedaannya.

---

## 7. Konvensi Desain (Tailwind v4)

### Warna brand (dipakai konsisten di seluruh app)
| Token | Hex | Pemakaian |
|---|---|---|
| Hijau sorgum | `#2C4219` | Primary, teks judul, tombol utama |
| Hijau muda | `#C3E28D` | Aksen, highlight, badge aktif |
| Krem | `#fff1e5` / `#fff8f4` | Background input, header modal, sidebar |
| Teks gelap | `#172C05` | Heading |
| Teks abu | `#6B7280` / `#9CA3AF` | Subtitle, placeholder, meta |
| Latar halaman | `#F7F7F5` | Background admin/landing |
| Border | `#c4c8bb` (dengan /20–/40 opacity) | Border kartu, input, tabel |

### Style konsisten
- Font: **Poppins** (di `index.css` via Google Fonts).
- Kartu: `bg-white rounded-2xl border border-[#c4c8bb]/30 shadow-2xs hover:shadow-md`.
- Input: `w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm`.
- Tombol aksi tabel: ActionButtons (5.2). Tombol umum: `Button` component.
- Layout admin: sidebar kiri `#FFF8F4`, konten `max-w-6xl mx-auto p-3 sm:p-6`.
- Mobile-first; semua modal responsif (`p-3 sm:p-6`, grid `grid-cols-1 sm:grid-cols-2`).
- Print: hanya `#print-struk` yang tampil (lihat index.css).

---

## 8. Gotchas & Aturan Penting

1. **UI bahasa Indonesia sederhana** — target pengguna orang tua. Placeholder wajib memberi
   contoh nyata: `"Jumlah (contoh: 5)"`, `"Harga satuan (contoh: 5000)"`, `"Contoh: 35.5 ton"`.
2. **Jangan `alert()` native** dan jangan banner notifikasi inline — pakai `Toast`.
3. **Input angka**: value string + `|| ''`, default kosong bukan 0/1.
4. **Jangan panggil Google Places/Geocoding** — billing error. Nominatim saja.
5. **Pagination**: API default `limit=10`. Ringkasan/summary (mis. TOTAL PENGELUARAN BULAN INI)
   harus fetch `limit: 1000` atau endpoint khusus — jangan hitung dari halaman 1 saja.
6. **Avatar**: validasi di FE (tipe JPG/PNG/WebP + ≤2 MB) DAN di BE (`authController.js`
   estimasi base64 `(len - idx) * 0.75`, max 2 MB, regex `data:image/(jpeg|png|webp|jpg)`).
7. **Halaman tersembunyi**: `/dashboard/cms` & `/dashboard/integrasi` TIDAK ada di sidebar
   (hanya via URL). `/dashboard/integrasi` sekarang redirect ke `/dashboard/cms`.
   Sidebar hanya 9 menu: Dashboard, Panen, Lahan, Peralatan, Produksi, Sertifikat, Kemasan,
   Logistik, Varietas.
8. **Jangan tambah data dummy/mock** yang menyesatkan (contoh: kartu "Aplikasi Terhubung"
   Tokopedia/WA pernah ada & dihapus). Kalau fitur belum ada: tampilkan pesan jujur atau kosongkan.
9. **CmsContext** menyimpan data di state + localStorage + backend — pastikan sinkron saat
   menambah field CMS baru (defaultCms ↔ CmsPage ↔ LandingPage ↔ cmsController).
10. `Modal` unmount children saat tutup → jangan andalkan state internal modal bertahan.
11. **Jangan hapus `resetConfirm`/state penting** saat refactor (pernah terjadi — selalu
    verifikasi diff).
12. File backend adalah **ESM** (`import ... from './x.js'`) — ekstensi `.js` wajib di import.

---

## 9. Git Workflow

- Branch utama: `main` (langsung push ke `origin/main` — GitHub `andiahmadnurmadani/scm-bestari`).
- Alur: `git add -A` → `git commit -m "..."` (pesan konvensional, bahasa Indonesia/Inggris) → `git push origin main`.
- Pastikan `npm run lint` PASS sebelum commit.
- Jangan commit `node_modules`, `.env`, `dist` (sudah di .gitignore).

---

## 10. Ringkasan File Kunci (peta cepat)

| File | Peran |
|---|---|
| `src/App.tsx` | Routing & protected layout |
| `src/types.ts` | Semua interface FE (HarvestRecord, LandPlot, FinancialExpense, dll) |
| `src/api/axiosClient.ts` | Axios + auth header + offline detection |
| `src/api/endpoints/*.ts` | API client per resource |
| `src/context/CmsContext.tsx` | Konten landing (default + persist) |
| `src/components/common/Toast.tsx` | Notifikasi floating (WAJIB dipakai) |
| `src/components/common/ActionButtons.tsx` | Tombol Detail/Edit/Hapus konsisten |
| `src/components/common/Modal.tsx` | Modal reusable (unmount saat tutup) |
| `src/components/MapPicker.tsx` / `MapView.tsx` | Peta (Google Maps render + Nominatim geocode) |
| `backend-api/src/server.js` | Entry server, mount routes, 404/error handler |
| `backend-api/src/config/db.js` | **Schema + migrasi + seed lengkap** |
| `backend-api/src/controllers/*.js` | Logika CRUD per resource |
| `backend-api/src/middleware/authMiddleware.js` | Verifikasi JWT |
