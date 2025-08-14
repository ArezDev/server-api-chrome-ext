import pool from '../../../lib/db';
import { parseTokenFromReq, verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    // Hanya izinkan metode GET
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Ambil token dari request (cookie, header, dll.)
    const token = parseTokenFromReq(req);
    if (!token) {
      res.status(401).json({ error: 'Not authenticated (no token)' });
      return;
    }

    // Verifikasi token
    const payload = verifyToken(token);
    if (!payload || !payload.uid) {
      res.status(401).json({ error: 'Invalid token or payload' });
      return;
    }

    // Query user dari DB
    const [rows] = await pool.execute(
      'SELECT id, username, password, role, max_chrome, akses FROM server_extensions.users WHERE id = ? LIMIT 1',
      [payload.uid]
    );

    if (!rows || rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Kirim response sukses
    res.status(200).json({ user: rows[0] });

  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}