const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'greetingCards',
    allowed_formats: ['jpg', 'png', 'mp3', 'wav', 'mp4', 'mov', 'avi'], 
    resource_type: 'auto' 
  }
});

module.exports = { cloudinary, storage };


