const express = require('express');
const router = express.Router();
const { 
  createLeaveRequest, 
  getLeaveRequests, 
  updateLeaveStatus, 
  allocateLeave, 
  getLeaveBalances 
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');

router.post('/request', protect, createLeaveRequest);
router.get('/requests', protect, getLeaveRequests);
router.put('/status/:id', protect, updateLeaveStatus);
router.post('/allocate', protect, allocateLeave);
router.get('/balances', protect, getLeaveBalances);

module.exports = router;
