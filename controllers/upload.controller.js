import cloudinary from "../config/cloudinary.js";

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

// Keep single-image upload for backward compatibility if needed
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

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
