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

router.use(protect);

// Accept up to 5 images per post under the field name "images"
router.post("/", upload.array("images", 5), createPost);
router.get("/", getPosts);
router.get("/my-posts", getMyPosts);
router.get("/:id", getPost);
router.put("/:id", upload.array("images", 5), updatePost);
router.delete("/:id", deletePost);

router.post("/:id/like", likePost);
router.delete("/:id/like", unlikePost);
router.get("/:id/likes", getPostLikers);

router.post("/:id/comments", addComment);
router.delete("/:id/comments/:commentId", deleteComment);

export default router;