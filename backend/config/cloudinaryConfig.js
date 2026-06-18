const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary ko credentials dena
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage engine set karna (Kahan aur kaise save hogi image)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'devsync_profile_pics', // Cloudinary par is naam ka folder banega
    allowed_formats: ['jpg', 'jpeg', 'png'], // Sirf yehi formats allowed hain
  },
});

const upload = multer({ storage: storage });

module.exports = upload;