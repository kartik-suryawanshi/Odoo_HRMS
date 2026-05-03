/**
 * File: frontend/src/pages/dashboards/HRDashboard.jsx
 * Purpose: HR-focused dashboard for employee onboarding and records.
 */

import React from 'react';
import AdminDashboard from './AdminDashboard';

const HRDashboard = (props) => {
  // HR Dashboard currently shares much of the employee management logic with Admin,
  // but we can add HR-specific widgets here like recruitment stats or leave approvals.
  return (
    <div className="hr-dashboard">
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ margin: 0 }}>HR Management Console</h2>
        <p style={{ color: '#64748b' }}>Manage employee onboarding and personnel records.</p>
      </div>
      <AdminDashboard {...props} />
    </div>
  );
};

export default HRDashboard;
