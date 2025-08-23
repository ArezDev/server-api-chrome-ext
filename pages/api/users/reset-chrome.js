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

  const [resetChrome] = await pool.execute(
    'DELETE FROM chrome_installs WHERE user_id = ?',
    [id]
  );

  if (resetChrome.affectedRows > 0) {
    res.status(200).json({
      success: true,
      message: `User ${id} chrome di reset (${resetChrome.affectedRows} chrome yang di install dihapus)!`
    });
  } else {
    res.status(404).json({
      success: false,
      message: `Tidak ada data chrome_installs untuk user ${id}`
    });
  }

};