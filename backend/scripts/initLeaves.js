const pool = require('../config/db');

const initLeaves = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          leave_type VARCHAR(50) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          reason TEXT,
          status VARCHAR(20) DEFAULT 'Pending',
          attachment_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('leave_requests table created');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS leave_allocations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          leave_type VARCHAR(50) NOT NULL,
          total_days DECIMAL(5,2) NOT NULL,
          year INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, leave_type, year)
      );
    `);
    console.log('leave_allocations table created');

    process.exit(0);
  } catch (err) {
    console.error('Error initializing leaves tables:', err);
    process.exit(1);
  }
};

initLeaves();
