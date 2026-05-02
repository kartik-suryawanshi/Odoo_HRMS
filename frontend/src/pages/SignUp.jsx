/**
 * File: frontend/src/pages/SignUp.jsx
 * Purpose: Provides the UI for Admin/Company registration.
 * What it does: Renders a form with company details, user details, and a logo upload field.
 *               Validates passwords match and submits FormData to the backend.
 * Data Fetching: N/A.
 * Data Sending: Sends a multipart/form-data POST request to http://localhost:5000/api/auth/register
 *               containing text fields and the logo file.
 * External Dependencies: react, react-router-dom, axios.
 * Environment Variables Required: N/A.
 * Related Files: backend/controllers/authController.js
 */

import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const SignUp = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [logo, setLogo] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    const submitData = new FormData();
    submitData.append('companyName', formData.companyName);
    submitData.append('name', formData.name);
    submitData.append('email', formData.email);
    submitData.append('phone', formData.phone);
    submitData.append('password', formData.password);
    if (logo) {
      submitData.append('logo', logo);
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess(response.data.user.login_id);
      toast.success('Registration successful! Please copy your Login ID.', { duration: 6000 });
      setFormData({
        companyName: '', name: '', email: '', phone: '', password: '', confirmPassword: ''
      });
      setLogo(null);
    } catch (err) {
      setError('');
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card large">
      <div className="logo-placeholder">
        {logo ? <span>{logo.name}</span> : <span>App/Web Logo</span>}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Company Name :-</label>
          <div className="input-row">
            <input 
              type="text" 
              name="companyName" 
              value={formData.companyName} 
              onChange={handleChange} 
              required 
            />
            <button type="button" className="btn-icon" onClick={triggerFileInput} title="Upload Logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
              accept="image/*"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Name :-</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>Email :-</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>Phone :-</label>
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
        </div>
        
        <div className="form-group">
          <label>Password :-</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>Confirm Password :-</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#d4edda', padding: '15px', borderRadius: '5px', marginTop: '15px', border: '1px solid #c3e6cb' }}>
            <span style={{ color: '#155724', fontWeight: 'bold', fontSize: '1rem', marginBottom: '10px' }}>
              Your Login ID is: <span style={{letterSpacing: '1px'}}>{success}</span>
            </span>
            <button 
              type="button" 
              className="btn" 
              style={{ width: 'auto', padding: '8px 20px', marginTop: '0', backgroundColor: '#28a745' }}
              onClick={() => {
                navigator.clipboard.writeText(success);
                toast.success('Login ID copied to clipboard!');
              }}
            >
              Copy Login ID
            </button>
          </div>
        )}

        <button type="submit" className="btn" disabled={loading} style={{marginTop: '20px'}}>
          {loading ? 'Processing...' : 'Sign Up'}
        </button>
      </form>

      <div className="auth-footer">
        Already have an account? <Link to="/login">Sign In</Link>
      </div>
    </div>
  );
};

export default SignUp;
