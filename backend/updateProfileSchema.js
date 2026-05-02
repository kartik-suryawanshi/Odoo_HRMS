const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');
    
    // Add new columns to user_profiles if they don't exist
    await client.query(`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS department VARCHAR(255),
      ADD COLUMN IF NOT EXISTS location VARCHAR(255),
      ADD COLUMN IF NOT EXISTS about_me TEXT,
      ADD COLUMN IF NOT EXISTS job_love_description TEXT,
      ADD COLUMN IF NOT EXISTS interests_hobbies TEXT,
      ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]';
    `);
    
    console.log('Profile schema updated successfully with flexible columns.');

  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    await client.end();
  }
}

run();
