import express from "express";
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getPostLikers,
  addComment,
  deleteComment,
  getMyPosts,
} from "../controllers/post.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js"; // ✅ ADD THIS

const router = express.Router();

// Public reads — no auth required
router.get("/", getPosts);
router.get("/my-posts", protect, getMyPosts); // must come before /:id
router.get("/:id", getPost);
router.get("/:id/likes", getPostLikers);

// Mutating routes — require auth
router.post("/", protect, upload.single("image"), createPost);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

router.post("/:id/like", protect, likePost);
router.delete("/:id/like", protect, unlikePost);

router.post("/:id/comments", protect, addComment);
router.delete("/:id/comments/:commentId", protect, deleteComment);

export default router;