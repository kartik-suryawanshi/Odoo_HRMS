/**
 * File: backend/controllers/salaryTemplateController.js
 * Purpose: CRUD for Salary Templates.
 */

const pool = require('../config/db');

// Get all templates
exports.getAllTemplates = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM salary_templates ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get Templates Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Create a new template
exports.createTemplate = async (req, res) => {
  try {
    const { name, basic_percent, hra_percent, performance_bonus_percent, lta_percent, pf_percent, standard_allowance, professional_tax } = req.body;
    
    const query = `
      INSERT INTO salary_templates (name, basic_percent, hra_percent, performance_bonus_percent, lta_percent, pf_percent, standard_allowance, professional_tax)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await pool.query(query, [name, basic_percent, hra_percent, performance_bonus_percent, lta_percent, pf_percent, standard_allowance, professional_tax]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create Template Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update a template
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, basic_percent, hra_percent, performance_bonus_percent, lta_percent, pf_percent, standard_allowance, professional_tax } = req.body;
    
    const query = `
      UPDATE salary_templates 
      SET name = $1, basic_percent = $2, hra_percent = $3, performance_bonus_percent = $4, 
          lta_percent = $5, pf_percent = $6, standard_allowance = $7, professional_tax = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `;
    
    const result = await pool.query(query, [name, basic_percent, hra_percent, performance_bonus_percent, lta_percent, pf_percent, standard_allowance, professional_tax, id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update Template Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
