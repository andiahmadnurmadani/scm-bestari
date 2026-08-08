/**
 * Konfigurasi URL API yang bisa diubah dari Settings (localStorage).
 *
 * Prioritas:
 * 1. localStorage 'api_base_url'  → diubah user di Pengaturan (mengalahkan env)
 * 2. env VITE_API_BASE_URL        → di-set saat build/deploy
 * 3. Same-origin /api             → otomatis di hosting (https://scm-bestari.kolab.top/api)
 * 4. Fallback lokal               → http://localhost:8000/api (dev)
 */

const STORAGE_KEY = 'api_base_url';
export const API_URL_CHANGED_EVENT = 'api:url-changed';

function getEnvBaseUrl(): string {
  return (import.meta as any).env?.VITE_API_BASE_URL || '';
}

/** URL default: same-origin /api saat di hosting, localhost saat dev. */
function getDefaultBaseUrl(): string {
  const env = getEnvBaseUrl();
  if (env) return env;
  // Di browser: kalau bukan localhost (hosting) → pakai origin + /api
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return `${origin}/api`;
    }
  }
  return 'http://localhost:8000/api';
}

/** Ambil URL API aktif (localStorage > env > same-origin > localhost). */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim()) return stored.trim().replace(/\/+$/, '');
  }
  return getDefaultBaseUrl().replace(/\/+$/, '');
}

/** Simpan URL API baru + beri tahu seluruh app (axiosClient di-recreate). */
export function setApiBaseUrl(url: string): void {
  const clean = url.trim().replace(/\/+$/, '');
  if (clean) {
    localStorage.setItem(STORAGE_KEY, clean);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  window.dispatchEvent(new Event(API_URL_CHANGED_EVENT));
}

/** Kembalikan URL API ke default (hapus override). */
export function resetApiBaseUrl(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(API_URL_CHANGED_EVENT));
}

/** Cek apakah user memakai URL kustom (bukan default). */
export function hasCustomApiBaseUrl(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(STORAGE_KEY);
}

/** URL dokumentasi Scalar untuk URL API aktif. */
export function getDocsUrl(): string {
  return `${getApiBaseUrl()}/docs`;
}
