import { query, pool } from '../../../lib/db';
import { parseTokenFromReq, verifyToken, signRefreshToken } from '../../../lib/auth';
import crypto from 'crypto';

const LICENSE_SECRET = process.env.LICENSE_SECRET;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = parseTokenFromReq(req);
  if (!token) return res.status(401).json({ error: "No token" });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });

  const { fingerprint } = req.body;
  if (!fingerprint) return res.status(400).json({ error: "Missing fingerprint" });
  
  // Enkripsi fingerprint untuk validasi
  const fingerprintHmac = crypto.createHmac('sha256', LICENSE_SECRET).update(fingerprint).digest('hex');

  // Cek fingerprint sama seperti di token
  if (payload.data !== fingerprintHmac) {
    return res.status(403).json({ error: "Fingerprint mismatch" });
  }

  // Cek expiry lisensi
  const [user] = await query("SELECT akses, refresh_version FROM users WHERE id = ?", [payload.uid]);
  if (!user || new Date(user.akses) < new Date()) {
    return res.status(403).json({ error: "License expired" });
  }

  // cek type token
  if (payload.type !== 'refresh') {
    return res.status(403).json({ error: "invalid token" });
  }

  // cek versi token user
  if (payload.ver !== user.refresh_version) {
    return res.status(403).json({ error: "error token or invalid" });
  }

  
  const newVer = payload.ver + 1;

  // update refreshToken di server
  const updateUserVersion = await query("UPDATE users SET refresh_version = ? WHERE id = ?", [
    newVer,
    payload.uid,
  ]);

  if (updateUserVersion.affectedRows > 0) {

    // Buat refreshToken baru kalau data user valid ges
    const refreshToken = signRefreshToken({
        uid: payload.uid,
        data: payload.data,
        type: 'refresh',
        ver: newVer
    });

    return res.status(200).json({ ok: true, refreshToken });

  } else {

    res.status(404).json({
        ok: false,
        message: `invalid user`
      });

  }

  
}