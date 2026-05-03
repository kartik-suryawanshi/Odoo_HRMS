import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Settings = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setSavingId(userId);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/admin/users/role', {
        userId,
        role: newRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('Role updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="loading">Loading Settings...</div>;

  return (
    <div className="settings-page">
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ margin: 0 }}>User Setting</h2>
        <p style={{ color: '#64748b', marginTop: '5px' }}>
          Assign user access rights based on each user's role and responsibilities.
        </p>
      </div>

      <div className="payroll-table-container">
        <table className="payroll-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Login ID</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="emp-name-cell">
                    <div className="emp-avatar" style={{ background: user.role === 'Admin' ? '#ef4444' : '#7c3aed' }}>
                      {user.name.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 600 }}>{user.name}</span>
                  </div>
                </td>
                <td>{user.login_id}</td>
                <td>{user.email}</td>
                <td>
                  <select 
                    className="table-select"
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={savingId === user.id}
                    style={{ 
                      minWidth: '150px',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      cursor: savingId === user.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="Employee">Employee</option>
                    <option value="Admin">Admin</option>
                    <option value="HR Officer">HR Officer</option>
                    <option value="Payroll Officer">Payroll Officer</option>
                  </select>
                  {savingId === user.id && <span style={{ marginLeft: '10px', fontSize: '0.75rem', color: '#64748b' }}>Saving...</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
         <h4 style={{ marginBottom: '10px' }}>Module-wise Access Summary</h4>
         <ul style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.6' }}>
            <li><strong>Admin:</strong> Full access to all modules, settings, and user management.</li>
            <li><strong>HR Officer:</strong> Access to Employees, Attendance, and Time Off modules.</li>
            <li><strong>Payroll Officer:</strong> Access to Payroll, Grades, and Templates modules.</li>
            <li><strong>Employee:</strong> Access to personal Profile, personal Attendance, and personal Time Off.</li>
         </ul>
      </div>
    </div>
  );
};

export default Settings;
