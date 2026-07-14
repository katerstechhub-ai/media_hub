import express from "express";
import {
  register,
  login,
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

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/search", protect, search);
router.get("/me", protect, getMe);
// ✅ Public: view another user's profile (safe fields only) — must stay above "/:id"-style routes if any are added later
router.get("/users/:id", getUserProfile);
router.put("/me", protect, updateProfile);
router.put("/me/avatar", protect, upload.single("avatar"), updateAvatar);
router.put("/me/password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.delete("/me", protect, deleteAccount);

export default router;