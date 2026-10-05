/**
 * Helper tanggal berbasis LOKAL (bukan UTC) untuk menghindari pergeseran hari.
 *
 * Masalah: `new Date('2026-10-05T00:00:00')` menghasilkan tengah malam WIB
 * (UTC+7); lalu `.toISOString()` mengubahnya ke UTC → mundur jadi 2026-10-04.
 * Akibatnya estimasi panen bisa selisih 1 hari. Fungsi di bawah memakai
 * komponen tanggal LOKAL sehingga hasilnya selalu tepat.
 */

/** Format Date → 'YYYY-MM-DD' memakai komponen tanggal LOKAL. */
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Tanggal hari ini (lokal) → 'YYYY-MM-DD'. */
export function todayLocalISO(): string {
  return toLocalISODate(new Date());
}

/**
 * Tanggal (YYYY-MM-DD) + n hari → 'YYYY-MM-DD', aman dari pergeseran timezone.
 * Mengembalikan null bila tanggal tidak valid.
 */
export function addDaysISO(tanggal: string, hari: number): string | null {
  if (!tanggal) return null;
  const [y, m, d] = String(tanggal).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d); // tengah malam LOKAL
  if (isNaN(dt.getTime())) return null;
  dt.setDate(dt.getDate() + hari);
  return toLocalISODate(dt);
}
