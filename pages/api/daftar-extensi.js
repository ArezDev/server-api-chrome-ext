import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, extensionId, profileName } = req.body;
  if (!userId || !extensionId) {
    return res.status(400).json({ error: 'Data kurang' });
  }

  // Ambil data user
  const [user] = await query('SELECT id, max_chrome FROM users WHERE id = ?', [userId]);
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }

  // Hitung total extension yang sudah diinstall user ini
  const [countRow] = await query(
    'SELECT COUNT(*) AS count FROM chrome_installs WHERE user_id = ?',
    [userId]
  );
  const installedCount = countRow?.count || 0;

  // Cek apakah sudah mencapai batas max_chrome
  if (installedCount >= user.max_chrome) {
    return res.status(403).json({ error: 'Batas penggunaan extension tercapai' });
  }

  // Tambahkan extension_id meskipun sama, selama belum melebihi batas
  await query(
    `INSERT INTO chrome_installs (user_id, extension_id, profile_name, installed_at, last_used_at)
     VALUES (?, ?, ?, NOW(), NOW())`,
    [userId, extensionId, profileName || null]
  );

  return res.status(200).json({ success: true, message: 'Extension berhasil ditambahkan' });
}