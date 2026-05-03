const pool = require('./backend/config/db');

async function debug() {
  try {
    console.log('--- USER DATA ---');
    const users = await pool.query('SELECT id, name, role FROM users');
    console.table(users.rows);

    console.log('\n--- PROFILE DATA ---');
    const profiles = await pool.query('SELECT user_id, full_name, company_id FROM user_profiles');
    console.table(profiles.rows);

    console.log('\n--- COMPANY DATA ---');
    const companies = await pool.query('SELECT id, name FROM companies');
    console.table(companies.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

debug();
