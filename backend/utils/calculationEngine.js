/**
 * File: backend/utils/calculationEngine.js
 * Purpose: Core logic for computing grade-based salaries.
 */

const pool = require('../config/db');

/**
 * Calculates the complete salary breakdown for an employee.
 * @param {number} userId - The ID of the employee.
 * @returns {Object} - Calculated breakdown and net salary.
 */
exports.calculateSalary = async (userId) => {
  try {
    // 1. Fetch employee wage and assigned grade/template
    const userQuery = `
      SELECT u.monthly_wage, g.template_id, g.name as grade_name
      FROM users u
      LEFT JOIN grades g ON u.grade_id = g.id
      WHERE u.id = $1
    `;
    const userRes = await pool.query(userQuery, [userId]);
    if (userRes.rows.length === 0 || !userRes.rows[0].template_id) {
      throw new Error('Employee or assigned Grade/Template not found');
    }

    const { monthly_wage, template_id, grade_name } = userRes.rows[0];
    const wage = parseFloat(monthly_wage) || 0;

    // 2. Fetch all components for the template
    const compQuery = `
      SELECT * FROM salary_components 
      WHERE template_id = $1 
      ORDER BY (CASE WHEN based_on = 'WAGE' THEN 1 ELSE 2 END) ASC, id ASC
    `;
    const compRes = await pool.query(compQuery, [template_id]);
    const components = compRes.rows;

    const breakdown = {
      earnings: [],
      deductions: [],
      summary: {
        gross: 0,
        total_deductions: 0,
        net_salary: 0,
        grade: grade_name,
        total_wage: wage
      }
    };

    let calculatedValues = { WAGE: wage };

    // 3. Compute Earnings First (Handling dependencies)
    // We filter out 'Basic' first to ensure it's available for HRA/PF
    const earnings = components.filter(c => !c.is_deduction);
    const deductions = components.filter(c => c.is_deduction);

    // Compute Earnings
    for (const comp of earnings) {
      let amount = 0;
      const baseValue = calculatedValues[(comp.based_on || '').trim().toUpperCase()] || 0;

      if (comp.computation_type === 'PERCENTAGE') {
        amount = baseValue * (parseFloat(comp.value) / 100);
      } else {
        amount = parseFloat(comp.value);
      }

      breakdown.earnings.push({
        name: comp.name,
        amount: amount,
        rule: `${comp.value}${comp.computation_type === 'PERCENTAGE' ? '%' : ' Fixed'} of ${comp.based_on}`
      });

      calculatedValues[comp.name.trim().toUpperCase()] = amount;
      breakdown.summary.gross += amount;
    }

    // 4. Calculate Balancing Component (Fixed Allowance)
    // Formula: Fixed Allowance = Wage - Total of all other components
    const totalOtherEarnings = breakdown.summary.gross;
    const fixedAllowance = wage - totalOtherEarnings;
    
    // We always add the Fixed Allowance component to balance to the target wage,
    // even if it's small or zero. If it's negative, it indicates components exceed the wage.
    breakdown.earnings.push({
      name: 'Fixed Allowance',
      amount: Math.max(0, fixedAllowance),
      rule: 'Balancing Component'
    });
    
    if (fixedAllowance > 0) {
      breakdown.summary.gross += fixedAllowance;
    }

    // 5. Compute Deductions
    for (const comp of deductions) {
      let amount = 0;
      const baseValue = calculatedValues[(comp.based_on || '').trim().toUpperCase()] || 0;

      if (comp.computation_type === 'PERCENTAGE') {
        amount = baseValue * (parseFloat(comp.value) / 100);
      } else {
        amount = parseFloat(comp.value);
      }

      breakdown.deductions.push({
        name: comp.name,
        amount: amount,
        rule: `${comp.value}${comp.computation_type === 'PERCENTAGE' ? '%' : ' Fixed'} of ${comp.based_on}`
      });

      breakdown.summary.total_deductions += amount;
    }

    // 6. Final Summary
    breakdown.summary.net_salary = breakdown.summary.gross - breakdown.summary.total_deductions;

    return breakdown;
  } catch (error) {
    console.error('Calculation Engine Error:', error);
    throw error;
  }
};
