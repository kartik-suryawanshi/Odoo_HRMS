/**
 * File: backend/controllers/attendanceController.js
 * Purpose: Handles attendance logic (check-in, check-out, fetching logs).
 * What it does: Inserts and updates attendance records. Calculates hours.
 * Data Fetching: Queries attendance_logs table.
 * Data Sending: Returns attendance data to frontend.
 * External Dependencies: None.
 * Environment Variables Required: N/A.
 * Related Files: backend/routes/attendanceRoutes.js
 */

const pool = require('../config/db');

// Check In
exports.checkIn = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if there is already an active check-in for today without a check-out
    const checkQuery = `
      SELECT id FROM attendance_logs 
      WHERE user_id = $1 AND check_out_time IS NULL AND DATE(check_in_time) = CURRENT_DATE
    `;
    const existing = await pool.query(checkQuery, [userId]);

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Already checked in today without checking out' });
    }

    // Insert new log using system timestamp
    const insertQuery = `
      INSERT INTO attendance_logs (user_id, check_in_time) 
      VALUES ($1, CURRENT_TIMESTAMP) RETURNING *
    `;
    const newLog = await pool.query(insertQuery, [userId]);

    res.status(201).json({ message: 'Checked in successfully', log: newLog.rows[0] });
  } catch (error) {
    console.error('Check In Error:', error);
    res.status(500).json({ message: 'Server Error during check in' });
  }
};

// Check Out
exports.checkOut = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the active check-in
    const findQuery = `
      SELECT id, check_in_time FROM attendance_logs 
      WHERE user_id = $1 AND check_out_time IS NULL
      ORDER BY check_in_time DESC LIMIT 1
    `;
    const activeLog = await pool.query(findQuery, [userId]);

    if (activeLog.rows.length === 0) {
      return res.status(400).json({ message: 'No active check-in found' });
    }

    const logId = activeLog.rows[0].id;

    // Update with check out time and calculate total hours
    const updateQuery = `
      UPDATE attendance_logs 
      SET 
        check_out_time = CURRENT_TIMESTAMP,
        total_hours = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - check_in_time)) / 3600
      WHERE id = $1
      RETURNING *
    `;
    const updatedLog = await pool.query(updateQuery, [logId]);

    res.json({ message: 'Checked out successfully', log: updatedLog.rows[0] });
  } catch (error) {
    console.error('Check Out Error:', error);
    res.status(500).json({ message: 'Server Error during check out' });
  }
};

// Get User Logs
exports.getUserLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure admin can only fetch logs, or user fetches their own
    if (req.user.role !== 'Admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const query = `
      SELECT id, check_in_time, check_out_time, total_hours 
      FROM attendance_logs
      WHERE user_id = $1
      ORDER BY check_in_time DESC
    `;
    const logs = await pool.query(query, [userId]);

    res.json(logs.rows);
  } catch (error) {
    console.error('Get User Logs Error:', error);
    res.status(500).json({ message: 'Server Error getting user logs' });
  }
};

// Get Current Status
exports.getCurrentStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT id, check_in_time, check_out_time 
      FROM attendance_logs 
      WHERE user_id = $1 AND DATE(check_in_time) = CURRENT_DATE
      ORDER BY check_in_time DESC LIMIT 1
    `;
    const status = await pool.query(query, [userId]);

    if (status.rows.length === 0) {
      return res.json({ status: 'absent' });
    }

    const log = status.rows[0];
    if (log.check_out_time) {
      return res.json({ status: 'checked_out', log });
    } else {
      return res.json({ status: 'checked_in', log });
    }
  } catch (error) {
    console.error('Get Current Status Error:', error);
    res.status(500).json({ message: 'Server Error getting status' });
  }
};
