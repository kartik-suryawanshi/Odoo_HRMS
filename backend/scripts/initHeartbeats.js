/**
 * File: backend/scripts/initHeartbeats.js
 * Purpose: Initialize the attendance_heartbeats table in the database.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

const init = async () => {
  try {
    console.log('Initializing Attendance Heartbeats table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_heartbeats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        log_id INTEGER REFERENCES attendance_logs(id) ON DELETE CASCADE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('attendance_heartbeats table is ready.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to initialize heartbeats table:', err);
    process.exit(1);
  }
};

init();
