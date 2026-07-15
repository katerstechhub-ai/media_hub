import multer from 'multer'

// Memory storage — files land as buffers so they can be streamed straight
// to Cloudinary, nothing touches disk.
const storage = multer.memoryStorage()

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime', // .mov
  'video/webm',
  'video/x-matroska', // .mkv
  'video/x-msvideo', // .avi
  'video/mpeg',
  'video/3gpp',
]

export const IMAGE_SIZE_LIMIT = 10 * 1024 * 1024 // 10MB per image
export const VIDEO_SIZE_LIMIT = 100 * 1024 * 1024 // 100MB per video

export const isImage = (mimetype) => IMAGE_MIME_TYPES.includes(mimetype)
export const isVideo = (mimetype) => VIDEO_MIME_TYPES.includes(mimetype)

// multer's built-in fileSize limit applies the same number to every file in
// the request, so it's set here to the larger (video) ceiling just to let
// multer through. The real, per-type limits (10MB images / 100MB videos)
// are enforced in the post controller's splitAndValidateFiles(), which runs
// BEFORE anything is uploaded to Cloudinary.
const fileFilter = (req, file, cb) => {
  if (isImage(file.mimetype) || isVideo(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only image and video files are allowed!'), false)
  }
}

// Configure multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: VIDEO_SIZE_LIMIT,
  },
  fileFilter: fileFilter,
})