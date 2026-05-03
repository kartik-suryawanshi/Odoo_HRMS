const pool = require('../config/db');
async function check() {
  const res = await pool.query('SELECT id, name FROM companies');
  console.log(JSON.stringify(res.rows));
  process.exit(0);
}
check();
