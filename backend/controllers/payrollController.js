/**
 * File: backend/controllers/payrollController.js
 * Purpose: Aggregates payroll data for the Admin Dashboard.
 */

const pool = require('../config/db');

const { calculateSalary } = require('../utils/calculationEngine');

exports.getPayrollSummary = async (req, res) => {
  try {
    const adminId = req.user.id;
    const adminProfile = await pool.query('SELECT company_id FROM user_profiles WHERE user_id = $1', [adminId]);
    if (adminProfile.rows.length === 0) return res.status(404).json({ message: 'Admin profile not found' });
    const companyId = adminProfile.rows[0].company_id;

    const query = `
      SELECT u.id as user_id, up.full_name as name, u.role, u.monthly_wage, u.grade_id, g.name as grade_name, t.name as template_name
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN grades g ON u.grade_id = g.id
      LEFT JOIN salary_templates t ON g.template_id = t.id
      WHERE up.company_id = $1 AND u.id != $2
      ORDER BY name ASC
    `;
    const result = await pool.query(query, [companyId, adminId]);
    res.json({ employees: result.rows });
  } catch (error) {
    console.error('Payroll Summary Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Generate Payrun for all employees
exports.generatePayrun = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { month, year } = req.body; // e.g., 5, 2026
    const monthYear = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    // 1. Get company employees
    const adminProfile = await pool.query('SELECT company_id FROM user_profiles WHERE user_id = $1', [adminId]);
    const companyId = adminProfile.rows[0].company_id;
    
    const empRes = await pool.query(`
      SELECT u.id FROM users u 
      JOIN user_profiles p ON u.id = p.user_id 
      WHERE p.company_id = $1 AND u.role != 'Admin' AND u.grade_id IS NOT NULL
    `, [companyId]);

    const employees = empRes.rows;
    
    // 2. Generate/Update payslips
    for (const emp of employees) {
      const breakdown = await calculateSalary(emp.id, month, year);
      
      // Upsert payslip for this month/year
      const upsertQuery = `
        INSERT INTO payslips (user_id, month_year, employer_cost, basic_wage, gross_wage, net_wage, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'Draft')
        ON CONFLICT (user_id, month_year) DO UPDATE SET
          employer_cost = EXCLUDED.employer_cost,
          basic_wage = EXCLUDED.basic_wage,
          gross_wage = EXCLUDED.gross_wage,
          net_wage = EXCLUDED.net_wage,
          status = 'Draft'
      `;
      // Note: For ON CONFLICT to work, we need a unique constraint on (user_id, month_year)
      // I'll add it in the next step or use a simpler approach for now.
      
      // Simple delete and insert for now to avoid constraint issues during hackathon
      await pool.query('DELETE FROM payslips WHERE user_id = $1 AND month_year = $2', [emp.id, monthYear]);
      await pool.query(`
        INSERT INTO payslips (user_id, month_year, employer_cost, basic_wage, gross_wage, net_wage, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'Draft')
      `, [
        emp.id, monthYear, 
        breakdown.summary.base_wage, 
        breakdown.earnings.find(e => e.name === 'Basic')?.amount || 0,
        breakdown.summary.gross,
        breakdown.summary.net_salary
      ]);
    }

    res.json({ message: `Payrun for ${monthYear} generated successfully` });
  } catch (error) {
    console.error('Generate Payrun Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get Payslips for a month
exports.getPayslips = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { month, year } = req.query;
    const monthYear = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const adminProfile = await pool.query('SELECT company_id FROM user_profiles WHERE user_id = $1', [adminId]);
    const companyId = adminProfile.rows[0].company_id;

    const query = `
      SELECT ps.*, p.full_name as employee_name
      FROM payslips ps
      JOIN user_profiles p ON ps.user_id = p.user_id
      WHERE p.company_id = $1 AND ps.month_year = $2
      ORDER BY p.full_name ASC
    `;
    const result = await pool.query(query, [companyId, monthYear]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get Payslips Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get Single Payslip Detail
exports.getPayslipDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Fetch payslip basic info
    const psQuery = `
      SELECT ps.*, p.full_name as employee_name, p.login_id, p.job_position, p.department, p.manager_id,
             m.full_name as manager_name, u.monthly_wage, u.grade_id, g.name as grade_name, t.name as structure_name
      FROM payslips ps
      JOIN user_profiles p ON ps.user_id = p.user_id
      JOIN users u ON ps.user_id = u.id
      LEFT JOIN user_profiles m ON p.manager_id = m.user_id
      LEFT JOIN grades g ON u.grade_id = g.id
      LEFT JOIN salary_templates t ON g.template_id = t.id
      WHERE ps.id = $1
    `;
    const psRes = await pool.query(psQuery, [id]);
    if (psRes.rows.length === 0) return res.status(404).json({ message: 'Payslip not found' });
    
    const payslip = psRes.rows[0];
    
    // 2. Re-run calculation engine to get the breakdown (Worked Days + Computation)
    // We parse the month/year from month_year string (e.g. "Oct 2025")
    const [monthStr, yearStr] = payslip.month_year.split(' ');
    const month = new Date(Date.parse(monthStr + " 1, 2022")).getMonth() + 1;
    const year = parseInt(yearStr);
    
    const breakdown = await calculateSalary(payslip.user_id, month, year);
    
    res.json({
      payslip,
      breakdown
    });
  } catch (error) {
    console.error('Get Payslip Detail Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Validate Payrun
exports.validatePayrun = async (req, res) => {
  try {
    const { monthYear } = req.body;
    await pool.query('UPDATE payslips SET status = \'Done\' WHERE month_year = $1', [monthYear]);
    res.json({ message: 'Payrun validated successfully' });
  } catch (error) {
    console.error('Validate Payrun Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
