import bcrypt from 'bcryptjs';
import pool from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {

  //cek admin
  const IsadminLoggedIn = req.cookies?.['admin_key'];
  if (!IsadminLoggedIn) return res.status(403).json({ error: "Not Logged in" });

  const dataAdmin = verifyToken(IsadminLoggedIn);
  if (!dataAdmin) return res.status(403).json({ error: "Not valid admin" });

  //validasi admin
  const [rows] = await pool.execute(
    'SELECT username, role FROM users WHERE role = ? LIMIT 1',
    [dataAdmin.role]
  );

  const user = rows[0];
  if (!user) {
    return res.status(401).json({ error: 'Admin not found' });
  }

  if (req.method === 'POST') {
    const { username, password, maxchrome } = req.body;

    if (!username || !password || !maxchrome) {
      return res.status(400).json({ message: 'Username, password, and max chrome are required' });
    }

    try {

      // Hashing password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user into the database
      await pool.query(
        'INSERT INTO users (username, password, max_chrome) VALUES (?, ?, ?)',
        [username, hashedPassword, maxchrome]
      );

      res.status(201).json({ success: true, message: 'User created successfully', userId: username });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Server Error' });
    }

  } else {
    // If method is not POST, return Method Not Allowed
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}