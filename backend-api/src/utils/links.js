/**
 * Helper URL publik & QR code.
 *
 * Base URL aplikasi diambil dari env PUBLIC_APP_URL (bila diisi), atau dari
 * header request (Nginx meneruskan Host & X-Forwarded-Proto) — sehingga situs
 * utama (scm) dan demo (scm1) otomatis menghasilkan link ke domainnya sendiri.
 */

/** Base URL aplikasi, mis. https://scm.livinglabs.id (tanpa garis miring akhir). */
export function baseUrl(req) {
  const env = String(process.env.PUBLIC_APP_URL || '').trim().replace(/\/+$/, '');
  if (env) return env;
  // Lewat Cloudflare Tunnel, Nginx menerima HTTP (X-Forwarded-Proto jadi "http");
  // skema asli pengunjung ada di header CF-Visitor: {"scheme":"https"}.
  let proto = '';
  try { proto = JSON.parse(String(req.headers['cf-visitor'] || '{}')).scheme || ''; } catch { proto = ''; }
  if (!proto) proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim();
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}

/** Link lacak batch stok (halaman publik /trace) + gambar QR-nya. */
export function traceLinks(req, kodeBatchStok) {
  if (!kodeBatchStok) return { traceUrl: null, qrUrl: null };
  const base = baseUrl(req);
  const kode = encodeURIComponent(kodeBatchStok);
  return { traceUrl: `${base}/trace/${kode}`, qrUrl: `${base}/api/public/qr/trace/${kode}` };
}

/** Link halaman publik kemasan produk (/kemasan) + gambar QR-nya. */
export function kemasanLinks(req, kodeKemasan) {
  if (!kodeKemasan) return { publicUrl: null, qrUrl: null };
  const base = baseUrl(req);
  const kode = encodeURIComponent(kodeKemasan);
  return { publicUrl: `${base}/kemasan/${kode}`, qrUrl: `${base}/api/public/qr/kemasan/${kode}` };
}
