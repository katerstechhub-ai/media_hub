import express from "express";
import { createTag, getTags } from "../controllers/tag.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getTags);
router.post("/", protect, createTag);

export default router;
