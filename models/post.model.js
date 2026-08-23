import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: false },
    content: { type: String, required: false },
    images: [
      {
        url: { type: String, default: "" },
        public_id: { type: String, default: null },
      },
    ],
    videos: [
      {
        url: { type: String, default: "" },
        public_id: { type: String, default: null },
        // Cloudinary can derive a jpg frame from any uploaded video for free,
        // handy as a poster/thumbnail in feed grids before the video plays.
        thumbnail: { type: String, default: "" },
        duration: { type: Number, default: null },
      },
    ],
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Feed sorts by createdAt descending — this is the index that makes
// Post.find().sort({ createdAt: -1 }) an index scan instead of a full
// collection scan as the posts collection grows.
postSchema.index({ createdAt: -1 });
// getMyPosts filters by author then sorts by createdAt — a compound index
// covers both parts of that query in one pass.
postSchema.index({ author: 1, createdAt: -1 });

export const Post = mongoose.model("Post", postSchema);