/**
 * File: backend/scripts/createSalaryTemplates.js
 * Purpose: Sets up the template-driven salary structure.
 */

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function setupTemplates() {
  try {
    await client.connect();
    console.log('Connected to database.');

    // 1. Drop and Recreate salary_templates table for a fresh start
    await client.query('DROP TABLE IF EXISTS salary_templates CASCADE;');
    
    await client.query(`
      CREATE TABLE salary_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        basic_percent DECIMAL(5,2) DEFAULT 50.00,
        hra_percent DECIMAL(5,2) DEFAULT 50.00,
        performance_bonus_percent DECIMAL(5,2) DEFAULT 8.33,
        lta_percent DECIMAL(5,2) DEFAULT 8.33,
        pf_percent DECIMAL(5,2) DEFAULT 12.00,
        standard_allowance DECIMAL(10,2) DEFAULT 4167.00,
        professional_tax DECIMAL(10,2) DEFAULT 200.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('salary_templates table created.');

    // 2. Insert a Default Template
    await client.query(`
      INSERT INTO salary_templates (name, basic_percent, hra_percent, performance_bonus_percent, lta_percent, pf_percent, standard_allowance, professional_tax)
      VALUES ('Standard Employee', 50.00, 50.00, 8.33, 8.33, 12.00, 4167.00, 200.00)
      ON CONFLICT (name) DO NOTHING;
    `);

    // 3. Update salary_info to link to templates
    // First, check if template_id column exists
    const checkCol = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='salary_info' AND column_name='template_id';
    `);

    if (checkCol.rows.length === 0) {
      await client.query(`
        ALTER TABLE salary_info 
        ADD COLUMN template_id INTEGER REFERENCES salary_templates(id);
      `);
      
      // Set existing records to the default template
      await client.query(`
        UPDATE salary_info SET template_id = (SELECT id FROM salary_templates LIMIT 1)
        WHERE template_id IS NULL;
      `);
      console.log('salary_info table updated with template_id.');
    }

    console.log('Salary Template system initialized successfully.');
  } catch (err) {
    console.error('Error setting up templates:', err);
  } finally {
    await client.end();
  }
}

setupTemplates();
