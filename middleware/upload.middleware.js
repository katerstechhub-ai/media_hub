const multer = require('multer')
const path = require('path')

// Memory storage (since you're using buffer to convert to base64)
const storage = multer.memoryStorage()

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  // Allowed image types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed!'), false)
  }
}

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
})

module.exports = upload