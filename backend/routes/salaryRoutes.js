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
const { protect, payrollAccess } = require('../middleware/authMiddleware');

// User Specific Salary
router.get('/stats', protect, payrollAccess, getPayrollStats); // Must be above :userId to avoid conflict
router.get('/statement/:userId', protect, getSalaryStatement);
router.get('/:userId', protect, getSalaryInfo);
router.put('/:userId', protect, payrollAccess, updateSalaryInfo);

// Payrun & Payslips
router.post('/generate-payrun', protect, payrollAccess, generatePayrun);
router.get('/admin/payslips', protect, payrollAccess, getPayslips);
router.get('/payslip/:id', protect, payrollAccess, getPayslipDetail);
router.post('/validate-payrun', protect, payrollAccess, validatePayrun);

// Salary Templates (Admin/Payroll Only)
router.get('/templates/all', protect, getAllTemplates);
router.post('/templates', protect, createTemplate);
router.put('/templates/:id', protect, updateTemplate);

// Grades (Admin Only)
router.get('/grades/all', protect, getGrades);
router.post('/grades', protect, createGrade);
router.put('/grades/:id', protect, updateGrade);

// Payroll Summary (Admin/Payroll Only)
router.get('/admin/summary', protect, getPayrollSummary);

module.exports = router;
