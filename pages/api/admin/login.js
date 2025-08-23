import pool from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { signAdmin } from '../../../lib/auth';
import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(403).json({ error: "Missing username or password" });
  }

  try {
    // Ambil user berdasarkan username
    const [rows] = await pool.execute(
      'SELECT id, username, password, role FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Bandingkan password input dengan hash di DB
    const match = await bcrypt.compare(password, user.password || '');
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token (misalnya dengan signAdmin)
    const token = signAdmin({ id: user.id, username: user.username, role: user.role });

    //set Cookie
    const serialized = cookie.serialize('admin_key', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    res.setHeader('Set-Cookie', serialized);

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      token
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
