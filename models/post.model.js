import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: false },
    content: { type: String, required: false },
    image: {
      url: { type: String, default: "" },
      public_id: { type: String, default: null },
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const Post = mongoose.model("Post", postSchema);