/**
 * File: backend/server.js
 * Purpose: Entry point for the Node.js Express backend application.
 * What it does: Initializes Express server, connects to PostgreSQL database, 
 *               sets up global middleware (CORS, JSON body parsing), and 
 *               registers the main API route handlers.
 * Data Fetching: Receives incoming HTTP requests from the frontend client.
 * Data Sending: Sends HTTP responses back to the frontend client.
 * External Dependencies: express, cors, dotenv.
 * Environment Variables Required: PORT.
 * Related Files: backend/config/db.js, backend/routes/authRoutes.js
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);

// Base route for health check
app.get('/', (req, res) => {
  res.send('EmPay HRMS API is running...');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
