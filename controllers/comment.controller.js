import { Comment } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";
import { createNotification } from "./notification.controller.js";

export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const { postId } = req.params;

    if (!content) {
      return res.status(400).json({ success: false, message: "Comment content is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const comment = await Comment.create({
      content,
      post: postId,
      author: req.user._id,
    });

    await createNotification({
      recipient: post.author,
      sender: req.user._id,
      type: "comment",
      post: postId,
      comment: comment._id,
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const replyToComment = async (req, res) => {
  try {
    const { content } = req.body;
    const { commentId } = req.params;

    if (!content) {
      return res.status(400).json({ success: false, message: "Reply content is required" });
    }

    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    const reply = await Comment.create({
      content,
      post: parentComment.post,
      author: req.user._id,
    });

    parentComment.replies.push(reply._id);
    await parentComment.save();

    await createNotification({
      recipient: parentComment.author,
      sender: req.user._id,
      type: "reply",
      post: parentComment.post,
      comment: reply._id,
    });

    res.status(201).json({ success: true, data: reply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCommentsForPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId })
      .populate("author", "name email avatar")
      .populate("replies")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this comment" });
    }

    if (content) comment.content = content;

    const updatedComment = await comment.save();
    res.status(200).json({ success: true, data: updatedComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this comment" });
    }

    await comment.deleteOne();
    res.status(200).json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    const userId = req.user._id.toString();

    if (comment.likes.some((id) => id.toString() === userId)) {
      return res.status(400).json({ success: false, message: "You already liked this comment" });
    }

    comment.likes.push(req.user._id);
    const updatedComment = await comment.save();

    await createNotification({
      recipient: comment.author,
      sender: req.user._id,
      type: "like_comment",
      comment: comment._id,
    });

    res.status(200).json({ success: true, message: "Comment liked", data: updatedComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};