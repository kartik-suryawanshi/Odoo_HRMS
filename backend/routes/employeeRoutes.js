const express = require('express');
const router = express.Router();
const { getEmployees, addEmployee } = require('../controllers/employeeController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, adminOnly, getEmployees)
  .post(protect, adminOnly, addEmployee);

module.exports = router;
