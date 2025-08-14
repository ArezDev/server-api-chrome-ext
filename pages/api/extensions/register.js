import pool from '../../../lib/db';
import { parseTokenFromReq, verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const token = parseTokenFromReq(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const userId = payload.uid;
  const { extension_id } = req.body || {};
  if (!extension_id) return res.status(400).json({ error: 'Missing extension_id' });

  // Ambil batas max_chrome dan jumlah instalasi saat ini
  const [[info]] = await pool.query(
    `SELECT (SELECT COUNT(*) FROM chrome_installs WHERE user_id = ?) AS total_install, u.max_chrome
     FROM users u WHERE u.id = ? LIMIT 1`,
    [userId, userId]
  );

  if (!info) return res.status(404).json({ error: 'User not found' });

  if (info.total_install >= info.max_chrome) {
    return res.status(403).json({ error: 'Limit profil Chrome sudah tercapai' });
  }

  // Cek apakah extension_id sudah terdaftar untuk user
  const [exist] = await pool.query('SELECT id FROM chrome_installs WHERE user_id = ? AND extension_id = ? LIMIT 1', [userId, extension_id]);
  if (exist.length > 0) {
    return res.json({ ok: true, message: 'Sudah terdaftar sebelumnya' });
  }

  // Insert
  await pool.query('INSERT INTO chrome_installs (user_id, extension_id) VALUES (?, ?)', [userId, extension_id]);
  return res.json({ ok: true, message: 'Ekstensi berhasil didaftarkan' });
}