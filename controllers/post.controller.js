import cloudinary from "../config/cloudinary.js";
import { Post } from "../models/post.model.js";

export const createPost = async (req, res) => {
  try {
    const { title, content, image, tags } = req.body;

    let imageData = { url: "", public_id: null };

    if (req.file) {
      const base64 = req.file.buffer.toString("base64");
      const dataUri = `data:${req.file.mimetype};base64,${base64}`;
      const result = await cloudinary.uploader.upload(dataUri, { folder: "mediahub" });
      imageData = { url: result.secure_url, public_id: result.public_id };
    } else if (image) {
      imageData = { url: image, public_id: null };
    }

    const post = await Post.create({
      title,
      content,
      image: imageData,
      tags,
      author: req.user._id,
    });

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.tag) filter.tags = req.query.tag;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate("author", "name email avatar")
        .populate("tags", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: posts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name email avatar")
      .populate("tags", "name");

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { title, content, image, tags } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to edit this post" });
    }

    if (title) post.title = title;
    if (content) post.content = content;
    if (tags) post.tags = tags;

    if (req.file) {
      const base64 = req.file.buffer.toString("base64");
      const dataUri = `data:${req.file.mimetype};base64,${base64}`;
      const result = await cloudinary.uploader.upload(dataUri, { folder: "mediahub" });
      post.image = { url: result.secure_url, public_id: result.public_id };
    } else if (image) {
      post.image = { url: image, public_id: null };
    }

    const updatedPost = await post.save();
    res.status(200).json({ success: true, data: updatedPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this post" });
    }

    await post.deleteOne();
    res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const userId = req.user._id.toString();

    if (post.likes.some((id) => id.toString() === userId)) {
      return res.status(400).json({ success: false, message: "You already liked this post" });
    }

    post.dislikes = post.dislikes.filter((id) => id.toString() !== userId);
    post.likes.push(req.user._id);

    const updatedPost = await post.save();
    res.status(200).json({ success: true, message: "Post liked", data: updatedPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const dislikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const userId = req.user._id.toString();

    if (post.dislikes.some((id) => id.toString() === userId)) {
      return res.status(400).json({ success: false, message: "You already disliked this post" });
    }

    post.likes = post.likes.filter((id) => id.toString() !== userId);
    post.dislikes.push(req.user._id);

    const updatedPost = await post.save();
    res.status(200).json({ success: true, message: "Post disliked", data: updatedPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};