/**
 * File: backend/config/db.js
 * Purpose: Manages the connection to the PostgreSQL database.
 * What it does: Creates a connection pool using the 'pg' library to allow 
 *               the backend to interact with the database efficiently.
 * Data Fetching: Fetches database credentials from environment variables (.env).
 * Data Sending: Exports the connected pool object to be used by controllers.
 * External Dependencies: pg (PostgreSQL client for Node.js).
 * Environment Variables Required: DATABASE_URL.
 * Related Files: backend/controllers/authController.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Immediately test the connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to PostgreSQL Database:', err.message);
  } else {
    console.log('Connected to PostgreSQL Database successfully!');
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
