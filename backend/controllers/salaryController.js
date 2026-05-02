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

    const query = `
      SELECT s.*, t.name as template_name, t.basic_percent, t.hra_percent, 
             t.performance_bonus_percent, t.lta_percent, t.pf_percent, 
             t.standard_allowance, t.professional_tax
      FROM salary_info s
      LEFT JOIN salary_templates t ON s.template_id = t.id
      WHERE s.user_id = $1
    `;
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      // Fetch default template for initial empty state
      const defaultTemplate = await pool.query('SELECT * FROM salary_templates LIMIT 1');
      const temp = defaultTemplate.rows[0] || {};
      
      return res.json({
        user_id: userId,
        monthly_wage: 0,
        working_days_per_week: 5,
        break_time_hrs: 1,
        template_id: temp.id || null,
        template_name: temp.name || 'No Template',
        basic_percent: temp.basic_percent || 50,
        hra_percent: temp.hra_percent || 50,
        performance_bonus_percent: temp.performance_bonus_percent || 8.33,
        lta_percent: temp.lta_percent || 8.33,
        pf_percent: temp.pf_percent || 12,
        standard_allowance: temp.standard_allowance || 4167,
        professional_tax: temp.professional_tax || 200
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
      monthly_wage, working_days_per_week, break_time_hrs, template_id
    } = req.body;

    if (req.user.role !== 'Admin' && req.user.role !== 'Payroll Officer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = `
      INSERT INTO salary_info (
        user_id, monthly_wage, working_days_per_week, break_time_hrs, template_id
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE SET
        monthly_wage = EXCLUDED.monthly_wage,
        working_days_per_week = EXCLUDED.working_days_per_week,
        break_time_hrs = EXCLUDED.break_time_hrs,
        template_id = EXCLUDED.template_id,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId, monthly_wage, working_days_per_week, break_time_hrs, template_id
    ]);

    res.json({ message: 'Salary info updated successfully', salary: result.rows[0] });
  } catch (error) {
    console.error('Update Salary Error:', error);
    res.status(500).json({ message: 'Server Error updating salary info' });
  }
};
