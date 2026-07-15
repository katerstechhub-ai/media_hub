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

export const Post = mongoose.model("Post", postSchema);