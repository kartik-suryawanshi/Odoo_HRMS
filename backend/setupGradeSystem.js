/**
 * File: backend/scripts/setupGradeSystem.js
 * Purpose: Initializes the Grade-Based Salary structure.
 */

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function setup() {
  try {
    await client.connect();
    console.log('Connected to database.');

    // 1. Create Grades Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS grades (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        template_id INTEGER, -- Link to salary_templates
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Grades table created.');

    // 2. Create Salary Components Table (The Dynamic Part)
    await client.query(`
      CREATE TABLE IF NOT EXISTS salary_components (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        computation_type VARCHAR(20) NOT NULL, -- FIXED or PERCENTAGE
        value DECIMAL(12,2) NOT NULL,
        based_on VARCHAR(50) DEFAULT 'WAGE', -- WAGE, BASIC, etc.
        is_deduction BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Salary Components table created.');

    // 3. Update Users Table to include Grade
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS grade_id INTEGER REFERENCES grades(id);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_wage DECIMAL(12,2) DEFAULT 0;
    `);

    // 4. Migrate existing Template rules to Components table
    const templates = await client.query('SELECT * FROM salary_templates');
    for (const t of templates.rows) {
      // Clear existing components for this template to prevent duplicates
      await client.query('DELETE FROM salary_components WHERE template_id = $1', [t.id]);
      
      // Basic
      await client.query(`INSERT INTO salary_components (template_id, name, computation_type, value, based_on) VALUES ($1, 'Basic Salary', 'PERCENTAGE', 50, 'WAGE')`, [t.id]);
      // HRA
      await client.query(`INSERT INTO salary_components (template_id, name, computation_type, value, based_on) VALUES ($1, 'House Rent Allowance', 'PERCENTAGE', 50, 'BASIC SALARY')`, [t.id]);
      // Performance Bonus
      await client.query(`INSERT INTO salary_components (template_id, name, computation_type, value, based_on) VALUES ($1, 'Performance Bonus', 'PERCENTAGE', 8.33, 'BASIC SALARY')`, [t.id]);
      // LTA
      await client.query(`INSERT INTO salary_components (template_id, name, computation_type, value, based_on) VALUES ($1, 'Leave Travel Allowance', 'PERCENTAGE', 8.33, 'BASIC SALARY')`, [t.id]);
      // PF
      await client.query(`INSERT INTO salary_components (template_id, name, computation_type, value, based_on, is_deduction) VALUES ($1, 'Provident Fund (PF)', 'PERCENTAGE', 12, 'BASIC SALARY', TRUE)`, [t.id]);
      // Prof Tax
      await client.query(`INSERT INTO salary_components (template_id, name, computation_type, value, based_on, is_deduction) VALUES ($1, 'Professional Tax', 'FIXED', $2, 'WAGE', TRUE)`, [t.id, t.professional_tax]);
    }
    console.log('Migration of template rules completed.');

    // 5. Create a Default Grade and link to Default Template
    const defaultTemplate = await client.query('SELECT id FROM salary_templates LIMIT 1');
    if (defaultTemplate.rows.length > 0) {
      const tid = defaultTemplate.rows[0].id;
      await client.query(`
        INSERT INTO grades (name, description, template_id) 
        VALUES ('Standard Grade', 'Default grade for all employees', $1)
        ON CONFLICT (name) DO NOTHING
      `, [tid]);
      
      const gid = await client.query("SELECT id FROM grades WHERE name = 'Standard Grade'");
      await client.query(`UPDATE users SET grade_id = $1 WHERE grade_id IS NULL`, [gid.rows[0].id]);
    }

    console.log('ERP Grade System initialized successfully.');
  } catch (err) {
    console.error('Setup Error:', err);
  } finally {
    await client.end();
  }
}

setup();
