import { getPool } from '../config/db.js';
import { slugNama, tanggalKode, kodeUnik, buatCekAda } from '../utils/kodeUtil.js';

function mapRowToPlanting(row) {
  const fmt = (v) => {
    if (!v) return null;
    if (v instanceof Date) return v.toISOString().slice(0,10);
    const s = String(v);
    // jika sudah YYYY-MM-DD dari DATE_FORMAT, langsung pakai 10 char pertama
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
    // fallback untuk format Date string "Fri Apr 24..." -> parse
    const d = new Date(v);
    return isNaN(d.getTime()) ? s.slice(0,10) : d.toISOString().slice(0,10);
  };
  return {
    id: String(row.id),
    kodeTanam: row.kode_tanam,
    lahanId: row.lahan_id != null ? String(row.lahan_id) : null,
    kodeLahan: row.kode_lahan || null,
    namaLahan: row.nama_lahan || null,
    tanggalTanam: fmt(row.tanggal_tanam),
    estimasiPanen: fmt(row.estimasi_panen),
    varietas: row.varietas,
    jumlahLubang: row.jumlah_lubang != null ? Number(row.jumlah_lubang) : 0,
    luasTanam: row.luas_tanam != null ? Number(row.luas_tanam) : null,
    petugas: row.petugas || '',
    statusTanam: row.status_tanam,
    catatan: row.catatan || '',
    fotoUrl: row.foto_url || null,
    createdAt: row.created_at,
  };
}

function validatePlanting(data) {
  const statusVals = ['Ditanam','Tumbuh','Siap Panen','Gagal','Dipanen'];
  if (!data.lahanId) return 'Lahan wajib dipilih.';
  if (!data.tanggalTanam) return 'Tanggal tanam wajib diisi.';
  if (!data.varietas || !String(data.varietas).trim()) return 'Varietas wajib diisi.';
  if (!data.petugas || !String(data.petugas).trim()) return 'Petugas penanaman wajib diisi.';
  if (data.jumlahLubang != null && (isNaN(Number(data.jumlahLubang)) || Number(data.jumlahLubang) < 0)) return 'Jumlah lubang tidak valid.';
  if (data.statusTanam && !statusVals.includes(data.statusTanam)) return 'Status tanam tidak valid.';
  if (data.tanggalTanam && data.estimasiPanen) {
    const t = new Date(data.tanggalTanam); const e = new Date(data.estimasiPanen);
    if (!isNaN(t.getTime()) && !isNaN(e.getTime()) && e < t) return 'Estimasi panen tidak boleh sebelum tanggal tanam.';
  }
  return null;
}

export async function getPlantings(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = String(req.query.search || '').trim();
    const lahanId = String(req.query.lahanId || req.query.lahan_id || '').trim();
    const status = String(req.query.status || '').trim();
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    if (search) {
      conditions.push(`(p.kode_tanam LIKE ? OR p.varietas LIKE ? OR p.petugas LIKE ? OR l.nama_lahan LIKE ?)`);
      const sp = `%${search}%`; params.push(sp,sp,sp,sp);
    }
    if (lahanId) { conditions.push(`p.lahan_id = ?`); params.push(lahanId); }
    if (status) { conditions.push(`p.status_tanam = ?`); params.push(status); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const pool = getPool();
    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM plantings p LEFT JOIN lands l ON p.lahan_id=l.id ${whereClause}`, params);
    const total = Number(countRows[0].total);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const [rows] = await pool.query(
      `SELECT p.id, p.kode_tanam, p.lahan_id, l.kode_lahan, l.nama_lahan, DATE_FORMAT(p.tanggal_tanam, '%Y-%m-%d') AS tanggal_tanam, DATE_FORMAT(p.estimasi_panen, '%Y-%m-%d') AS estimasi_panen, p.varietas, p.jumlah_lubang, p.luas_tanam, p.petugas, p.status_tanam, p.catatan, p.foto_url, p.created_at
       FROM plantings p LEFT JOIN lands l ON p.lahan_id=l.id
       ${whereClause}
       ORDER BY p.tanggal_tanam DESC, p.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return res.status(200).json({ success: true, data: rows.map(mapRowToPlanting), pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 } });
  } catch (e) {
    console.error('[getPlantings] Error:', e.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data penanaman.' });
  }
}

