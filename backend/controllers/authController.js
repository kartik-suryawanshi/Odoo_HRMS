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
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const SMTPClient = require('../utils/smtpClient');

const UPLOAD_DIR = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

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
    const { companyName, name, email, phone, password, logoBase64, logoMimeType, logoFileName } = req.body;

    // Check if user exists
    const userExist = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    let logoUrl = null;
    if (logoBase64 && logoMimeType && logoFileName) {
      // --- Validate mime type ---
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(logoMimeType)) {
        return res.status(400).json({ message: 'Only JPEG, PNG, WEBP allowed for logo' });
      }

      // --- Validate base64 string ---
      const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
      if (!base64Pattern.test(logoBase64)) {
        return res.status(400).json({ message: 'Invalid base64 data for logo' });
      }

      // --- Validate file size (2MB max) ---
      const sizeInBytes = (logoBase64.length * 3) / 4;
      if (sizeInBytes > 2 * 1024 * 1024) {
        return res.status(400).json({ message: 'Logo file too large. Max 2MB.' });
      }

      // --- Get file extension from mimeType ---
      const extMap = {
        'image/jpeg': '.jpg',
        'image/png':  '.png',
        'image/webp': '.webp'
      };
      const ext = extMap[logoMimeType];

      // --- Generate unique filename ---
      const filename = `${uuidv4()}${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);

      // --- Decode base64 and write to disk ---
      try {
        const buffer = Buffer.from(logoBase64, 'base64');
        fs.writeFileSync(filepath, buffer);
        logoUrl = `/uploads/avatars/${filename}`;
      } catch (err) {
        return res.status(500).json({ message: 'Failed to save logo file' });
      }
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
      'INSERT INTO users (email, password_hash, role, must_change_password) VALUES ($1, $2, $3, $4) RETURNING id, role',
      [email, passwordHash, 'Admin', false]
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

    // Send Welcome Email
    const smtp = new SMTPClient(
      process.env.SMTP_HOST || 'smtp.gmail.com',
      process.env.SMTP_PORT || 587,
      process.env.SMTP_EMAIL,
      process.env.SMTP_APP_PASSWORD
    );

    if (process.env.SMTP_EMAIL && process.env.SMTP_APP_PASSWORD && process.env.SMTP_APP_PASSWORD !== 'your_app_password') {
      const emailBody = `Hello ${name},\n\nWelcome to EmPay HRMS! Your registration was successful.\n\nYour Login ID is: ${loginId}\n\nPlease keep this ID safe as you will need it to log in.\n\nBest Regards,\nThe EmPay Team`;
      smtp.sendMail(email, 'Welcome to EmPay - Your Login ID', emailBody)
        .then(() => console.log(`Welcome email sent to ${email}`))
        .catch(err => console.error(`Failed to send email to ${email}:`, err));
    } else {
      console.log('SMTP credentials not configured. Skipping welcome email.');
    }

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
      SELECT u.id, u.email, u.password_hash, u.role, u.must_change_password, p.login_id, p.full_name, c.logo_url, c.name as company_name 
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
      mustChangePassword: user.must_change_password,
      user: {
        loginId: user.login_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        logoUrl: user.logo_url,
        companyName: user.company_name
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server Error during login' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { loginId, oldPassword, newPassword } = req.body;

    const query = `
      SELECT u.id, u.password_hash 
      FROM users u
      JOIN user_profiles p ON u.id = p.user_id
      WHERE p.login_id = $1
    `;
    const userResult = await pool.query(query, [loginId]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }
    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect old password' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE id = $2',
      [newPasswordHash, user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ message: 'Server Error during password change' });
  }
};
