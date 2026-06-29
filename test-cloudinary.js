import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

console.log('=== Testing Cloudinary Credentials ===')
console.log('CLOUD_NAME:', process.env.CLOUD_NAME || '❌ NOT SET')
console.log('CLOUD_API_KEY:', process.env.CLOUD_API_KEY ? '✅ SET' : '❌ NOT SET')
console.log('CLOUD_API_SECRET:', process.env.CLOUD_API_SECRET ? '✅ SET' : '❌ NOT SET')

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true
})

async function testCloudinary() {
  try {
    console.log('\n🔍 Testing Cloudinary connection...')
    
    // Test 1: Ping the API
    const pingResult = await cloudinary.api.ping()
    console.log('✅ Connection test:', pingResult.status)
    
    // Test 2: Try to upload a tiny test image
    console.log('\n📤 Testing upload...')
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    
    const uploadResult = await cloudinary.uploader.upload(testImage, {
      folder: 'test',
      public_id: 'test-upload-' + Date.now()
    })
    
    console.log('✅ Upload successful!')
    console.log('   URL:', uploadResult.secure_url)
    console.log('   Public ID:', uploadResult.public_id)
    console.log('   Format:', uploadResult.format)
    console.log('   Size:', uploadResult.bytes, 'bytes')
    
    // Test 3: Delete the test image
    console.log('\n🗑️ Cleaning up test image...')
    await cloudinary.uploader.destroy(uploadResult.public_id)
    console.log('✅ Test image deleted')
    
    console.log('\n🎉 All tests passed! Your Cloudinary credentials are correct.')
    
  } catch (error) {
    console.error('\n❌ Cloudinary error:')
    console.error('   Message:', error.message)
    console.error('   Full error:', error)
    
    console.log('\n💡 Possible fixes:')
    console.log('1. Check your CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET in .env file')
    console.log('2. Make sure the API key is active in your Cloudinary dashboard')
    console.log('3. If you\'re using Render, make sure environment variables are set')
    console.log('4. Try regenerating your API key in Cloudinary dashboard')
    console.log('5. Check if your Cloudinary account is active')
  }
}

// Run the test
testCloudinary()