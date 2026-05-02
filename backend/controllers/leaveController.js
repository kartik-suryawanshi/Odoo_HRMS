const pool = require('../config/db');

// --- Leave Requests ---

// Create a new leave request
exports.createLeaveRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { leave_type, start_date, end_date, reason, attachment_url } = req.body;

    const query = `
      INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason, attachment_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, leave_type, start_date, end_date, reason, attachment_url]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create Leave Request Error:', error);
    res.status(500).json({ message: 'Server Error creating leave request' });
  }
};

// Get leave requests (Role-based)
exports.getLeaveRequests = async (req, res) => {
  try {
    let query = `
      SELECT lr.*, up.full_name as name
      FROM leave_requests lr
      JOIN user_profiles up ON lr.user_id = up.user_id
    `;
    let params = [];

    // Employees and Payroll Officers only see their own requests (or limited view)
    // Actually, according to the new rule, only Admin and HR see everything.
    if (req.user.role !== 'Admin' && req.user.role !== 'HR Officer') {
      query += ` WHERE lr.user_id = $1`;
      params.push(req.user.id);
    }

    query += ` ORDER BY lr.created_at DESC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get Leave Requests Error:', error);
    res.status(500).json({ message: 'Server Error getting leave requests' });
  }
};

// Update Leave Status (Approve/Reject)
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    // Only Admin or HR can approve
    if (req.user.role !== 'Admin' && req.user.role !== 'HR Officer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = `UPDATE leave_requests SET status = $1 WHERE id = $2 RETURNING *`;
    const result = await pool.query(query, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update Leave Status Error:', error);
    res.status(500).json({ message: 'Server Error updating leave status' });
  }
};

// --- Leave Allocations ---

// Allocate leaves to an employee
exports.allocateLeave = async (req, res) => {
  try {
    const { user_id, leave_type, total_days, year } = req.body;

    // Only Admin or HR can allocate
    if (req.user.role !== 'Admin' && req.user.role !== 'HR Officer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = `
      INSERT INTO leave_allocations (user_id, leave_type, total_days, year)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, leave_type, year) 
      DO UPDATE SET total_days = EXCLUDED.total_days
      RETURNING *
    `;
    const result = await pool.query(query, [user_id, leave_type, total_days, year]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Allocate Leave Error:', error);
    res.status(500).json({ message: 'Server Error allocating leave' });
  }
};

// Get Leave Balances for a user
exports.getLeaveBalances = async (req, res) => {
  try {
    const userId = req.query.userId || req.user.id;
    const year = req.query.year || new Date().getFullYear();

    // 1. Get allocations
    const allocQuery = `SELECT leave_type, total_days FROM leave_allocations WHERE user_id = $1 AND year = $2`;
    const allocs = await pool.query(allocQuery, [userId, year]);

    // 2. Get approved leaves used
    const usedQuery = `
      SELECT leave_type, SUM(end_date - start_date + 1) as used_days
      FROM leave_requests
      WHERE user_id = $1 AND status = 'Approved' AND EXTRACT(YEAR FROM start_date) = $2
      GROUP BY leave_type
    `;
    const used = await pool.query(usedQuery, [userId, year]);

    // Combine
    const balances = allocs.rows.map(a => {
      const u = used.rows.find(ur => ur.leave_type === a.leave_type);
      const usedDays = u ? parseFloat(u.used_days) : 0;
      return {
        leave_type: a.leave_type,
        total: parseFloat(a.total_days),
        used: usedDays,
        available: parseFloat(a.total_days) - usedDays
      };
    });

    res.json(balances);
  } catch (error) {
    console.error('Get Leave Balances Error:', error);
    res.status(500).json({ message: 'Server Error getting leave balances' });
  }
};
