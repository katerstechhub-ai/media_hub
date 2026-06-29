import express from "express";
import {
  register,
  login,
  logout,
  search,
  getMe,
  updateProfile,
  updateAvatar,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../utilities/upload.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/search", protect, search);
router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.put("/me/avatar", protect, upload.single("avatar"), updateAvatar);

export default router;