/**
 * File: backend/controllers/payrollController.js
 * Purpose: Aggregates payroll data for the Admin Dashboard.
 */

const pool = require('../config/db');

exports.getPayrollSummary = async (req, res) => {
  try {
    const adminId = req.user.id;

    // 1. Get the admin's company_id
    const adminProfile = await pool.query('SELECT company_id FROM user_profiles WHERE user_id = $1', [adminId]);
    if (adminProfile.rows.length === 0) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }
    const companyId = adminProfile.rows[0].company_id;

    // 2. Fetch all users in that company (Employees, HR, Payroll) except the admin
    // Use COALESCE to get the name from either table to be safe
    const query = `
      SELECT 
        u.id as user_id, 
        up.full_name as name, 
        u.role, 
        u.monthly_wage, 
        u.grade_id,
        g.name as grade_name,
        t.name as template_name
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN grades g ON u.grade_id = g.id
      LEFT JOIN salary_templates t ON g.template_id = t.id
      WHERE up.company_id = $1 AND u.id != $2
      ORDER BY name ASC
    `;
    
    const result = await pool.query(query, [companyId, adminId]);
    
    res.json({ employees: result.rows });
  } catch (error) {
    console.error('Payroll Summary Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
