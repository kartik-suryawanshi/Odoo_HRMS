const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/users', protect, adminOnly, getAllUsers);
router.put('/users/role', protect, adminOnly, updateUserRole);

module.exports = router;
