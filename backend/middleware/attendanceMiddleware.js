/**
 * File: backend/middleware/attendanceMiddleware.js
 * Purpose: Middleware to enforce that a user is actively checked in.
 * What it does: Queries the database to verify if the user has an active check-in session for the current day.
 *               If not, it blocks access to protected routes.
 * Data Fetching: Queries `attendance_logs`.
 * Data Sending: Returns 403 Forbidden if not checked in.
 * External Dependencies: None.
 * Environment Variables Required: N/A.
 * Related Files: backend/routes/employeeRoutes.js, backend/routes/attendanceRoutes.js
 */

const pool = require('../config/db');

const requireCheckIn = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const checkQuery = `
      SELECT id FROM attendance_logs 
      WHERE user_id = $1 AND check_out_time IS NULL AND DATE(check_in_time) = CURRENT_DATE
    `;
    const existing = await pool.query(checkQuery, [userId]);

    if (existing.rows.length === 0) {
      return res.status(403).json({ 
        message: 'You must be checked in to access this resource.', 
        code: 'NOT_CHECKED_IN' 
      });
    }

    next();
  } catch (error) {
    console.error('Attendance Middleware Error:', error);
    res.status(500).json({ message: 'Server error checking attendance status' });
  }
};

module.exports = { requireCheckIn };
