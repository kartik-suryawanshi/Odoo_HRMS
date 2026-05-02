const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS salary_info (
        user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        monthly_wage DECIMAL(12, 2) DEFAULT 0,
        working_days_per_week INT DEFAULT 5,
        break_time_hrs DECIMAL(4, 2) DEFAULT 1,
        basic_percent DECIMAL(5, 2) DEFAULT 50,
        hra_percent DECIMAL(5, 2) DEFAULT 50,
        standard_allowance DECIMAL(12, 2) DEFAULT 0,
        performance_bonus_percent DECIMAL(5, 2) DEFAULT 0,
        lta_percent DECIMAL(5, 2) DEFAULT 0,
        pf_percent DECIMAL(5, 2) DEFAULT 12,
        professional_tax DECIMAL(12, 2) DEFAULT 200,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('salary_info table created successfully.');
  } catch (err) {
    console.error('Error creating salary table:', err);
  } finally {
    await client.end();
  }
}

run();
