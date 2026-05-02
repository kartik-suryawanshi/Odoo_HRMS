/**
 * File: backend/controllers/employeeController.js
 * Purpose: Handles fetching and creating employees.
 * What it does: Manages user creation, auto-generates credentials, and fetches list of users.
 * Data Fetching: Queries user and attendance tables.
 * Data Sending: Sends user data to frontend.
 * External Dependencies: bcrypt, crypto.
 * Environment Variables Required: N/A.
 * Related Files: backend/routes/employeeRoutes.js
 */

const pool = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const SMTPClient = require('../utils/smtpClient');

// Generate Login ID logic
const generateLoginId = async (companyName, firstName, lastName, yearOfJoining, client) => {
  const companyPrefix = companyName ? companyName.substring(0, 2).toUpperCase() : 'XX';
  const firstNamePrefix = firstName ? firstName.substring(0, 2).toUpperCase() : 'XX';
  const lastNamePrefix = lastName ? lastName.substring(0, 2).toUpperCase() : 'XX';
  
  const result = await client.query('SELECT COUNT(*) FROM user_profiles WHERE year_of_joining = $1', [yearOfJoining]);
  const count = parseInt(result.rows[0].count, 10);
  const serialNumber = count + 1;
  const serialString = serialNumber.toString().padStart(4, '0');

  const loginId = `${companyPrefix}${firstNamePrefix}${lastNamePrefix}${yearOfJoining}${serialString}`;
  return { loginId, serialNumber };
};

exports.getEmployees = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get Admin's company
    const adminProfile = await pool.query('SELECT company_id FROM user_profiles WHERE user_id = $1', [adminId]);
    if (adminProfile.rows.length === 0) return res.status(404).json({ message: 'Admin profile not found' });
    const companyId = adminProfile.rows[0].company_id;

    // Fetch employees for this company, using DISTINCT ON to get only the latest attendance log for today
    const query = `
      SELECT DISTINCT ON (p.user_id)
        p.user_id as id, p.full_name as name, p.login_id, u.email, p.phone, p.year_of_joining, u.role,
        al.check_in_time, al.check_out_time
      FROM user_profiles p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN attendance_logs al ON p.user_id = al.user_id AND DATE(al.check_in_time) = CURRENT_DATE
      WHERE p.company_id = $1 AND p.user_id != $2 AND u.role != 'Admin'
      ORDER BY p.user_id, al.check_in_time DESC
    `;
    const employeesResult = await pool.query(query, [companyId, adminId]);

    const employees = employeesResult.rows.map(emp => {
      let status = 'absent';
      if (emp.check_in_time && !emp.check_out_time) {
        status = 'present';
      } else if (emp.check_in_time && emp.check_out_time) {
        status = 'absent';
      }
      return { ...emp, status };
    });

    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.addEmployee = async (req, res) => {
  const client = await pool.connect();
  try {
    const adminId = req.user.id;
    const { firstName, lastName, email, phone, yearOfJoining, role } = req.body;

    // Validate role
    const validRoles = ['Employee', 'HR Officer', 'Payroll Officer'];
    const assignedRole = validRoles.includes(role) ? role : 'Employee';

    // Get Admin's company info
    const adminProfile = await client.query(`
      SELECT p.company_id, c.name as company_name 
      FROM user_profiles p
      JOIN companies c ON p.company_id = c.id
      WHERE p.user_id = $1
    `, [adminId]);

    if (adminProfile.rows.length === 0) return res.status(404).json({ message: 'Admin profile not found' });
    const { company_id: companyId, company_name: companyName } = adminProfile.rows[0];

    // Check if user already exists
    const userExist = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    await client.query('BEGIN');

    // Generate random 8-character password
    const randomPassword = crypto.randomBytes(4).toString('hex'); // 8 hex chars
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(randomPassword, salt);

    // Insert into users
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, role, must_change_password) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, passwordHash, assignedRole, true]
    );
    const userId = userResult.rows[0].id;

    // Generate Login ID
    const { loginId, serialNumber } = await generateLoginId(companyName, firstName, lastName, yearOfJoining, client);
    const fullName = `${firstName} ${lastName}`.trim();

    // Insert into user_profiles
    await client.query(
      'INSERT INTO user_profiles (user_id, company_id, login_id, full_name, phone, year_of_joining, serial_number) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, companyId, loginId, fullName, phone, yearOfJoining, serialNumber]
    );

    await client.query('COMMIT');

    // Send Email
    const smtp = new SMTPClient(
      process.env.SMTP_HOST || 'smtp.gmail.com',
      process.env.SMTP_PORT || 587,
      process.env.SMTP_EMAIL,
      process.env.SMTP_APP_PASSWORD
    );

    if (process.env.SMTP_EMAIL && process.env.SMTP_APP_PASSWORD && process.env.SMTP_APP_PASSWORD !== 'your_app_password') {
      const emailBody = `Hello ${fullName},\n\nYou have been added to the EmPay HRMS system.\n\nHere are your login credentials:\nLogin ID: ${loginId}\nPassword: ${randomPassword}\n\nYou will be required to change your password upon your first login.\n\nBest Regards,\nThe EmPay Team`;
      smtp.sendMail(email, 'Welcome to EmPay - Your Account Details', emailBody)
        .then(() => console.log(`Credentials email sent to ${email}`))
        .catch(err => console.error(`Failed to send email to ${email}:`, err));
    } else {
      console.log('SMTP credentials not configured. Skipping credentials email.');
    }

    res.status(201).json({
      message: 'Employee created successfully',
      employee: { name: fullName, loginId, email, phone, yearOfJoining }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add Employee Error:', error);
    res.status(500).json({ message: 'Server Error during employee creation' });
  } finally {
    client.release();
  }
};
