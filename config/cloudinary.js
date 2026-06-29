import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

dotenv.config()

// Debug: Check if env vars are loaded
console.log('=== Cloudinary Config Debug ===')
console.log('CLOUD_NAME:', process.env.CLOUD_NAME || 'NOT SET')
console.log('CLOUD_API_KEY:', process.env.CLOUD_API_KEY ? 'SET ✅' : 'NOT SET ❌')
console.log('CLOUD_API_SECRET:', process.env.CLOUD_API_SECRET ? 'SET ✅' : 'NOT SET ❌')

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true
})

// Test the configuration
try {
  // This will test if credentials work
  const testResult = await cloudinary.api.ping()
  console.log('Cloudinary connection test:', testResult.status)
} catch (error) {
  console.error('Cloudinary configuration error:', error.message)
}

export default cloudinary