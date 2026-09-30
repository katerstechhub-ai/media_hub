import mongoose from "mongoose";

const stickerSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['emoji', 'url'], required: true },
    value: { type: String, required: true, maxlength: 500 },
  },
  { _id: false }
)

const thoughtSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, trim: true, maxlength: 280, default: '' },
    sticker: { type: stickerSchema, default: null },
    // null = top-level thought, otherwise the thought this one replies to
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Thought', default: null, index: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replyCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

thoughtSchema.index({ parent: 1, createdAt: -1 })

const Thought = mongoose.models.Thought || mongoose.model('Thought', thoughtSchema);

export default Thought;