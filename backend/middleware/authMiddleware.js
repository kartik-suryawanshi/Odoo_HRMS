/**
 * File: backend/middleware/authMiddleware.js
 * Purpose: Middleware for verifying JSON Web Tokens.
 * What it does: Extracts and verifies JWT from the Authorization header.
 * Data Fetching: N/A.
 * Data Sending: Returns 401 Unauthorized if invalid.
 * External Dependencies: jsonwebtoken.
 * Environment Variables Required: JWT_SECRET.
 * Related Files: backend/routes/authRoutes.js
 */

const jwt = require('jsonwebtoken');

const pool = require('../config/db');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Fetch latest user data from DB to ensure roles are immediate
    const userRes = await pool.query('SELECT id, role, email FROM users WHERE id = $1', [decoded.id]);
    if (userRes.rows.length === 0) {
       return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = userRes.rows[0]; 
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Strict role checks
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') next();
  else res.status(403).json({ message: 'Admin access required' });
};

const hrOnly = (req, res, next) => {
  if (req.user && req.user.role === 'HR Officer') next();
  else res.status(403).json({ message: 'HR Officer access required' });
};

const payrollOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Payroll Officer') next();
  else res.status(403).json({ message: 'Payroll Officer access required' });
};

// Access for HR tasks (Profile, Attendance, Leave)
const hrAndAdmin = (req, res, next) => {
  const allowed = ['Admin', 'HR Officer'];
  if (req.user && allowed.includes(req.user.role)) next();
  else res.status(403).json({ message: 'HR or Admin access required' });
};

// Access for Payroll tasks
const payrollAccess = (req, res, next) => {
  const allowed = ['Admin', 'Payroll Officer'];
  if (req.user && allowed.includes(req.user.role)) next();
  else res.status(403).json({ message: 'Payroll or Admin access required' });
};

// Management access excluding Employee
const managementOnly = (req, res, next) => {
  const allowed = ['Admin', 'HR Officer', 'Payroll Officer'];
  if (req.user && allowed.includes(req.user.role)) next();
  else res.status(403).json({ message: 'Management access required' });
};

// Check if user is NOT a Payroll Officer (for Attendance/Leave)
const noPayroll = (req, res, next) => {
  if (req.user && req.user.role !== 'Payroll Officer') next();
  else res.status(403).json({ message: 'Payroll Officers cannot access this feature' });
};

module.exports = { protect, adminOnly, hrOnly, payrollOnly, hrAndAdmin, payrollAccess, managementOnly, noPayroll };
