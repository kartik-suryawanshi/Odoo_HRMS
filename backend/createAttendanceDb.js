const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');
    
    // Create attendance_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        check_in_time TIMESTAMP NOT NULL,
        check_out_time TIMESTAMP,
        total_hours NUMERIC(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table attendance_logs created successfully.');

  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await client.end();
  }
}

run();
