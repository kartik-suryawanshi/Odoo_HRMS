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
      ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS job_position VARCHAR(255),
      ADD COLUMN IF NOT EXISTS date_of_joining DATE;
    `);

    console.log('Manager, Job Position, and Date of Joining columns added successfully.');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    await client.end();
  }
}

run();
