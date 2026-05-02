/**
 * File: backend/controllers/payrollController.js
 * Purpose: Aggregates payroll data for the Admin Dashboard.
 */

const pool = require('../config/db');

exports.getPayrollSummary = async (req, res) => {
  try {
    // Join users with salary_info and salary_templates
    const query = `
      SELECT 
        u.user_id, 
        u.name, 
        u.role, 
        s.monthly_wage, 
        s.template_id,
        t.name as template_name,
        t.basic_percent,
        t.hra_percent,
        t.pf_percent,
        t.professional_tax
      FROM users u
      LEFT JOIN salary_info s ON u.user_id = s.user_id
      LEFT JOIN salary_templates t ON s.template_id = t.id
      ORDER BY u.name ASC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Payroll Summary Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
