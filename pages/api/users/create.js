import bcrypt from 'bcryptjs';
import pool from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username, password, role = 'member', max_chrome = 25 } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  const hash = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO users (username, password, role, max_chrome) VALUES (?, ?, ?, ?)', [username, hash, role, max_chrome]);
  res.json({ ok: true });
}