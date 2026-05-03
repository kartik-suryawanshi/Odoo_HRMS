/**
 * File: backend/routes/salaryRoutes.js
 * Purpose: Routes for Salary configuration, templates, and payroll summary.
 */

const express = require('express');
const router = express.Router();
const { getSalaryInfo, updateSalaryInfo, getPayrollStats, getSalaryStatement } = require('../controllers/salaryController');
const { getAllTemplates, createTemplate, updateTemplate } = require('../controllers/salaryTemplateController');
const { getPayrollSummary, generatePayrun, getPayslips, validatePayrun, getPayslipDetail } = require('../controllers/payrollController');
const { getGrades, createGrade, updateGrade } = require('../controllers/gradeController');
const { protect, payrollAccess, payrollOnly, adminOnly, hrAndAdmin } = require('../middleware/authMiddleware');

// User Specific Salary
router.get('/stats', protect, payrollAccess, getPayrollStats); // Must be above :userId to avoid conflict
router.get('/statement/:userId', protect, getSalaryStatement);
router.get('/:userId', protect, getSalaryInfo);
router.put('/:userId', protect, payrollAccess, updateSalaryInfo);

// Payrun & Payslips
router.post('/generate-payrun', protect, payrollAccess, generatePayrun);
router.get('/admin/payslips', protect, payrollAccess, getPayslips);
router.get('/payslip/:id', protect, getPayslipDetail); // Anyone can view their own (logic in controller)
router.post('/validate-payrun', protect, payrollAccess, validatePayrun);

// Salary Templates (Payroll Only)
router.get('/templates/all', protect, payrollAccess, getAllTemplates);
router.post('/templates', protect, payrollAccess, createTemplate);
router.put('/templates/:id', protect, payrollAccess, updateTemplate);

// Grades (Admin Only)
router.get('/grades/all', protect, adminOnly, getGrades);
router.post('/grades', protect, adminOnly, createGrade);
router.put('/grades/:id', protect, adminOnly, updateGrade);

// Payroll Summary (Admin/Payroll Only)
router.get('/admin/summary', protect, payrollAccess, getPayrollSummary);

module.exports = router;
