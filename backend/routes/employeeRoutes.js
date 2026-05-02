/**
 * File: backend/routes/employeeRoutes.js
 * Purpose: Defines the routing for employee management endpoints.
 * What it does: Mounts GET and POST endpoints for employees.
 * Data Fetching: N/A.
 * Data Sending: N/A.
 * External Dependencies: express.
 * Environment Variables Required: N/A.
 * Related Files: backend/controllers/employeeController.js
 */

const express = require('express');
const router = express.Router();
const { getEmployees, addEmployee } = require('../controllers/employeeController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { requireCheckIn } = require('../middleware/attendanceMiddleware');

router.route('/')
  .get(protect, adminOnly, requireCheckIn, getEmployees)
  .post(protect, adminOnly, requireCheckIn, addEmployee);

module.exports = router;
