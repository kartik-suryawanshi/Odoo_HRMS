/**
 * File: backend/controllers/gradeController.js
 * Purpose: Management of Salary Grades (L1, L2, etc.).
 */

const pool = require('../config/db');

exports.getGrades = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*, t.name as template_name 
      FROM grades g 
      LEFT JOIN salary_templates t ON g.template_id = t.id 
      ORDER BY g.id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createGrade = async (req, res) => {
  try {
    const { name, description, template_id } = req.body;
    const result = await pool.query(
      'INSERT INTO grades (name, description, template_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, template_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, template_id } = req.body;
    const result = await pool.query(
      'UPDATE grades SET name = $1, description = $2, template_id = $3 WHERE id = $4 RETURNING *',
      [name, description, template_id, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
