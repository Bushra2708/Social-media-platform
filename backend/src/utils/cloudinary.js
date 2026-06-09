const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();

let isCloudinaryConfigured = false;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  isCloudinaryConfigured = true;
  console.log("Cloudinary configured successfully.");
} else {
  console.log(
    "Cloudinary environment variables missing. Defaulting to local Base64 database storage fallback."
  );
}

/**
 * Uploads a file buffer to Cloudinary or falls back to a base64 DataURI.
 * @param {Express.Multer.File} file - The file object from Multer memory storage.
 * @returns {Promise<string|null>} The URL of the image or base64 data string.
 */
const uploadImage = async (file) => {
  if (!file) return null;

  try {
    if (isCloudinaryConfigured) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "social_sphere",
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              return reject(error);
            }
            resolve(result.secure_url);
          }
        );
        uploadStream.end(file.buffer);
      });
    } else {
      // Fallback: Convert to data URI
      const base64String = file.buffer.toString("base64");
      return `data:${file.mimetype};base64,${base64String}`;
    }
  } catch (error) {
    console.error("Error in uploadImage helper:", error);
    throw error;
  }
};

module.exports = {
  uploadImage,
};
