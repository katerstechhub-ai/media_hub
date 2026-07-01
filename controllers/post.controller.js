import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";
import { createNotification } from "./notification.controller.js";

// Create a post (with optional image upload)
export const createPost = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    
    const { title, content, tags } = req.body;
    
    if (!title) {
      return res.status(400).json({ 
        success: false, 
        message: "Title is required" 
      });
    }
    
    let tagsArray = [];
    if (tags) {
      if (Array.isArray(tags)) {
        tagsArray = tags;
      } else if (typeof tags === 'string') {
        tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }
    
    let imageData = null;
    if (req.file) {
      try {
        const base64 = req.file.buffer.toString("base64");
        const dataUri = `data:${req.file.mimetype};base64,${base64}`;
        
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: "mediahub",
        });
        
        imageData = {
          url: result.secure_url,
          public_id: result.public_id,
        };
        
        console.log("Cloudinary upload successful:", imageData.url);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Image upload failed: " + uploadError.message,
        });
      }
    }
    
    const post = await Post.create({
      title,
      content: content || '',
      tags: tagsArray,
      image: imageData,
      author: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all posts
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single post
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name avatar");

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update post
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this post" });
    }

    const { title, content, tags } = req.body;
    
    if (title) post.title = title;
    if (content) post.content = content;
    if (tags) {
      post.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (req.file) {
      try {
        if (post.image && post.image.public_id) {
          await cloudinary.uploader.destroy(post.image.public_id);
        }
        
        const base64 = req.file.buffer.toString("base64");
        const dataUri = `data:${req.file.mimetype};base64,${base64}`;
        
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: "mediahub",
        });
        
        post.image = {
          url: result.secure_url,
          public_id: result.public_id,
        };
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Image upload failed: " + uploadError.message,
        });
      }
    }

    await post.save();

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete post
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this post" });
    }

    if (post.image && post.image.public_id) {
      try {
        await cloudinary.uploader.destroy(post.image.public_id);
        console.log("Cloudinary image deleted:", post.image.public_id);
      } catch (cloudinaryError) {
        console.error("Cloudinary delete error:", cloudinaryError);
      }
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Like a post
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const userId = req.user._id;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save();

    if (!alreadyLiked) {
      await createNotification({
        recipient: post.author,
        sender: req.user._id,
        type: "like_post",
        post: post._id,
      });
    }

    res.status(200).json({
      success: true,
      liked: !alreadyLiked,
      likes: post.likes.length,
    });
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Unlike a post
export const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const userId = req.user._id;
    post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    await post.save();

    res.status(200).json({
      success: true,
      liked: false,
      likes: post.likes.length,
    });
  } catch (error) {
    console.error("Unlike post error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add comment
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (!text) {
      return res.status(400).json({ success: false, message: "Comment text is required" });
    }

    const comment = {
      user: req.user._id,
      text,
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete comment
export const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const commentIndex = post.comments.findIndex(
      c => c._id.toString() === req.params.commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    const comment = post.comments[commentIndex];
    if (
      comment.user.toString() !== req.user._id.toString() &&
      post.author.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this comment" });
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get my posts
export const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .populate("author", "name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    console.error("Get my posts error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};