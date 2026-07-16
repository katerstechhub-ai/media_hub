import cloudinary from "../config/cloudinary.js";

// Single image upload (legacy path — still used by /api/upload/single,
// and kept for backward compatibility).
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Convert the buffer into a base64 data URI Cloudinary can accept directly.
    const base64 = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "mediahub",
    });

    res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Multiple image upload (legacy path — still used by /api/upload/multiple).
export const uploadImages = async (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploaded = [];

    for (const file of files) {
      const base64 = file.buffer.toString("base64");
      const dataUri = `data:${file.mimetype};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "mediahub",
      });

      uploaded.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    res.status(201).json({
      count: uploaded.length,
      images: uploaded,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Issues a short-lived signature the browser can use to upload a file
// straight to Cloudinary — bypasses this backend entirely for the actual
// file bytes, which is what makes large video uploads fast. Only the params
// actually being signed (timestamp + folder) need to match what the client
// sends; Cloudinary recomputes and rejects the upload if they don't match,
// and rejects stale timestamps (~1hr window), so a leaked signature has a
// short shelf life.
export const getUploadSignature = async (req, res) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = "mediahub";

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUD_API_SECRET
    );

    res.status(200).json({
      success: true,
      data: {
        signature,
        timestamp,
        folder,
        apiKey: process.env.CLOUD_API_KEY,
        cloudName: process.env.CLOUD_NAME,
      },
    });
  } catch (error) {
    console.error("Get upload signature error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};