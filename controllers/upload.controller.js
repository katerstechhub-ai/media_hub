// ── ADD this import at the top of your existing upload.controller.js ──
import cloudinary from "../config/cloudinary.js";

// ── ADD this function anywhere in your existing upload.controller.js,
//    alongside your current uploadImage / uploadImages exports ──

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