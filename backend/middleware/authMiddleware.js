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

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an Admin' });
  }
};

const managementOnly = (req, res, next) => {
  const allowed = ['Admin', 'HR Officer', 'Payroll Officer'];
  if (req.user && allowed.includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Management access required' });
  }
};

const payrollAccess = (req, res, next) => {
  const allowed = ['Admin', 'Payroll Officer'];
  if (req.user && allowed.includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Payroll access required' });
  }
};

module.exports = { protect, adminOnly, managementOnly, payrollAccess };
