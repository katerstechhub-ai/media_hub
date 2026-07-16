import express from "express";
import { uploadImage, uploadImages, getUploadSignature } from "../controllers/upload.controller.js";
import { upload } from "../utilities/upload.middleware.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Single image upload (original behavior)
router.post("/single", protect, upload.single("image"), uploadImage);

// Multiple images upload — up to 10 images at once
router.post("/multiple", protect, upload.array("images", 10), uploadImages);

// New: issues a signed direct-to-Cloudinary upload for the browser to use,
// so large video uploads skip Render entirely for the file transfer.
router.get("/sign", protect, getUploadSignature);

export default router;