export async function getPlantingById(req, res) {
  try {
    const [rows] = await getPool().execute(
      `SELECT p.id, p.kode_tanam, p.lahan_id, l.kode_lahan, l.nama_lahan, DATE_FORMAT(p.tanggal_tanam, '%Y-%m-%d') AS tanggal_tanam, DATE_FORMAT(p.estimasi_panen, '%Y-%m-%d') AS estimasi_panen, p.varietas, p.jumlah_lubang, p.luas_tanam, p.petugas, p.status_tanam, p.catatan, p.foto_url, p.created_at
       FROM plantings p LEFT JOIN lands l ON p.lahan_id=l.id WHERE p.id=? LIMIT 1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Data penanaman tidak ditemukan.' });
    return res.status(200).json({ success: true, data: mapRowToPlanting(rows[0]) });
  } catch (e) {
    console.error('[getPlantingById] Error:', e.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail penanaman.' });
  }
}

export async function createPlanting(req, res) {
  try {
    const data = req.body || {};
    const validationError = validatePlanting(data);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const pool = getPool();
    // validasi lahan ada + ambil nama lahan utk kode
    const [landRows] = await pool.execute('SELECT id, nama_lahan FROM lands WHERE id=? LIMIT 1', [data.lahanId]);
    if (!landRows.length) return res.status(400).json({ success: false, message: 'Lahan tidak ditemukan.' });

    let kodeTanam = String(data.kodeTanam || '').trim();
    if (!kodeTanam) {
      // TNM -> LUS-15012026-01 (slug nama lahan + tanggal tanam + urutan)
      const slug = slugNama(landRows[0].nama_lahan);
      const tgl = tanggalKode(data.tanggalTanam);
      kodeTanam = await kodeUnik(
        (seq) => `${slug}-${tgl}-${String(seq).padStart(2, '0')}`,
        buatCekAda(pool, 'plantings', 'kode_tanam')
      );
    }

    // hitung luas tanam default dari lahan jika tidak diisi
    let luasTanam = data.luasTanam;
    if (luasTanam == null || luasTanam === '') {
      const [lr] = await pool.execute('SELECT luas_hektar FROM lands WHERE id=?', [data.lahanId]);
      luasTanam = lr[0]?.luas_hektar || null;
    }

    const [result] = await pool.execute(
      `INSERT INTO plantings (kode_tanam, lahan_id, tanggal_tanam, estimasi_panen, varietas, jumlah_lubang, luas_tanam, petugas, status_tanam, catatan, foto_url)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [kodeTanam, data.lahanId, data.tanggalTanam, data.estimasiPanen || null, String(data.varietas).trim(), Number(data.jumlahLubang)||0, luasTanam ? Number(luasTanam) : null, String(data.petugas||'').trim(), data.statusTanam||'Ditanam', data.catatan||'', data.fotoUrl||null]
    );
    const [newRow] = await pool.execute(`SELECT p.id, p.kode_tanam, p.lahan_id, l.kode_lahan, l.nama_lahan, DATE_FORMAT(p.tanggal_tanam, '%Y-%m-%d') AS tanggal_tanam, DATE_FORMAT(p.estimasi_panen, '%Y-%m-%d') AS estimasi_panen, p.varietas, p.jumlah_lubang, p.luas_tanam, p.petugas, p.status_tanam, p.catatan, p.foto_url, p.created_at FROM plantings p LEFT JOIN lands l ON p.lahan_id=l.id WHERE p.id=? LIMIT 1`, [result.insertId]);
    return res.status(201).json({ success: true, message: 'Data penanaman berhasil ditambahkan.', data: mapRowToPlanting(newRow[0]) });
  } catch (e) {
    console.error('[createPlanting] Error:', e.message);
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Kode tanam sudah digunakan.' });
    return res.status(500).json({ success: false, message: 'Gagal menambahkan data penanaman.' });
  }
}

