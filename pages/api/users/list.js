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

  //validasi admin
  const [rows] = await pool.execute(
    'SELECT username, role FROM users WHERE role = ? LIMIT 1',
    [dataAdmin.role]
  );

  const user = rows[0];
  if (!user) {
    return res.status(401).json({ error: 'Admin not found' });
  }

  try {
    // // Ambil semua user
    // const [rows] = await pool.execute(
    //   `SELECT 
    //   id, username, password, role, max_chrome, akses 
    //   FROM server_extensions.users WHERE role = 'member'
    //   `
    // );

    // // Ambil total chrome yang sudah di install oleh user
    // const [users_chrome] = await pool.execute(
    //   `SELECT 
    //   extension_id, user_id 
    //   FROM chrome_installs WHERE user_id = ?
    //   `,
    //   [rows]
    // );

    // // Kirim response sukses
    // res.status(200).json({
    //   users: rows,
    //   total_chrome: users_chrome
    // });

  // Ambil semua user
  const [rows] = await pool.execute(
    `SELECT 
      id, username, password, role, max_chrome, akses 
    FROM server_extensions.users 
    WHERE role = 'member'`
  );

  // Ambil semua chrome_installs untuk user2 yang ada
  const userIds = rows.map(u => u.id);
  let users_chrome = [];

  if (userIds.length > 0) {
    const [chromeData] = await pool.query(
      `SELECT user_id, COUNT(*) as total 
      FROM chrome_installs 
      WHERE user_id IN (?)
      GROUP BY user_id`,
      [userIds]
    );
    users_chrome = chromeData;
  }

  // Gabungkan hasil count ke data user
  const usersWithChrome = rows.map(user => {
    const found = users_chrome.find(c => c.user_id === user.id);
    return {
      ...user,
      total_chrome: found ? found.total : 0
    };
  });

  // Kirim response sukses
  res.status(200).json({
    users: usersWithChrome
  });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}