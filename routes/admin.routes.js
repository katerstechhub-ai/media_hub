import express from "express";
import {
  getAllUsers,
  blockUser,
  unblockUser,
  deleteUser,
  adminDeletePost,
  adminDeleteComment,
  getStats,
} from "../controllers/admin.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

// every route here requires a logged-in admin
router.use(protect, requireAdmin);

router.get("/users", getAllUsers);
router.put("/users/:id/block", blockUser);
router.put("/users/:id/unblock", unblockUser);
router.delete("/users/:id", deleteUser);
router.delete("/posts/:id", adminDeletePost);
router.delete("/comments/:id", adminDeleteComment);
router.get("/stats", getStats);

export default router;