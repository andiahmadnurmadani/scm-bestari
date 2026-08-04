import { getPool } from '../config/db.js';

// ── Helper ────────────────────────────────────────────────────────────────────

function mapRowToNotif(row) {
  return {
    id: String(row.id),
    judul: row.judul,
    pesan: row.pesan,
    kategori: row.kategori,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function getNotifications(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT id, judul, pesan, kategori, is_read, created_at
       FROM notifications
       ORDER BY created_at DESC, id DESC
       LIMIT 50`
    );
    const data = rows.map(mapRowToNotif);
    const unread = data.filter((n) => !n.isRead).length;
    return res.status(200).json({ success: true, data, unread });
  } catch (error) {
    console.error('[getNotifications] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil notifikasi.' });
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createNotification(req, res) {
  try {
    const { judul, pesan, kategori = 'sistem' } = req.body || {};
    if (!judul || !String(judul).trim()) {
      return res.status(400).json({ success: false, message: 'Judul notifikasi wajib diisi.' });
    }
    if (!pesan || !String(pesan).trim()) {
      return res.status(400).json({ success: false, message: 'Pesan notifikasi wajib diisi.' });
    }
    const validKategori = ['sertifikat', 'panen', 'produksi', 'logistik', 'sistem'];
    const cat = validKategori.includes(kategori) ? kategori : 'sistem';

    const [result] = await getPool().execute(
      `INSERT INTO notifications (judul, pesan, kategori) VALUES (?, ?, ?)`,
      [String(judul).trim(), String(pesan).trim(), cat]
    );

    const [newRow] = await getPool().execute(
      `SELECT id, judul, pesan, kategori, is_read, created_at
       FROM notifications WHERE id = ? LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Notifikasi berhasil ditambahkan.',
      data: mapRowToNotif(newRow[0]),
    });
  } catch (error) {
    console.error('[createNotification] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan notifikasi.' });
  }
}

// ── Mark read ─────────────────────────────────────────────────────────────────

export async function markNotificationRead(req, res) {
  try {
    const pool = getPool();
    const param = req.params.id;

    let result;
    if (param === 'all') {
      [result] = await pool.execute(`UPDATE notifications SET is_read = 1 WHERE is_read = 0`);
      return res.status(200).json({ success: true, message: 'Semua notifikasi ditandai dibaca.' });
    }

    [result] = await pool.execute(
      `UPDATE notifications SET is_read = 1 WHERE id = ?`,
      [param]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notifikasi tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, message: 'Notifikasi ditandai dibaca.' });
  } catch (error) {
    console.error('[markNotificationRead] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui notifikasi.' });
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteNotification(req, res) {
  try {
    const [result] = await getPool().execute('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notifikasi tidak ditemukan.' });
    }
    return res.status(200).json({ success: true, message: 'Notifikasi berhasil dihapus.' });
  } catch (error) {
    console.error('[deleteNotification] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menghapus notifikasi.' });
  }
}
