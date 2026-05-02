/**
 * File: backend/routes/salaryRoutes.js
 * Purpose: Defines salary management endpoints.
 * What it does: Mounts GET and PUT for salary configuration.
 * Data Fetching: N/A.
 * Data Sending: N/A.
 * External Dependencies: express.
 * Environment Variables Required: N/A.
 * Related Files: backend/controllers/salaryController.js
 */

const express = require('express');
const router = express.Router();
const { getSalaryInfo, updateSalaryInfo } = require('../controllers/salaryController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:userId', protect, getSalaryInfo);
router.put('/:userId', protect, updateSalaryInfo);

module.exports = router;
