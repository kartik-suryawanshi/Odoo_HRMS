import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    loginId: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-populate Login ID from local storage if available
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.loginId) {
      setFormData(prev => ({ ...prev, loginId: user.loginId }));
    } else {
      toast.error('Session expired, please login again');
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/change-password', 
        {
          loginId: formData.loginId,
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Password updated successfully! Welcome to your dashboard.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card" style={{ maxWidth: '500px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Change Password</h2>
      <p style={{ textAlign: 'center', marginBottom: '30px', color: '#666', fontSize: '0.9rem' }}>
        For security reasons, please change your default password to continue.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Login Id:</label>
          <input 
            type="text" 
            name="loginId" 
            value={formData.loginId} 
            disabled
            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
          />
        </div>
        <div className="form-group">
          <label>Old Password:</label>
          <input 
            type="password" 
            name="oldPassword" 
            value={formData.oldPassword} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="form-group">
          <label>New Password:</label>
          <input 
            type="password" 
            name="newPassword" 
            value={formData.newPassword} 
            onChange={handleChange} 
            required 
            minLength="6"
          />
        </div>
        <div className="form-group">
          <label>Confirm Password:</label>
          <input 
            type="password" 
            name="confirmPassword" 
            value={formData.confirmPassword} 
            onChange={handleChange} 
            required 
            minLength="6"
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="btn" disabled={loading} style={{ marginTop: '10px' }}>
          {loading ? 'Updating...' : 'Reset password'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
