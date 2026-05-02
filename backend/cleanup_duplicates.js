const pool = require('./config/db');
async function cleanup() {
  try {
    console.log('Cleaning up duplicate salary components...');
    // This query deletes duplicate components keeping only the one with the lowest ID
    const query = `
      DELETE FROM salary_components a USING (
        SELECT MIN(id) as min_id, template_id, name, is_deduction
        FROM salary_components
        GROUP BY template_id, name, is_deduction
        HAVING COUNT(*) > 1
      ) b
      WHERE a.template_id = b.template_id 
        AND a.name = b.name 
        AND a.is_deduction = b.is_deduction 
        AND a.id > b.min_id
    `;
    const res = await pool.query(query);
    console.log(`Deleted ${res.rowCount} duplicate rows.`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
cleanup();
