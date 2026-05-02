/**
 * File: backend/config/cloudinary.js
 * Purpose: Configures and exports the Cloudinary service instance.
 * What it does: Initializes the cloudinary v2 SDK with credentials from .env
 *               so that it can be used to upload images (like company logos).
 * Data Fetching: Fetches API keys and secrets from environment variables (.env).
 * Data Sending: Exports the configured cloudinary object for use in controllers.
 * External Dependencies: cloudinary.
 * Environment Variables Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
 * Related Files: backend/controllers/authController.js
 */

const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
