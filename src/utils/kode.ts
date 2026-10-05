/**
 * Helper tampilan kode agar lebih ringkas & ramah pengguna (hasil usability test:
 * "kode ID sistem yang panjang & kaku"). Kode ASLI tetap dipakai untuk URL/QR,
 * database, dan tombol salin — fungsi ini HANYA untuk label yang ditampilkan.
 *
 * Contoh:
 *   SRG-ADS-09092026-01  ->  SRG-ADS-01
 *   GAB-ADS-09092026-02  ->  GAB-ADS-02
 *   GDG-ADS-01           ->  GDG-ADS-01   (sudah pendek, dibiarkan)
 *   PRD-ADS-15092026-01  ->  PRD-ADS-01
 *
 * Aturannya: buang segmen tanggal 8 digit (DDMMYYYY) dari kode, sisakan
 * prefix-jenis + kode lahan + urutan.
 */
export function shortKode(kode?: string | null): string {
  if (!kode) return '-';
  const parts = String(kode).trim().split('-').filter(Boolean);
  // Buang segmen yang murni tanggal 8 digit (mis. 09092026)
  const tanpaTanggal = parts.filter((p) => !/^\d{8}$/.test(p));
  const hasil = (tanpaTanggal.length >= 2 ? tanpaTanggal : parts).join('-');
  return hasil || String(kode);
}

/** Label jenis batch dalam bahasa manusia. */
export function labelJenisBatch(jenis?: string | null): string {
  if (jenis === 'SORGUM') return 'Sorgum (sudah disosoh)';
  if (jenis === 'GABAH') return 'Gabah (belum disosoh)';
  return jenis || '-';
}
