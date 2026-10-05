import { AppMode } from '../context/AppModeContext';

/**
 * Pemetaan rute antar mode (Mode Mudah ⇄ Mode Lengkap) agar saat pengguna
 * berganti mode, mereka tetap berada di halaman yang sama — bukan dilempar
 * ke Dashboard. Ini memangkas alur dari ~6 langkah menjadi 1.
 *
 * Contoh: /lite/gudang ⇄ /dashboard/gudang
 */

// Pasangan rute Lite ↔ Pro (kedua arah diturunkan otomatis dari tabel ini).
const ROUTE_PAIRS: [string, string][] = [
  ['/lite', '/dashboard'],
  ['/lite/lahan', '/dashboard/lahan'],
  ['/lite/panen', '/dashboard/panen'],
  ['/lite/gudang', '/dashboard/gudang'],
  ['/lite/produksi', '/dashboard/produksi'],
  ['/lite/produk', '/dashboard/master/produk'],
  ['/lite/varietas', '/dashboard/master/varietas'],
  ['/lite/profil', '/dashboard/profil'],
];

/**
 * Ubah path saat ini ke padanan mode tujuan.
 * - Jika path punya padanan → kembalikan path padanannya.
 * - Jika tidak (mis. halaman Pro tanpa padanan Lite) → kembalikan landing mode tujuan.
 */
export function mapPathForMode(currentPath: string, targetMode: AppMode): string {
  const isTargetLite = targetMode === 'lite';
  const clean = (currentPath || '').split('?')[0].replace(/\/+$/, '') || '/';

  for (const [lite, pro] of ROUTE_PAIRS) {
    const from = isTargetLite ? pro : lite;
    const to = isTargetLite ? lite : pro;
    if (clean === from) return to;
    // Cocokkan sub-route (mis. /dashboard/gudang/123 → /lite/gudang/123)
    if (clean.startsWith(from + '/')) return to + clean.slice(from.length);
  }

  // Fallback: landing mode tujuan
  return isTargetLite ? '/lite' : '/dashboard';
}
