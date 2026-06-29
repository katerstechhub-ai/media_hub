import express from "express";
import {
  createPost,
  getAll,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  dislikePost,
} from "../controllers/post.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../utilities/upload.middleware.js";

const router = express.Router();

router.get("/", getAll);
router.get("/:id", getPostById);
router.post("/", protect, upload.single("image"), createPost);
router.put("/:id", protect, upload.single("image"), updatePost);
router.delete("/:id", protect, deletePost);
router.post("/:id/like", protect, likePost);
router.post("/:id/dislike", protect, dislikePost);

export default router;