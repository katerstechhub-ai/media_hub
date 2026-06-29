import express from "express";
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  deleteComment,
  getMyPosts,
} from "../controllers/post.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js"; // ✅ ADD THIS

const router = express.Router();

router.use(protect);

// ✅ ADD upload.single('image') here
router.post("/", upload.single("image"), createPost);
router.get("/", getPosts);
router.get("/my-posts", getMyPosts);
router.get("/:id", getPost);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);

router.post("/:id/like", likePost);
router.delete("/:id/like", unlikePost);

router.post("/:id/comments", addComment);
router.delete("/:id/comments/:commentId", deleteComment);

export default router;