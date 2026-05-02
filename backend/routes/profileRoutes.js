/**
 * File: backend/routes/profileRoutes.js
 * Purpose: Routing for profile management.
 * What it does: Defines GET and PUT endpoints for user profiles.
 * Data Fetching: N/A.
 * Data Sending: N/A.
 * External Dependencies: express.
 * Environment Variables Required: N/A.
 * Related Files: backend/controllers/profileController.js
 */

const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getProfile);
router.get('/:userId', protect, getProfile);
router.put('/', protect, updateProfile);

module.exports = router;
