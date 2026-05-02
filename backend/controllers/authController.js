/**
 * File: backend/controllers/authController.js
 * Purpose: Contains the business logic for user registration and login.
 * What it does: Handles new user registration via SQL transactions (inserting into 
 *               companies, users, and user_profiles tables), logo upload, and custom 
 *               Login ID generation. Also handles user login (password verification).
 * Data Fetching: Receives user details and file buffer from authRoutes. Queries DB.
 * Data Sending: Sends SQL insert/select queries via Transactions. Uploads images.
 *               Returns JSON responses (success/error, JWT tokens).
 * External Dependencies: bcrypt, jsonwebtoken, stream.
 * Environment Variables Required: JWT_SECRET.
 * Related Files: backend/routes/authRoutes.js, backend/config/db.js, backend/database.sql
 */

const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const stream = require('stream');

// Helper to upload buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'empay_logos' },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    const readStream = new stream.PassThrough();
    readStream.end(buffer);
    readStream.pipe(uploadStream);
  });
};

// Generate Login ID logic
const generateLoginId = async (companyName, fullName, yearOfJoining, client) => {
  const companyPrefix = companyName ? companyName.substring(0, 2).toUpperCase() : 'XX';
  const nameParts = fullName.trim().split(' ');
  const firstNamePrefix = nameParts[0] ? nameParts[0].substring(0, 2).toUpperCase() : 'XX';
  const lastNamePrefix = nameParts.length > 1 ? nameParts[nameParts.length - 1].substring(0, 2).toUpperCase() : 'XX';
  
  const result = await client.query('SELECT COUNT(*) FROM user_profiles WHERE year_of_joining = $1', [yearOfJoining]);
  const count = parseInt(result.rows[0].count, 10);
  const serialNumber = count + 1;
  const serialString = serialNumber.toString().padStart(4, '0');

  const loginId = `${companyPrefix}${firstNamePrefix}${lastNamePrefix}${yearOfJoining}${serialString}`;
  return { loginId, serialNumber };
};

exports.register = async (req, res) => {
  const client = await pool.connect();
  try {
    const { companyName, name, email, phone, password } = req.body;
    const logoFile = req.file;

    // Check if user exists
    const userExist = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Upload Logo to Cloudinary if provided
    let logoUrl = null;
    if (logoFile) {
      const uploadResult = await uploadToCloudinary(logoFile.buffer);
      logoUrl = uploadResult.secure_url;
    }

    await client.query('BEGIN'); // Start Transaction

    // 1. Insert Company
    let companyId = null;
    if (companyName) {
      const compResult = await client.query(
        'INSERT INTO companies (name, logo_url) VALUES ($1, $2) RETURNING id',
        [companyName, logoUrl]
      );
      companyId = compResult.rows[0].id;
    }

    // 2. Hash Password and Insert User
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, role',
      [email, passwordHash, 'Admin']
    );
    const userId = userResult.rows[0].id;
    const role = userResult.rows[0].role;

    // 3. Generate Login ID and Insert Profile
    const yearOfJoining = new Date().getFullYear();
    const { loginId, serialNumber } = await generateLoginId(companyName, name, yearOfJoining, client);

    await client.query(
      'INSERT INTO user_profiles (user_id, company_id, login_id, full_name, phone, year_of_joining, serial_number) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, companyId, loginId, name, phone, yearOfJoining, serialNumber]
    );

    await client.query('COMMIT'); // End Transaction

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: userId,
        login_id: loginId,
        role: role,
        logo_url: logoUrl
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server Error during registration' });
  } finally {
    client.release();
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; 

    // Find user using join
    const query = `
      SELECT u.id, u.email, u.password_hash, u.role, p.login_id, p.full_name, c.logo_url 
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN companies c ON p.company_id = c.id
      WHERE u.email = $1 OR p.login_id = $1
    `;
    const userResult = await pool.query(query, [identifier]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, loginId: user.login_id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        loginId: user.login_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        logoUrl: user.logo_url
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server Error during login' });
  }
};
