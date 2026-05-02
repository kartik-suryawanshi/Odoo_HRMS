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

// Get Salary Info
exports.getSalaryInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check permissions: Admin or Payroll Officer can see any salary. 
    // Employees can't see even their own (as per context.md: "Restrictions: Cannot access ... salary info")
    if (req.user.role !== 'Admin' && req.user.role !== 'Payroll Officer') {
      return res.status(403).json({ message: 'Access denied to salary information' });
    }

    const query = 'SELECT * FROM salary_info WHERE user_id = $1';
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      // Return default empty structure if no record exists yet
      return res.json({
        user_id: userId,
        monthly_wage: 0,
        working_days_per_week: 5,
        break_time_hrs: 1,
        basic_percent: 50,
        hra_percent: 50,
        standard_allowance: 0,
        performance_bonus_percent: 0,
        lta_percent: 0,
        pf_percent: 12,
        professional_tax: 200
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get Salary Error:', error);
    res.status(500).json({ message: 'Server Error fetching salary info' });
  }
};

// Update Salary Info
exports.updateSalaryInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      monthly_wage, working_days_per_week, break_time_hrs,
      basic_percent, hra_percent, standard_allowance,
      performance_bonus_percent, lta_percent, pf_percent,
      professional_tax
    } = req.body;

    if (req.user.role !== 'Admin' && req.user.role !== 'Payroll Officer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = `
      INSERT INTO salary_info (
        user_id, monthly_wage, working_days_per_week, break_time_hrs,
        basic_percent, hra_percent, standard_allowance,
        performance_bonus_percent, lta_percent, pf_percent, professional_tax
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id) DO UPDATE SET
        monthly_wage = EXCLUDED.monthly_wage,
        working_days_per_week = EXCLUDED.working_days_per_week,
        break_time_hrs = EXCLUDED.break_time_hrs,
        basic_percent = EXCLUDED.basic_percent,
        hra_percent = EXCLUDED.hra_percent,
        standard_allowance = EXCLUDED.standard_allowance,
        performance_bonus_percent = EXCLUDED.performance_bonus_percent,
        lta_percent = EXCLUDED.lta_percent,
        pf_percent = EXCLUDED.pf_percent,
        professional_tax = EXCLUDED.professional_tax,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId, monthly_wage, working_days_per_week, break_time_hrs,
      basic_percent, hra_percent, standard_allowance,
      performance_bonus_percent, lta_percent, pf_percent, professional_tax
    ]);

    res.json({ message: 'Salary info updated successfully', salary: result.rows[0] });
  } catch (error) {
    console.error('Update Salary Error:', error);
    res.status(500).json({ message: 'Server Error updating salary info' });
  }
};
