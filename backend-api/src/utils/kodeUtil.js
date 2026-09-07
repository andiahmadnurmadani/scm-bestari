/**
 * Helper pembuatan kode/id bermakna untuk rantai SCM Sorgum.
 *
 * Format kode (disetujui user):
 *  - Lahan : GRT-01092026          (3 huruf desa + tanggal daftar DDMMYYYY)
 *  - Tanam : GRT-15012026-01       (desa + tanggal tanam + urutan)
 *  - Panen : GRT-10092026-01       (desa + tanggal panen + urutan)
 *  - Gudang: GDG-GRT-01            (prefix + desa + urutan)
 *  - Gabah : GAB-GRT-10092026-01   (prefix + kode panen asal)
 *  - Sorgum: SRG-GRT-10092026-01   (prefix + kode panen asal)
 *  - Produksi: PRD-GRT-15092026-01 (prefix + desa + tanggal produksi + urutan)
 */

/**
 * Ambil 3 huruf dari NAMA LAHAN (bukan lokasi desa) — huruf awal tiap kata.
 * Contoh: "Lahan Utama Sorgum" -> "LUS", "Lahan Garut" -> "LGA",
 *         "Sorgum" -> "SOR", "Kebonagung" -> "Kebonagung"->"KEB"? (lihat bawah).
 * Jika huruf awal < 3, isi dari huruf berikutnya nama (huruf ke-2, ke-3 dst).
 */
export function slugNama(nama) {
  if (!nama) return 'XXX';
  const bersih = String(nama)
    .replace(/[^a-zA-Z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!bersih) return 'XXX';
  const kata = bersih.split(' ').filter(Boolean);
  // huruf awal tiap kata
  let huruf = kata.map((k) => k[0]).join('');
  if (huruf.length < 3) {
    // isi sisa dari huruf kedua dst (gabungan semua kata)
    const sisa = kata.map((k) => k.slice(1)).join('').replace(/[^A-Za-z]/g, '');
    huruf = (huruf + sisa).slice(0, 3);
  }
  huruf = huruf.toUpperCase().replace(/[^A-Z]/g, '');
  if (huruf.length >= 3) return huruf.slice(0, 3);
  return (huruf + 'XXX').slice(0, 3);
}

/**
 * Konversi nilai tanggal apa pun (Date objek MySQL, ISO string, "14 Mei 2026") -> "YYYY-MM-DD".
 * Penting: jangan pernah pakai String(dateObj).slice(0,10) karena Date objek
 * dirender "Fri Sep 04 2026 ..." (Inggris). Dipakai oleh controller agar API
 * selalu mengirim tanggal ISO yang aman untuk diformat ulang di frontend.
 */
export function toISODate(v) {
  if (v === null || v === undefined || v === '') return null;
  // Sudah berbentuk YYYY-MM-DD / YYYY-MM-DD HH:mm:ss
  const iso = String(v).match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    if (!isNaN(d.getTime())) return `${iso[1]}-${String(Number(iso[2])).padStart(2, '0')}-${String(Number(iso[3])).padStart(2, '0')}`;
  }
  // Date objek (dari kolom DATE/DATETIME MySQL)
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) {
    // Format Indonesia "14 Mei 2026"
    const idMatch = String(v).trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (idMatch) {
      const BULAN = ['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
      const idx = BULAN.indexOf(idMatch[2].toLowerCase());
      if (idx >= 0) {
        const dd = String(Number(idMatch[1])).padStart(2, '0');
        const mm = String(idx + 1).padStart(2, '0');
        return `${idMatch[3]}-${mm}-${dd}`;
      }
    }
    return null;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Konversi tanggal (YYYY-MM-DD / Date / "14 Mei 2026") -> "DDMMYYYY".
 * Jika tidak bisa parse, return kosong ''.
 */
export function tanggalKode(tgl) {
  if (!tgl) return '';
  let d = null;
  if (tgl instanceof Date) d = tgl;
  else if (/^\d{4}-\d{2}-\d{2}/.test(String(tgl))) {
    const [y, m, day] = String(tgl).slice(0, 10).split('-').map(Number);
    d = new Date(y, (m || 1) - 1, day || 1);
  } else {
    // coba Date.parse biasa
    const parsed = new Date(String(tgl));
    if (!isNaN(parsed.getTime())) d = parsed;
  }
  if (!d || isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}${mm}${d.getFullYear()}`;
}

/**
 * Generate kode unik: jalankan `buatNomor(seq)` lalu cek via `cekAda(kode)` sampai unik.
 * @param {Function} buatNomor - (seq) => string kode
 * @param {Function} cekAda   - async (kode) => boolean (true = sudah dipakai)
 * @param {number} mulaiSeq   - urutan awal (default 1)
 */
export async function kodeUnik(buatNomor, cekAda, mulaiSeq = 1) {
  let seq = mulaiSeq;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const kode = buatNomor(seq);
    const dipakai = await cekAda(kode);
    if (!dipakai) return kode;
    seq += 1;
  }
}

/** Helper: cek apakah kode sudah ada di tabel/kolom via pool. */
export function buatCekAda(pool, tabel, kolom) {
  return async (kode) => {
    const [r] = await pool.execute(
      `SELECT id FROM ${tabel} WHERE ${kolom} = ? LIMIT 1`,
      [kode]
    );
    return r.length > 0;
  };
}
