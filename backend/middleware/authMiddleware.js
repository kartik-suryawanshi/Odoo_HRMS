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

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded; // { id, role, loginId }
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

module.exports = { protect, adminOnly };
