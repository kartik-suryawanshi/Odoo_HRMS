/**
 * File: backend/routes/salaryRoutes.js
 * Purpose: Routes for Salary configuration, templates, and payroll summary.
 */

const express = require('express');
const router = express.Router();
const { getSalaryInfo, updateSalaryInfo } = require('../controllers/salaryController');
const { getAllTemplates, createTemplate, updateTemplate } = require('../controllers/salaryTemplateController');
const { getPayrollSummary } = require('../controllers/payrollController');
const { protect } = require('../middleware/authMiddleware');

// User Specific Salary
router.get('/:userId', protect, getSalaryInfo);
router.put('/:userId', protect, updateSalaryInfo);

// Salary Templates (Admin/Payroll Only)
router.get('/templates/all', protect, getAllTemplates);
router.post('/templates', protect, createTemplate);
router.put('/templates/:id', protect, updateTemplate);

// Payroll Summary (Admin/Payroll Only)
router.get('/admin/summary', protect, getPayrollSummary);

module.exports = router;
