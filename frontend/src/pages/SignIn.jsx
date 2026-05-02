/**
 * File: frontend/src/pages/SignIn.jsx
 * Purpose: Provides the UI for users to log into the application.
 * What it does: Renders a form with Login ID/Email and Password fields.
 *               Captures user input and submits it to the backend login API.
 * Data Fetching: N/A.
 * Data Sending: Sends a POST request to http://localhost:5000/api/auth/login
 *               with the 'identifier' and 'password' in the request body.
 * External Dependencies: react, react-router-dom, axios.
 * Environment Variables Required: N/A.
 * Related Files: backend/controllers/authController.js
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const SignIn = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      // Store token (in production, use secure storage/cookies)
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      if (response.data.mustChangePassword) {
        toast('Please change your default password', { icon: '⚠️' });
        navigate('/change-password');
      } else {
        toast.success('Login Successful!');
        navigate('/dashboard'); 
      }
    } catch (err) {
      setError('');
      toast.error(err.response?.data?.message || 'Something went wrong during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="logo-placeholder" style={{ backgroundColor: localStorage.getItem('user') ? 'transparent' : '#e9ecef', padding: localStorage.getItem('user') ? '0 0 20px 0' : '15px' }}>
        {localStorage.getItem('user') ? (
          <img 
            src={JSON.parse(localStorage.getItem('user')).logoUrl || ''} 
            alt="Company Logo" 
            style={{maxHeight: '120px', width: 'auto', display: 'block', margin: '0 auto'}}
            onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='block';}}
          />
        ) : (
          <span>App/Web Logo</span>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Login Id/Email :-</label>
          <input 
            type="text" 
            name="identifier" 
            value={formData.identifier} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Password :-</label>
          <input 
            type="password" 
            name="password" 
            value={formData.password} 
            onChange={handleChange} 
            required 
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Signing In...' : 'SIGN IN'}
        </button>
      </form>

      <div className="auth-footer">
        Don't have an account? <Link to="/register">Sign Up</Link>
      </div>
    </div>
  );
};

export default SignIn;
