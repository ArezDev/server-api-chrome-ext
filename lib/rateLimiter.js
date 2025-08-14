import rateLimit from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 5, // maksimal 5 request per menit per IP
  message: {
    error: "Too many login attempts, please try again later."
  },
  standardHeaders: true, // return info di RateLimit-* headers
  legacyHeaders: false,  // nonaktifkan X-RateLimit-* headers lama
});