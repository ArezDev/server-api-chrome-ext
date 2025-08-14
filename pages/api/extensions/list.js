import pool from '../../../lib/db';
import { parseTokenFromReq, verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  const token = parseTokenFromReq(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const userId = payload.uid;
  const [rows] = await pool.query('SELECT id, extension_id, installed_at FROM chrome_installs WHERE user_id = ? ORDER BY installed_at DESC', [userId]);
  res.json({ installs: rows });
}