/**
 * File: backend/routes/authRoutes.js
 * Purpose: Defines API endpoints related to authentication and user registration.
 * What it does: Maps incoming HTTP requests (like /register and /login) to the 
 *               appropriate handler functions in the authController. Also sets up 
 *               multer middleware for handling 'logo' file uploads during registration.
 * Data Fetching: Receives request bodies and files from the frontend via Express.
 * Data Sending: Forwards request to authController.
 * External Dependencies: express, multer.
 * Environment Variables Required: N/A.
 * Related Files: backend/server.js, backend/controllers/authController.js
 */

const express = require('express');
const router = express.Router();
const { register, login, changePassword } = require('../controllers/authController');

// Routes
router.post('/register', register);
router.post('/login', login);
router.post('/change-password', changePassword);

module.exports = router;
