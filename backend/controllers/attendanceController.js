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

    // Check if there is already an active check-in (ANY date)
    const checkQuery = `
      SELECT id FROM attendance_logs 
      WHERE user_id = $1 AND check_out_time IS NULL
    `;
    const existing = await pool.query(checkQuery, [userId]);

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'You have an active session. Please check out first.' });
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

    // 1. Get the final heartbeat count to ensure total_hours is accurate
    const countRes = await pool.query('SELECT COUNT(*) FROM attendance_heartbeats WHERE log_id = $1', [logId]);
    const heartbeatCount = parseInt(countRes.rows[0].count);
    const totalHours = (heartbeatCount * 5) / 60;

    // 2. Update with check out time and final verified hours
    const updateQuery = `
      UPDATE attendance_logs 
      SET 
        check_out_time = CURRENT_TIMESTAMP,
        total_hours = $1
      WHERE id = $2
      RETURNING *
    `;
    const updatedLog = await pool.query(updateQuery, [totalHours, logId]);

    res.json({ message: 'Checked out successfully', log: updatedLog.rows[0] });
  } catch (error) {
    console.error('Check Out Error:', error);
    res.status(500).json({ message: 'Server Error during check out' });
  }
};

// Get User Logs
exports.getUserLogs = async (req, res) => {
  try {
    let { userId } = req.params;
    
    // Resolve 'me' to the current logged-in user's ID
    if (userId === 'me') {
      userId = req.user.id;
    } else {
      userId = parseInt(userId);
    }

    // Ensure authorized to view logs
    if (req.user.role !== 'Admin' && req.user.id !== userId) {
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

    // 1. First, check if there is an active session (ANY date)
    const activeQuery = `
      SELECT id, check_in_time, check_out_time 
      FROM attendance_logs 
      WHERE user_id = $1 AND check_out_time IS NULL
      ORDER BY check_in_time DESC LIMIT 1
    `;
    const activeStatus = await pool.query(activeQuery, [userId]);

    if (activeStatus.rows.length > 0) {
      return res.json({ status: 'checked_in', log: activeStatus.rows[0] });
    }

    // 2. Otherwise, check for the latest completed session today
    const todayQuery = `
      SELECT id, check_in_time, check_out_time 
      FROM attendance_logs 
      WHERE user_id = $1 AND DATE(check_in_time) = CURRENT_DATE
      ORDER BY check_in_time DESC LIMIT 1
    `;
    const todayStatus = await pool.query(todayQuery, [userId]);

    if (todayStatus.rows.length === 0) {
      return res.json({ status: 'absent' });
    }

    const log = todayStatus.rows[0];
    return res.json({ status: 'checked_out', log });
  } catch (error) {
    console.error('Get Current Status Error:', error);
    res.status(500).json({ message: 'Server Error getting status' });
  }
};

// Get All Logs for a Specific Date (Admin/HR/Payroll view)
exports.getAllLogsByDate = async (req, res) => {
  try {
    const { date } = req.query; // Expects YYYY-MM-DD
    const targetDate = date || 'CURRENT_DATE';

    const query = `
      SELECT 
        u.id as user_id, p.full_name as name, u.role,
        al.check_in_time, al.check_out_time, al.total_hours
      FROM users u
      JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN attendance_logs al ON u.id = al.user_id AND DATE(al.check_in_time) = $1
      WHERE u.role != 'Admin'
      ORDER BY p.full_name ASC
    `;
    const logs = await pool.query(query, [targetDate === 'CURRENT_DATE' ? new Date().toISOString().split('T')[0] : targetDate]);

    res.json(logs.rows);
  } catch (error) {
    console.error('Get All Logs By Date Error:', error);
    res.status(500).json({ message: 'Server Error getting daily logs' });
  }
};

// Get Attendance Summary for Employee (Month-wise)
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { userId: targetUserId, month, year } = req.query; // Expects userId, MM and YYYY
    
    // Determine whose data to fetch
    let userId = req.user.id;
    if (targetUserId && (req.user.role === 'Admin' || req.user.role === 'HR Officer' || req.user.role === 'Payroll Officer')) {
      userId = parseInt(targetUserId);
    }

    const targetMonth = month || (new Date().getMonth() + 1);
    const targetYear = year || new Date().getFullYear();

    // 1. Get detailed logs for the month
    const logsQuery = `
      SELECT id, check_in_time, check_out_time, total_hours 
      FROM attendance_logs
      WHERE user_id = $1 AND EXTRACT(MONTH FROM check_in_time) = $2 AND EXTRACT(YEAR FROM check_in_time) = $3
      ORDER BY check_in_time DESC
    `;
    const logsRes = await pool.query(logsQuery, [userId, targetMonth, targetYear]);

    // 2. Calculate summary stats
    const today = new Date();
    const isCurrentMonth = today.getMonth() + 1 === parseInt(targetMonth) && today.getFullYear() === parseInt(targetYear);

    const uniqueDaysPresent = new Set(logsRes.rows.map(l => new Date(l.check_in_time).toDateString())).size;
    
    // Total working days in month (assuming Mon-Fri)
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    let totalWorkingDays = 0;
    let workingDaysToDate = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(targetYear, targetMonth - 1, d);
      const isWorking = date.getDay() !== 0 && date.getDay() !== 6;
      if (isWorking) {
        totalWorkingDays++;
        if (isCurrentMonth && d <= today.getDate()) {
          workingDaysToDate++;
        }
      }
    }

    // Absences only count for days that have already passed
    const absences = isCurrentMonth ? Math.max(0, workingDaysToDate - uniqueDaysPresent) : Math.max(0, totalWorkingDays - uniqueDaysPresent);

    res.json({
      logs: logsRes.rows,
      summary: {
        presentCount: uniqueDaysPresent,
        leavesCount: absences,
        totalWorkingDays: totalWorkingDays,
        workingDaysToDate: workingDaysToDate // Optional: useful for UI
      }
    });
  } catch (error) {
    console.error('Get Attendance Summary Error:', error);
    res.status(500).json({ message: 'Server Error getting attendance summary' });
  }
};

