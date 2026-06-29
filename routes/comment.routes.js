import express from "express";
import {
  addComment,
  replyToComment,
  getCommentsForPost,
  updateComment,
  deleteComment,
  likeComment,
} from "../controllers/comment.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/:postId", getCommentsForPost);
router.post("/:postId", protect, addComment);
router.post("/reply/:commentId", protect, replyToComment);
router.put("/:id", protect, updateComment);
router.delete("/:id", protect, deleteComment);
router.post("/:id/like", protect, likeComment);

export default router;