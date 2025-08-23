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

  const { id } = req.query;

  if (req.method === 'PUT') {
    // Update User
    const { username, password, maxchrome, edit_akses } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Username required' });
    }

    try {
      // Prepare the update query and values
      const updatedFields = [];
      const values = [];

      // edit username
      if (username) {
        updatedFields.push('username = ?');
        values.push(username);
      }
      
      // edit maxchrome
      if (maxchrome) {
        updatedFields.push('max_chrome = ?');
        values.push(maxchrome);
      }

      // If password is provided, hash it
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10
        updatedFields.push('password = ?');
        values.push(hashedPassword);
      }

      if (edit_akses) {
        function isoToMysql(isoUtc) {
          const d = new Date(isoUtc); // ex: 2025-12-31T17:00:00.000Z
          const pad = n => n.toString().padStart(2, '0');
          return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
        }
        updatedFields.push('akses = ?');
        values.push(isoToMysql(edit_akses));
      }

      // Create the final SQL query string
      const sqlQuery = `UPDATE users SET ${updatedFields.join(', ')} WHERE id = ?`;
      values.push(id);

      // Execute the update query
      const [result] = await pool.query(sqlQuery, values);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ success: true, message: 'User updated successfully' });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Server Error' });
    }

  } else if (req.method === 'DELETE') {
    // Delete User
    try {
      const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Server Error' });
    }

  } else {
    // Method Not Allowed
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}