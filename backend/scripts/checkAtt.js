const pool = require('../config/db');

async function checkAttendance() {
  try {
    const res = await pool.query('SELECT * FROM attendance_logs ORDER BY check_in_time DESC LIMIT 10');
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAttendance();
