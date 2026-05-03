/**
 * File: backend/routes/attendanceRoutes.js
 * Purpose: Defines the routing for attendance tracking endpoints.
 * What it does: Mounts check-in, check-out, and log fetching endpoints.
 * Data Fetching: N/A.
 * Data Sending: N/A.
 * External Dependencies: express.
 * Environment Variables Required: N/A.
 * Related Files: backend/controllers/attendanceController.js
 */

const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getUserLogs, getCurrentStatus, getAttendanceSummary, getAllLogsByDate, heartbeat } = require('../controllers/attendanceController');
const { protect, hrAndAdmin, noPayroll } = require('../middleware/authMiddleware');
const { requireCheckIn } = require('../middleware/attendanceMiddleware');

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/status', protect, getCurrentStatus);
router.get('/summary', protect, noPayroll, getAttendanceSummary);
router.get('/all', protect, hrAndAdmin, getAllLogsByDate);
router.get('/logs/:userId', protect, hrAndAdmin, requireCheckIn, getUserLogs);
router.post('/pulse', protect, heartbeat);

module.exports = router;
