const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');
    
    // Add column
    await client.query('ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE;');
    console.log('Column must_change_password added successfully to users table.');
    
    // We update existing users to false just in case
    await client.query('UPDATE users SET must_change_password = FALSE;');
    console.log('Existing users updated to false.');

  } catch (err) {
    console.error('Error altering table:', err);
  } finally {
    await client.end();
  }
}

run();
