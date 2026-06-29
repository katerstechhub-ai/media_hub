import express from "express";
import { uploadImage } from "../controllers/upload.controller.js";
import { upload } from "../utilities/upload.middleware.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, upload.single("image"), uploadImage);

export default router;