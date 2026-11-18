import express from "express";
import {
  register,
  login,
  guestLogin,
  logout,
  search,
  getMe,
  getUserProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  forgotPassword,
  resetPassword,
  deleteAccount,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../utilities/upload.middleware.js";
import { authLimiter, forgotPasswordLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
// No authLimiter here on purpose: at an event, everyone shares the venue wifi
// IP, so a per-IP limit would lock guests out after a few entries.
router.post("/guest", guestLogin);
router.post("/logout", protect, logout);
router.get("/search", protect, search);
router.get("/me", protect, getMe);
router.get("/users/:id", getUserProfile);
router.put("/me", protect, updateProfile);
router.put("/me/avatar", protect, upload.single("avatar"), updateAvatar);
router.put("/me/password", protect, changePassword);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.delete("/me", protect, deleteAccount);

export default router;