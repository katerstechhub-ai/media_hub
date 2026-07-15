import { Readable } from "node:stream";

// Proxies a Cloudinary-hosted image or video back through our own server
// with a Content-Disposition: attachment header. This is necessary because:
//   1. Cloudinary's response doesn't set that header, so opening the raw
//      URL just shows the file in the browser instead of saving it.
//   2. The frontend's <a href={cloudinaryUrl} download> trick is silently
//      ignored by browsers for cross-origin URLs (Cloudinary is a
//      different origin than the app), so it can't force a save on its own.
// Routing the bytes through here fixes both, for images and videos alike.
export const downloadMedia = async (req, res) => {
  try {
    const { url, filename } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ success: false, message: "A media 'url' query param is required" });
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid url" });
    }

    // Only ever proxy our own Cloudinary "mediahub" assets — never an
    // arbitrary URL — otherwise this endpoint becomes an open proxy/SSRF hole.
    const isAllowedHost = parsed.hostname === "res.cloudinary.com";
    const isMediahubAsset = parsed.pathname.includes("/mediahub/");
    if (!isAllowedHost || !isMediahubAsset) {
      return res.status(400).json({ success: false, message: "URL is not an allowed media asset" });
    }

    const upstream = await fetch(parsed.toString());
    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({ success: false, message: "Failed to fetch media from storage" });
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");

    const fallbackName = parsed.pathname.split("/").pop() || "download";
    const safeName = filename
      ? String(filename).replace(/[^a-zA-Z0-9._-]/g, "_")
      : fallbackName;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
    if (contentLength) res.setHeader("Content-Length", contentLength);

    Readable.fromWeb(upstream.body).pipe(res);
  } catch (error) {
    console.error("Download media error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};