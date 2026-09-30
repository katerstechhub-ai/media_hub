import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "like_post",
        "dislike_post",
        "comment",
        "reply",
        "like_comment",
        "follow",
        "like_thought",
        "reply_thought",
      ],
      required: true,
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
    // like_thought: the liked thought. reply_thought: the parent thought that was replied to.
    thought: { type: mongoose.Schema.Types.ObjectId, ref: "Thought" },
    // reply_thought only: the reply itself.
    thoughtReply: { type: mongoose.Schema.Types.ObjectId, ref: "Thought" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);