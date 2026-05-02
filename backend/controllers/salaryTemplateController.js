/**
 * File: backend/controllers/salaryTemplateController.js
 * Purpose: Manage templates and their dynamic components.
 */

const pool = require('../config/db');

exports.getAllTemplates = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM salary_templates ORDER BY id ASC');
    // Fetch components for each template
    const templates = await Promise.all(result.rows.map(async (t) => {
      const components = await pool.query('SELECT * FROM salary_components WHERE template_id = $1', [t.id]);
      return { ...t, components: components.rows };
    }));
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const { name, components } = req.body;
    const tResult = await pool.query('INSERT INTO salary_templates (name) VALUES ($1) RETURNING *', [name]);
    const templateId = tResult.rows[0].id;

    if (components && components.length > 0) {
      for (const comp of components) {
        await pool.query(
          'INSERT INTO salary_components (template_id, name, computation_type, value, based_on, is_deduction) VALUES ($1, $2, $3, $4, $5, $6)',
          [templateId, comp.name, comp.computation_type, comp.value, comp.based_on, comp.is_deduction || false]
        );
      }
    }
    res.status(201).json(tResult.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, components } = req.body;
    
    await pool.query('UPDATE salary_templates SET name = $1 WHERE id = $2', [name, id]);
    
    // Simple approach: Delete and recreate components
    await pool.query('DELETE FROM salary_components WHERE template_id = $1', [id]);
    if (components && components.length > 0) {
      for (const comp of components) {
        await pool.query(
          'INSERT INTO salary_components (template_id, name, computation_type, value, based_on, is_deduction) VALUES ($1, $2, $3, $4, $5, $6)',
          [id, comp.name, comp.computation_type, comp.value, comp.based_on, comp.is_deduction || false]
        );
      }
    }
    res.json({ message: 'Template updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
