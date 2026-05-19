const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary with env credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer from multer memoryStorage
 * @param {string} folder - Cloudinary folder name e.g. 'trading/avatars'
 * @param {string} publicId - Optional custom public_id
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadToCloudinary = (fileBuffer, folder = 'trading', publicId = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'],
      transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }]
    };
    if (publicId) options.public_id = publicId;

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete a file from Cloudinary by public_id
 * @param {string} publicId
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  return cloudinary.uploader.destroy(publicId);
};

/**
 * Extract public_id from a Cloudinary URL
 * e.g. https://res.cloudinary.com/dyzioo0rx/image/upload/v123/trading/avatars/user-001.jpg
 * → trading/avatars/user-001
 */
const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    // Remove version prefix (v12345/) if present
    const withoutVersion = parts[1].replace(/^v\d+\//, '');
    // Remove file extension
    return withoutVersion.replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary, extractPublicId };
