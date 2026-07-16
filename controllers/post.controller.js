import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import cloudinary from "../config/cloudinary.js";
import { createNotification } from "./notification.controller.js";

const MAX_MEDIA_ITEMS = 10;

// The browser now uploads directly to Cloudinary (see upload.controller.js)
// and sends us back the resulting { url, public_id, ... } objects instead of
// the raw file. This picks only the expected fields off whatever the client
// sent and drops anything whose public_id isn't under our "mediahub/" folder
// — a lightweight sanity check that the item actually came through our
// signed-upload flow (which always writes into that folder) rather than
// being an arbitrary Cloudinary URL someone typed into the request body.
// It is NOT a full ownership check (that would require calling Cloudinary's
// admin API per item); it's enough for this app's threat model since the
// signature endpoint itself is auth-gated.
const sanitizeMediaArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(
      (item) =>
        item &&
        typeof item.url === "string" &&
        typeof item.public_id === "string" &&
        item.public_id.startsWith("mediahub/")
    )
    .map((item) => ({
      url: item.url,
      public_id: item.public_id,
      ...(typeof item.thumbnail === "string" ? { thumbnail: item.thumbnail } : {}),
      ...(typeof item.duration === "number" ? { duration: item.duration } : {}),
    }));
};

// Deletes a post's existing images/videos from Cloudinary. Videos need
// resource_type: "video" passed explicitly or the destroy call silently
// no-ops (Cloudinary defaults to looking for an image with that public_id).
const destroyPostMedia = async (post) => {
  const jobs = [];

  if (post.images && post.images.length > 0) {
    jobs.push(
      ...post.images
        .filter((img) => img.public_id)
        .map((img) => cloudinary.uploader.destroy(img.public_id, { resource_type: "image" }))
    );
  }

  if (post.videos && post.videos.length > 0) {
    jobs.push(
      ...post.videos
        .filter((v) => v.public_id)
        .map((v) => cloudinary.uploader.destroy(v.public_id, { resource_type: "video" }))
    );
  }

  await Promise.all(jobs);
};

// Create a post. Media (if any) has already been uploaded directly to
// Cloudinary by the browser — req.body.images / req.body.videos carry the
// resulting metadata, not files. No multer/file handling happens here
// anymore, which is exactly why this request is small and fast regardless
// of how large the original video was.
export const createPost = async (req, res) => {
  try {
    const { title, content, tags, images, videos } = req.body;

    const imagesData = sanitizeMediaArray(images);
    const videosData = sanitizeMediaArray(videos);

    if (!title?.trim() && !content?.trim() && imagesData.length === 0 && videosData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Add a title, some content, or a photo/video",
      });
    }

    if (imagesData.length + videosData.length > MAX_MEDIA_ITEMS) {
      return res.status(400).json({
        success: false,
        message: `You can add up to ${MAX_MEDIA_ITEMS} media items`,
      });
    }

    let tagsArray = [];
    if (tags) {
      if (Array.isArray(tags)) {
        tagsArray = tags;
      } else if (typeof tags === "string") {
        tagsArray = tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    const post = await Post.create({
      title: title?.trim() || "",
      content: content?.trim() || "",
      tags: tagsArray,
      images: imagesData,
      videos: videosData,
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
      .populate("author", "name avatar bio createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // One aggregate query for ALL posts' comment counts at once, instead of
    // making the frontend fire a separate /api/comments/:postId request per
    // post just to show a count. This is the main fix for feed load speed.
    const postIds = posts.map((p) => p._id);
    const counts = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: "$post", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    const postsWithCounts = posts.map((p) => ({
      ...p,
      commentCount: countMap.get(String(p._id)) || 0,
    }));

    res.status(200).json({
      success: true,
      count: postsWithCounts.length,
      data: postsWithCounts,
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
      .populate("author", "name avatar bio createdAt");

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

// Update post. Same deal as createPost — images/videos in the body (if
// present) are already-uploaded Cloudinary metadata, not files.
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this post" });
    }

    const { title, content, tags, images, videos } = req.body;

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (tags) {
      post.tags = Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim()).filter(Boolean);
    }

    // Only touch media if the client actually sent media fields — this lets
    // a title/content-only edit go through without silently wiping images.
    // Sending images/videos as [] on purpose (removing all media) is
    // supported since the keys being present is what triggers a replace.
    const hasNewMedia = "images" in req.body || "videos" in req.body;
    if (hasNewMedia) {
      const imagesData = sanitizeMediaArray(images);
      const videosData = sanitizeMediaArray(videos);

      if (imagesData.length + videosData.length > MAX_MEDIA_ITEMS) {
        return res.status(400).json({
          success: false,
          message: `You can add up to ${MAX_MEDIA_ITEMS} media items`,
        });
      }

      // Replacing media: remove the old images/videos from Cloudinary first
      await destroyPostMedia(post);
      post.images = imagesData;
      post.videos = videosData;
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

    // Clean up both images AND videos from Cloudinary before removing the
    // post document.
    try {
      await destroyPostMedia(post);
      console.log(
        "Cloudinary media deleted:",
        [...(post.images || []).map((i) => i.public_id), ...(post.videos || []).map((v) => v.public_id)]
      );
    } catch (cloudinaryError) {
      console.error("Cloudinary delete error:", cloudinaryError);
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

// Get the list of users who liked a post (for the Likes page)
export const getPostLikers = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("likes", "name avatar");

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    res.status(200).json({
      success: true,
      count: post.likes.length,
      data: post.likes,
    });
  } catch (error) {
    console.error("Get post likers error:", error);
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
      .populate("author", "name avatar bio createdAt")
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