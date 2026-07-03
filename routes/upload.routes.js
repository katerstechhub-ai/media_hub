import express from "express";
import { uploadImage, uploadImages } from "../controllers/upload.controller.js";
import { upload } from "../utilities/upload.middleware.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Single image upload (original behavior)
router.post("/single", protect, upload.single("image"), uploadImage);

// Multiple images upload — up to 10 images at once
router.post("/multiple", protect, upload.array("images", 10), uploadImages);

export default router;
