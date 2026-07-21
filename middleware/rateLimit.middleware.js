import rateLimit from "express-rate-limit";

// Applies to login/register — blocks brute-force password guessing and
// mass fake-account creation. 10 attempts per 15 minutes per IP.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Applies to forgot-password — stops someone spamming reset emails to a
// target inbox or using it to enumerate which emails are registered.
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many reset requests. Try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// General fallback for the whole API — loose ceiling just to stop
// straightforward flooding/scraping.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: "Too many requests. Try again shortly." },
  standardHeaders: true,
  legacyHeaders: false,
});