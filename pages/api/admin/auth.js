import pool from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const IsadminLoggedIn = req.cookies?.['admin_key'];
  if (!IsadminLoggedIn) return res.status(403).json({ error: "Not Logged in" });

  const dataAdmin = verifyToken(IsadminLoggedIn);
  if (!dataAdmin) return res.status(403).json({ error: "Not valid admin" });

  try {

    // Ambil user berdasarkan username
    const [rows] = await pool.execute(
      'SELECT username, role FROM users WHERE role = ? LIMIT 1',
      [dataAdmin.role]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    // Bandingkan password input dengan hash di DB
    // const match = await bcrypt.compare(password, user.password || '');
    // if (!match) {
    //   return res.status(401).json({ error: 'Invalid credentials' });
    // }

    return res.status(200).json({
      authenticated: true
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
