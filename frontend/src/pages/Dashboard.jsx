/**
 * File: frontend/src/pages/Dashboard.jsx
 * Purpose: Main dashboard landing page after successful authentication.
 * What it does: Displays a welcome message and a logout button to end the session.
 * Data Fetching: Fetches user details from localStorage for display.
 * Data Sending: Clears localStorage on logout and redirects to /login.
 * External Dependencies: react, react-router-dom, react-hot-toast.
 * Environment Variables Required: N/A.
 * Related Files: frontend/src/App.jsx
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center', width: '100%' }}>
      <h1>Dashboard (Phase 2 Placeholder)</h1>
      <p style={{ margin: '20px 0' }}>Welcome back, <strong>{user.name || 'User'}</strong>!</p>
      
      <button 
        className="btn" 
        style={{ width: 'auto', backgroundColor: '#dc3545', padding: '10px 20px' }} 
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
