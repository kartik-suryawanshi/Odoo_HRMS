const pool = require('../config/db');

// Get all users with their profile info and roles
exports.getAllUsers = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    // Get Admin's company
    const adminProfile = await pool.query('SELECT company_id FROM user_profiles WHERE user_id = $1', [adminId]);
    if (adminProfile.rows.length === 0) return res.status(404).json({ message: 'Admin profile not found' });
    const companyId = adminProfile.rows[0].company_id;

    const query = `
      SELECT 
        u.id, u.email, u.role,
        p.full_name as name, p.login_id
      FROM users u
      JOIN user_profiles p ON u.id = p.user_id
      WHERE p.company_id = $1
      ORDER BY p.full_name ASC
    `;
    const result = await pool.query(query, [companyId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    // Validate role
    const validRoles = ['Employee', 'Admin', 'HR Officer', 'Payroll Officer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Prevent Admin from changing their own role (optional, but safer)
    if (userId === req.user.id && role !== 'Admin') {
       return res.status(400).json({ message: 'You cannot revoke your own Admin role' });
    }

    const query = 'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role';
    const result = await pool.query(query, [role, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Role updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Update User Role Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
