/**
 * File: backend/controllers/profileController.js
 * Purpose: Handles profile-related operations (fetching and updating).
 * What it does: Retrieves full user profile details and updates them.
 * Data Fetching: Queries user_profiles and users tables.
 * Data Sending: Returns profile data or success message.
 * External Dependencies: None.
 * Environment Variables Required: N/A.
 * Related Files: backend/routes/profileRoutes.js
 */

const pool = require('../config/db');

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    const query = `
      SELECT 
        u.id as user_id, u.email, u.role,
        p.full_name as name, p.login_id, p.phone, p.year_of_joining,
        p.department, p.location, p.about_me, p.job_love_description, 
        p.interests_hobbies, p.skills, p.certifications,
        c.name as company_name, c.logo_url as company_logo
      FROM users u
      JOIN user_profiles p ON u.id = p.user_id
      JOIN companies c ON p.company_id = c.id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Server Error fetching profile' });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      department, location, about_me, 
      job_love_description, interests_hobbies, 
      skills, certifications,
      dob, residing_address, nationality, personal_email,
      gender, marital_status, account_number, bank_name,
      ifsc_code, pan_no, uan_no
    } = req.body;

    const query = `
      UPDATE user_profiles 
      SET 
        department = COALESCE($1, department),
        location = COALESCE($2, location),
        about_me = COALESCE($3, about_me),
        job_love_description = COALESCE($4, job_love_description),
        interests_hobbies = COALESCE($5, interests_hobbies),
        skills = COALESCE($6, skills),
        certifications = COALESCE($7, certifications),
        dob = COALESCE($9, dob),
        residing_address = COALESCE($10, residing_address),
        nationality = COALESCE($11, nationality),
        personal_email = COALESCE($12, personal_email),
        gender = COALESCE($13, gender),
        marital_status = COALESCE($14, marital_status),
        account_number = COALESCE($15, account_number),
        bank_name = COALESCE($16, bank_name),
        ifsc_code = COALESCE($17, ifsc_code),
        pan_no = COALESCE($18, pan_no),
        uan_no = COALESCE($19, uan_no)
      WHERE user_id = $8
      RETURNING *
    `;

    const result = await pool.query(query, [
      department, location, about_me, 
      job_love_description, interests_hobbies, 
      skills ? JSON.stringify(skills) : null, 
      certifications ? JSON.stringify(certifications) : null, 
      userId,
      dob, residing_address, nationality, personal_email,
      gender, marital_status, account_number, bank_name,
      ifsc_code, pan_no, uan_no
    ]);

    res.json({ message: 'Profile updated successfully', profile: result.rows[0] });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Server Error updating profile' });
  }
};
