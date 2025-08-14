import pool from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { signToken, setTokenCookie } from '../../../lib/auth';
import crypto from 'crypto';

const LICENSE_SECRET = process.env.LICENSE_SECRET;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { username, password, fingerprint } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username/password' });
  }

  try {
    // Ambil user berdasarkan username
    const [rows] = await pool.execute(
      'SELECT id, username, password, role, max_chrome, akses FROM server_extensions.users WHERE username = ? LIMIT 1',
      [username]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Bandingkan password input dengan hash
    const match = await bcrypt.compare(password, user.password || '');
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Enkripsi data yang diperlukan
    const fingerprintHmac = crypto.createHmac('sha256', LICENSE_SECRET).update(fingerprint).digest('hex');

    // Buat JWT token
    const token = signToken({
      uid: user.id,
      role: user.role,
      user: user.username,
      max_chrome: user.max_chrome,
      akses: user.akses,
      data: fingerprintHmac
    });

    // Set cookie
    setTokenCookie(res, token);

    // Kirim response sukses
    res.status(200).json({
      ok: true,
      user: {
        id: user.id,
        role: user.role,
        user: user.username,
        max_chrome: user.max_chrome,
        akses: user.akses
      },
      accessToken: token,
      fingerprint: fingerprintHmac,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}