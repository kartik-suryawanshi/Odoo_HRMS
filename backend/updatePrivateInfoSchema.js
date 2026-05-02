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
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS dob DATE,
      ADD COLUMN IF NOT EXISTS residing_address TEXT,
      ADD COLUMN IF NOT EXISTS nationality VARCHAR(255),
      ADD COLUMN IF NOT EXISTS personal_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
      ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS account_number VARCHAR(255),
      ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(255),
      ADD COLUMN IF NOT EXISTS pan_no VARCHAR(255),
      ADD COLUMN IF NOT EXISTS uan_no VARCHAR(255);
    `);

    console.log('Private info and Bank details columns added successfully.');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    await client.end();
  }
}

run();
