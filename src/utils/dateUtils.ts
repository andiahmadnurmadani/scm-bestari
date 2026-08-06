/**
 * Parsing tanggal yang toleran terhadap berbagai format yang dipakai di DB:
 * - 'YYYY-MM-DD' / 'YYYY-MM-DDTHH:mm:ss' (ISO)
 * - '14 Mei 2026' (format Indonesia, dipakai seed logistics_expenses)
 * - '05/08/2026' (MM/DD/YYYY)
 * Mengembalikan objek Date valid, atau null jika tidak bisa di-parse.
 */
const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function parseTanggal(value: string | null | undefined): Date | null {
  if (!value) return null;

  const s = String(value).trim();
  if (!s) return null;

  // ISO (YYYY-MM-DD atau YYYY-MM-DDTHH:mm:ss)
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return isNaN(d.getTime()) ? null : d;
  }

  // Format Indonesia: '14 Mei 2026'
  const idMatch = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (idMatch) {
    const bulanIdx = BULAN_ID.findIndex(
      (b) => b.toLowerCase() === idMatch[2].toLowerCase()
    );
    if (bulanIdx >= 0) {
      const d = new Date(Number(idMatch[3]), bulanIdx, Number(idMatch[1]));
      return isNaN(d.getTime()) ? null : d;
    }
  }

  // Fallback: biarkan Date engine mencoba (MM/DD/YYYY, dll)
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Format tanggal ke teks Indonesia: 'Senin, 14 Mei 2026'. */
export function formatTanggalId(
  value: string | null | undefined,
  opts: { weekday?: boolean } = {}
): string {
  const d = parseTanggal(value);
  if (!d) return '-';
  return d.toLocaleDateString('id-ID', {
    weekday: opts.weekday ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
