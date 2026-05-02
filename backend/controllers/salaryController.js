/**
 * File: backend/controllers/salaryController.js
 * Purpose: Manages employee salary configuration.
 * What it does: Fetches and updates salary records in the salary_info table.
 * Data Fetching: Queries salary_info table.
 * Data Sending: Returns salary configuration data.
 * External Dependencies: None.
 * Environment Variables Required: N/A.
 * Related Files: backend/routes/salaryRoutes.js
 */

const pool = require('../config/db');
const { calculateSalary } = require('../utils/calculationEngine');

// Get Salary Info (Detailed Breakdown)
exports.getSalaryInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Permission check
    if (req.user.role !== 'Admin' && req.user.role !== 'Payroll Officer' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { month, year } = req.query;
    const breakdown = await calculateSalary(userId, month, year);
    res.json(breakdown);
  } catch (error) {
    console.error('Get Salary Error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// Update Salary Assignment (Set Grade and Wage)
exports.updateSalaryInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    const { monthly_wage, grade_id } = req.body;

    // Admin or HR can assign grades
    if (req.user.role !== 'Admin' && req.user.role !== 'HR Officer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = `
      UPDATE users 
      SET monthly_wage = $1, grade_id = $2
      WHERE id = $3
      RETURNING *
    `;

    await pool.query(query, [monthly_wage, grade_id, userId]);
    
    // Return the new calculated breakdown
    const newBreakdown = await calculateSalary(userId);
    res.json({ message: 'Salary assigned successfully', breakdown: newBreakdown });
  } catch (error) {
    console.error('Update Salary Error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
