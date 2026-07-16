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
import { downloadMedia } from "../controllers/download.controller.js";
import { protect } from "../middleware/auth.middleware.js";
// NOTE: `upload` (multer) middleware is no longer used on the post routes —
// the browser now uploads media directly to Cloudinary (see upload.routes.js)
// and posts/PUTs a small JSON body with the resulting URLs instead of raw
// files. multer/upload.middleware.js is still used elsewhere (e.g. avatar
// upload), so it hasn't been removed from the project — just from here.

const router = express.Router();

// Public routes — guests can view posts without logging in
router.get("/", getPosts);
router.get("/my-posts", protect, getMyPosts); // must come before "/:id" or it'll be swallowed
router.get("/download", downloadMedia); // proxy download for images/videos — must come before "/:id" too
router.get("/:id/likes", getPostLikers);
router.get("/:id", getPost);

// Everything below requires authentication
router.use(protect);

// Body is now plain JSON: { title, content, tags, images, videos }, where
// images/videos are the [{ url, public_id, ... }] results from a direct
// Cloudinary upload the browser already performed.
router.post("/", createPost);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);

router.post("/:id/like", likePost);
router.delete("/:id/like", unlikePost);

router.post("/:id/comments", addComment);
router.delete("/:id/comments/:commentId", deleteComment);

export default router;