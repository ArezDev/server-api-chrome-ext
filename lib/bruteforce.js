import { LRUCache } from "lru-cache";

const attempts = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 15 // simpan 15 menit
});

export default attempts;

export function checkBruteForce(username) {
  const info = attempts.get(username) || { count: 0, lockedUntil: null };
  const now = Date.now();

  if (info.lockedUntil && now < info.lockedUntil) {
    return { locked: true, message: "Account temporarily locked due to too many failed attempts" };
  }
  return { locked: false };
}

export function registerFailedAttempt(username) {
  const info = attempts.get(username) || { count: 0, lockedUntil: null };
  info.count += 1;

  if (info.count >= 5) {
    info.lockedUntil = Date.now() + 5 * 60 * 1000; // lock 5 menit
  }
  attempts.set(username, info);
}

export function resetAttempts(username) {
  attempts.delete(username);
}
