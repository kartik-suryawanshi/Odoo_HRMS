const express = require('express');
const router = express.Router();
const { 
  createLeaveRequest, 
  getLeaveRequests, 
  updateLeaveStatus, 
  allocateLeave, 
  getLeaveBalances 
} = require('../controllers/leaveController');
const { protect, hrAndAdmin, noPayroll } = require('../middleware/authMiddleware');

router.post('/request', protect, noPayroll, createLeaveRequest);
router.get('/requests', protect, noPayroll, getLeaveRequests);
router.put('/status/:id', protect, hrAndAdmin, updateLeaveStatus);
router.post('/allocate', protect, hrAndAdmin, allocateLeave);
router.get('/balances', protect, noPayroll, getLeaveBalances);

module.exports = router;
