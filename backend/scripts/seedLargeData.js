/**
 * File: backend/scripts/seedLargeData.js
 * Purpose: Seed the database with 600 real-looking employees for performance testing.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const firstNames = ['Amit', 'Priya', 'Raj', 'Sneha', 'Vikram', 'Anjali', 'Arjun', 'Neha', 'Sanjay', 'Kavita', 'Aditya', 'Pooja', 'Rohan', 'Swati', 'Manish', 'Deepa', 'Rahul', 'Shweta', 'Sunil', 'Megha'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Reddy', 'Kumar', 'Iyer', 'Deshmukh', 'Chopra', 'Joshi', 'Malhotra', 'Nair', 'Agarwal', 'Bose', 'Mishra', 'Yadav', 'Pandey', 'Kulkarni', 'Thakur'];
const jobTitles = ['Software Engineer', 'Senior Developer', 'Product Manager', 'HR Associate', 'Financial Analyst', 'Marketing Specialist', 'Data Scientist', 'UX Designer', 'Sales Executive', 'Accountant'];

const seed = async () => {
  try {
    console.log('Starting massive data seed (600 users)...');
    
    // 1. Get existing grades and company (Atlas Copco)
    const gradeRes = await pool.query('SELECT id FROM grades');
    const companyRes = await pool.query("SELECT id FROM companies WHERE name ILIKE '%Atlas Copco%' LIMIT 1");
    
    if (companyRes.rows.length === 0) {
      console.warn('Atlas Copco not found, falling back to first company...');
      const fallback = await pool.query('SELECT id FROM companies LIMIT 1');
      if (fallback.rows.length === 0) {
        console.error('No companies found. Please create a company first.');
        process.exit(1);
      }
      companyRes.rows = fallback.rows;
    }

    const gradeIds = gradeRes.rows.map(r => r.id);
    const companyId = companyRes.rows[0].id;
    const passwordHash = await bcrypt.hash('password123', 10);

    // CLEANUP: Delete previous test runs to avoid unique constraint errors
    console.log('Cleaning up old test data...');
    await pool.query("DELETE FROM users WHERE email LIKE '%@empay.com'");
    console.log('Old test data removed.');

    for (let i = 1; i <= 600; i++) {
      const fName = firstNames[i % firstNames.length];
      const lName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
      const fullName = `${fName} ${lName}`;
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}.${i}@empay.com`;
      const loginId = `ATS${2026}${String(i).padStart(5, '0')}`;
      const role = i <= 5 ? 'HR Officer' : (i <= 10 ? 'Payroll Officer' : 'Employee');
      const gradeId = gradeIds[i % gradeIds.length];
      const wage = 30000 + (Math.random() * 70000); // 30k to 100k

      // Insert User
      const userRes = await pool.query(
        'INSERT INTO users (email, password_hash, role, monthly_wage, grade_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [email, passwordHash, role, wage, gradeId]
      );
      const userId = userRes.rows[0].id;

      // Insert Profile
      await pool.query(
        `INSERT INTO user_profiles (
          user_id, company_id, login_id, full_name, phone, 
          job_position, date_of_joining, gender, nationality, 
          bank_name, account_number, ifsc_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          userId, 
          companyId, 
          loginId, 
          fullName, 
          `98765${String(i).padStart(5, '0')}`,
          jobTitles[i % jobTitles.length],
          '2024-01-01',
          i % 2 === 0 ? 'Male' : 'Female',
          'Indian',
          'State Bank of India',
          `3456789${String(i).padStart(5, '0')}`,
          'SBIN0001234'
        ]
      );

      // Optional: Generate some attendance for the first 100 users to see chart data
      if (i <= 100) {
        const checkIn = new Date();
        checkIn.setHours(9, 0, 0);
        
        const logRes = await pool.query(
          'INSERT INTO attendance_logs (user_id, check_in_time, total_hours) VALUES ($1, $2, $3) RETURNING id',
          [userId, checkIn, 8.0]
        );
        const logId = logRes.rows[0].id;

        // Add some heartbeats to verify the pulse logic works for many users
        for (let pulse = 0; pulse < 96; pulse++) { // 8 hours * 12 pulses/hr = 96
           await pool.query(
             'INSERT INTO attendance_heartbeats (user_id, log_id, timestamp) VALUES ($1, $2, $3)',
             [userId, logId, new Date(checkIn.getTime() + pulse * 5 * 60000)]
           );
        }
      }

      if (i % 50 === 0) console.log(`Seeded ${i} users...`);
    }

    console.log('Successfully seeded 600 users and sample attendance data.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