// Pulse Heartbeat (Every 5 minutes from frontend)
exports.heartbeat = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Find the active check-in for this user
    const findQuery = `
      SELECT id FROM attendance_logs 
      WHERE user_id = $1 AND check_out_time IS NULL AND DATE(check_in_time) = CURRENT_DATE
      ORDER BY check_in_time DESC LIMIT 1
    `;
    const activeLog = await pool.query(findQuery, [userId]);

    if (activeLog.rows.length === 0) {
      return res.status(400).json({ message: 'No active session. Please check in first.' });
    }

    const logId = activeLog.rows[0].id;

    // 2. Record the heartbeat
    await pool.query(
      'INSERT INTO attendance_heartbeats (user_id, log_id, timestamp) VALUES ($1, $2, CURRENT_TIMESTAMP)',
      [userId, logId]
    );

    // 3. Update total_hours based on heartbeat count
    // Each heartbeat represents a 5-minute interval of active presence
    const countRes = await pool.query('SELECT COUNT(*) FROM attendance_heartbeats WHERE log_id = $1', [logId]);
    const heartbeatCount = parseInt(countRes.rows[0].count);
    const totalHours = (heartbeatCount * 5) / 60; // 5 mins per pulse, converted to hours

    await pool.query(
      'UPDATE attendance_logs SET total_hours = $1 WHERE id = $2',
      [totalHours, logId]
    );

    res.json({ message: 'Pulse recorded', total_hours: totalHours.toFixed(2) });
  } catch (error) {
    console.error('Heartbeat Error:', error);
    res.status(500).json({ message: 'Server Error during pulse' });
  }
};
