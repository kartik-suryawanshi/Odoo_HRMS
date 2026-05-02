const pool = require('./config/db');
async function check() {
  try {
    const res = await pool.query('SELECT * FROM salary_components WHERE template_id = 1');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
check();
