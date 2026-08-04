import { getPool } from '../config/db.js';

const SETTING_KEY = 'landing_page';

function parseJson(raw) {
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

// ── GET /api/cms ───────────────────────────────────────────────────────────────
// Mengembalikan konten landing page yang tersimpan di DB (JSON tunggal).
export async function getCmsContent(_req, res) {
  try {
    const [rows] = await getPool().execute(
      'SELECT data FROM cms_settings WHERE setting_key = ? LIMIT 1',
      [SETTING_KEY]
    );
    if (rows.length === 0) {
      return res.status(200).json({ success: true, data: null });
    }
    return res.status(200).json({ success: true, data: parseJson(rows[0].data) });
  } catch (error) {
    console.error('[getCmsContent] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil konten CMS.' });
  }
}

// ── PUT /api/cms ───────────────────────────────────────────────────────────────
// Menyimpan konten landing page (data lengkap CmsData) ke DB.
export async function saveCmsContent(req, res) {
  try {
    const data = req.body || {};
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, message: 'Data CMS tidak valid.' });
    }

    const pool = getPool();
    const serialized = JSON.stringify(data);

    await pool.execute(
      `INSERT INTO cms_settings (setting_key, data) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE data = VALUES(data)`,
      [SETTING_KEY, serialized]
    );

    return res.status(200).json({ success: true, message: 'Konten CMS berhasil disimpan.' });
  } catch (error) {
    console.error('[saveCmsContent] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan konten CMS.' });
  }
}

// ── DELETE /api/cms ────────────────────────────────────────────────────────────
// Reset konten CMS ke default (hapus baris dari DB).
export async function resetCmsContent(_req, res) {
  try {
    await getPool().execute('DELETE FROM cms_settings WHERE setting_key = ?', [SETTING_KEY]);
    return res.status(200).json({ success: true, message: 'Konten CMS di-reset ke default.' });
  } catch (error) {
    console.error('[resetCmsContent] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal reset konten CMS.' });
  }
}
