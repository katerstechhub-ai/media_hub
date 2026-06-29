import cloudinary from "../config/cloudinary.js"
import { Post } from "../models/post.model.js"

export const createPost = async (req, res) => {
  try {
    console.log('=== CREATE POST ===')
    console.log('Body:', req.body)
    console.log('File:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file')
    console.log('User:', req.user?._id)

    const { title, content, tags } = req.body

    // Validate
    if (!title && !content && !req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide title, content, or an image" 
      })
    }

    let imageData = { url: "", public_id: null }

    // Upload to Cloudinary if file exists
    if (req.file) {
      try {
        // Convert buffer to base64
        const base64 = req.file.buffer.toString("base64")
        const dataUri = `data:${req.file.mimetype};base64,${base64}`
        
        console.log('Uploading to Cloudinary...')
        
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: "mediahub",
          use_filename: true,
          unique_filename: true,
          transformation: [
            { quality: "auto:good" },
            { fetch_format: "auto" }
          ]
        })
        
        console.log('Cloudinary upload successful:', result.secure_url)
        imageData = {
          url: result.secure_url,
          public_id: result.public_id
        }
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError)
        return res.status(400).json({
          success: false,
          message: `Cloudinary error: ${cloudinaryError.message}`
        })
      }
    }

    // Parse tags
    let parsedTags = []
    if (tags) {
      if (Array.isArray(tags)) {
        parsedTags = tags
      } else if (typeof tags === 'string') {
        try {
          parsedTags = JSON.parse(tags)
        } catch {
          parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean)
        }
      }
    }

    // Create post
    const post = await Post.create({
      title: title || '',
      content: content || '',
      image: imageData,
      tags: parsedTags,
      author: req.user._id,
    })

    console.log('Post created successfully:', post._id)

    res.status(201).json({
      success: true,
      data: post
    })
  } catch (error) {
    console.error('Create post error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create post'
    })
  }
}