export async function updatePlanting(req, res) {
  try {
    const { id } = req.params; const data = req.body || {};
    const pool = getPool();
    const [existing] = await pool.execute('SELECT id FROM plantings WHERE id=? LIMIT 1', [id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Data penanaman tidak ditemukan.' });
    if (data.lahanId) {
      const [lr] = await pool.execute('SELECT id FROM lands WHERE id=? LIMIT 1', [data.lahanId]);
      if (!lr.length) return res.status(400).json({ success: false, message: 'Lahan tidak ditemukan.' });
    }
    const validationError = validatePlanting({ lahanId: data.lahanId || 1, tanggalTanam: data.tanggalTanam || '2000-01-01', varietas: data.varietas || 'x', petugas: data.petugas || 'x', jumlahLubang: data.jumlahLubang, statusTanam: data.statusTanam, estimasiPanen: data.estimasiPanen });
    // allow partial update: hanya cek yang dikirim
    if (data.petugas !== undefined && !String(data.petugas).trim()) return res.status(400).json({ success: false, message: 'Petugas penanaman wajib diisi.' });
    if (data.statusTanam && !['Ditanam','Tumbuh','Siap Panen','Gagal','Dipanen'].includes(data.statusTanam)) return res.status(400).json({ success: false, message: 'Status tanam tidak valid.' });

    const fieldMap = { kodeTanam:'kode_tanam', lahanId:'lahan_id', tanggalTanam:'tanggal_tanam', estimasiPanen:'estimasi_panen', varietas:'varietas', jumlahLubang:'jumlah_lubang', luasTanam:'luas_tanam', petugas:'petugas', statusTanam:'status_tanam', catatan:'catatan', fotoUrl:'foto_url' };
    const sets=[]; const values=[];
    for (const [k,col] of Object.entries(fieldMap)) if (data[k] !== undefined) { sets.push(`${col}=?`); values.push(data[k]===''?null:data[k]); }
    if (sets.length) await pool.execute(`UPDATE plantings SET ${sets.join(', ')} WHERE id=?`, [...values, id]);
    const [updatedRow] = await pool.execute(`SELECT p.id, p.kode_tanam, p.lahan_id, l.kode_lahan, l.nama_lahan, DATE_FORMAT(p.tanggal_tanam, '%Y-%m-%d') AS tanggal_tanam, DATE_FORMAT(p.estimasi_panen, '%Y-%m-%d') AS estimasi_panen, p.varietas, p.jumlah_lubang, p.luas_tanam, p.petugas, p.status_tanam, p.catatan, p.foto_url, p.created_at FROM plantings p LEFT JOIN lands l ON p.lahan_id=l.id WHERE p.id=? LIMIT 1`, [id]);
    return res.status(200).json({ success: true, message: 'Data penanaman berhasil diperbarui.', data: mapRowToPlanting(updatedRow[0]) });
  } catch (e) {
    console.error('[updatePlanting] Error:', e.message);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data penanaman.' });
  }
}

export async function deletePlanting(req, res) {
  try {
    const pool = getPool();
    // cek dipakai panen?
    const [used] = await pool.execute('SELECT id FROM harvests WHERE planting_id=? LIMIT 1', [req.params.id]);
    if (used.length) return res.status(409).json({ success: false, message: 'Penanaman sudah dipakai data panen, tidak bisa dihapus.' });
    const [result] = await pool.execute('DELETE FROM plantings WHERE id=?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Data penanaman tidak ditemukan.' });
    return res.status(200).json({ success: true, message: 'Data penanaman berhasil dihapus.' });
  } catch (e) {
    console.error('[deletePlanting] Error:', e.message);
    return res.status(500).json({ success: false, message: 'Gagal menghapus data penanaman.' });
  }
}
