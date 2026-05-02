/**
 * File: backend/utils/calculationEngine.js
 * Purpose: Core logic for computing grade-based salaries.
 */

const pool = require('../config/db');

/**
 * Calculates the complete salary breakdown for an employee.
 * @param {number} userId - The ID of the employee.
 * @param {number} month - Optional month (1-12)
 * @param {number} year - Optional year
 * @returns {Object} - Calculated breakdown and net salary.
 */
exports.calculateSalary = async (userId, month, year) => {
  try {
    const targetMonth = month || (new Date().getMonth() + 1);
    const targetYear = year || new Date().getFullYear();

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
    const baseWage = parseFloat(monthly_wage) || 0;

    // 2. Fetch Attendance and Determine Proration
    const today = new Date();
    const isCurrentMonth = today.getMonth() + 1 === targetMonth && today.getFullYear() === targetYear;
    const isFutureMonth = (targetYear > today.getFullYear()) || (targetYear === today.getFullYear() && targetMonth > today.getMonth() + 1);

    const attendanceQuery = `
      SELECT COUNT(DISTINCT DATE(check_in_time)) as present_days
      FROM attendance_logs
      WHERE user_id = $1 AND EXTRACT(MONTH FROM check_in_time) = $2 AND EXTRACT(YEAR FROM check_in_time) = $3
    `;
    const attRes = await pool.query(attendanceQuery, [userId, targetMonth, targetYear]);
    const presentDays = parseInt(attRes.rows[0].present_days, 10);

    // Fetch approved leaves for the month
    const leavesQuery = `
      SELECT start_date, end_date, leave_type
      FROM leave_requests
      WHERE user_id = $1 AND status = 'Approved' 
      AND (
        (EXTRACT(MONTH FROM start_date) = $2 AND EXTRACT(YEAR FROM start_date) = $3) OR
        (EXTRACT(MONTH FROM end_date) = $2 AND EXTRACT(YEAR FROM end_date) = $3)
      )
    `;
    const leavesRes = await pool.query(leavesQuery, [userId, targetMonth, targetYear]);
    
    // Create a set of "Paid Leave Dates"
    const paidLeaveDates = new Set();
    leavesRes.rows.forEach(l => {
      if (l.leave_type === 'Unpaid Leave') return; // Skip unpaid
      let curr = new Date(l.start_date);
      const end = new Date(l.end_date);
      while (curr <= end) {
        if (curr.getMonth() + 1 === targetMonth && curr.getFullYear() === targetYear) {
          const day = curr.getDay();
          if (day !== 0 && day !== 6) { // Only count working days as leaves
            paidLeaveDates.add(curr.toDateString());
          }
        }
        curr.setDate(curr.getDate() + 1);
      }
    });

    const approvedPaidLeaveDays = paidLeaveDates.size;

    // Calculate working days
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    let totalWorkingDays = 0;
    let workingDaysToDate = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(targetYear, targetMonth - 1, d);
      const isWorking = date.getDay() !== 0 && date.getDay() !== 6;
      if (isWorking) {
        totalWorkingDays++;
        // If it's the current month, only count working days that have already occurred
        if (isCurrentMonth && d <= today.getDate()) {
          workingDaysToDate++;
        }
      }
    }

    let payableDays = presentDays + approvedPaidLeaveDays;
    if (isFutureMonth) {
      payableDays = totalWorkingDays; // Assume full pay for future
    } else if (isCurrentMonth) {
      // Absences = (Working days passed so far) - (Actual days present + Approved Paid Leaves)
      const absencesSoFar = Math.max(0, workingDaysToDate - (presentDays + approvedPaidLeaveDays));
      payableDays = totalWorkingDays - absencesSoFar;
    }

    // Proration Ratio
    const prorationRatio = totalWorkingDays > 0 ? (payableDays / totalWorkingDays) : 1;
    const actualWage = baseWage * prorationRatio;

    // 3. Fetch all components for the template
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
        base_wage: baseWage,
        actual_wage: actualWage,
        payable_days: payableDays,
        total_working_days: totalWorkingDays,
        gross: 0,
        total_deductions: 0,
        net_salary: 0,
        grade: grade_name
      }
    };

    let calculatedValues = { WAGE: actualWage };

    // 4. Compute Earnings
    const earnings = components.filter(c => !c.is_deduction);
    const deductions = components.filter(c => c.is_deduction);

    for (const comp of earnings) {
      let amount = 0;
      const baseValue = calculatedValues[(comp.based_on || '').trim().toUpperCase()] || 0;

      if (comp.computation_type === 'PERCENTAGE') {
        amount = baseValue * (parseFloat(comp.value) / 100);
      } else {
        // Even fixed components should ideally be prorated if based on attendance
        amount = parseFloat(comp.value) * prorationRatio;
      }

      breakdown.earnings.push({
        name: comp.name,
        amount: amount,
        rule: `${comp.value}${comp.computation_type === 'PERCENTAGE' ? '%' : ' Fixed'} of ${comp.based_on} (Prorated)`
      });

      calculatedValues[comp.name.trim().toUpperCase()] = amount;
      breakdown.summary.gross += amount;
    }

    // 5. Calculate Balancing Component (Fixed Allowance)
    const totalOtherEarnings = breakdown.summary.gross;
    const fixedAllowance = actualWage - totalOtherEarnings;
    
    if (fixedAllowance > 0) {
      breakdown.earnings.push({
        name: 'Fixed Allowance',
        amount: fixedAllowance,
        rule: 'Balancing Component'
      });
      breakdown.summary.gross += fixedAllowance;
    }

    // 6. Compute Deductions
    for (const comp of deductions) {
      let amount = 0;
      const baseValue = calculatedValues[(comp.based_on || '').trim().toUpperCase()] || 0;

      if (comp.computation_type === 'PERCENTAGE') {
        amount = baseValue * (parseFloat(comp.value) / 100);
      } else {
        amount = parseFloat(comp.value); // Deductions might stay fixed or also prorate
      }

      breakdown.deductions.push({
        name: comp.name,
        amount: amount,
        rule: `${comp.value}${comp.computation_type === 'PERCENTAGE' ? '%' : ' Fixed'} of ${comp.based_on}`
      });

      breakdown.summary.total_deductions += amount;
    }

    // 7. Final Summary
    breakdown.summary.net_salary = breakdown.summary.gross - breakdown.summary.total_deductions;

    return breakdown;
  } catch (error) {
    console.error('Calculation Engine Error:', error);
    throw error;
  }
};
