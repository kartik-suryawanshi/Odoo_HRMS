/**
 * File: frontend/src/pages/dashboards/EmployeeDashboard.jsx
 * Purpose: Personal dashboard for regular employees.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmployeeDashboard = ({ currentUser }) => {
  const [stats, setStats] = useState({ totalHours: 0, presentDays: 0, leaveDays: 0 });
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    fetchPersonalStats();
  }, []);

  const fetchPersonalStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/attendance/logs/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentLogs(res.data.slice(0, 5));
      
      const hours = res.data.reduce((acc, log) => acc + (parseFloat(log.total_hours) || 0), 0);
      setStats({
        totalHours: hours.toFixed(1),
        presentDays: res.data.length,
        leaveDays: 0 // Placeholder
      });
    } catch (err) {
      console.error('Failed to fetch personal stats', err);
    }
  };

  return (
    <div className="employee-dashboard">
      <div className="welcome-section" style={{ marginBottom: '30px' }}>
        <h2 style={{ margin: 0 }}>Welcome back, {currentUser?.full_name}! 👋</h2>
        <p style={{ color: '#64748b' }}>Here's an overview of your activity this month.</p>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Total Hours Worked</p>
          <h3 style={{ margin: '10px 0 0 0', fontSize: '1.8rem', color: '#7c3aed' }}>{stats.totalHours}h</h3>
        </div>
        <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Present Days</p>
          <h3 style={{ margin: '10px 0 0 0', fontSize: '1.8rem', color: '#28a745' }}>{stats.presentDays}</h3>
        </div>
        <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Pending Leaves</p>
          <h3 style={{ margin: '10px 0 0 0', fontSize: '1.8rem', color: '#ea580c' }}>{stats.leaveDays}</h3>
        </div>
      </div>

      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h4 style={{ marginTop: 0, marginBottom: '20px' }}>Recent Attendance Logs</h4>
        <table className="payroll-table">
          <thead>
            <tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th></tr>
          </thead>
          <tbody>
            {recentLogs.map(log => (
              <tr key={log.id}>
                <td>{new Date(log.check_in_time).toLocaleDateString()}</td>
                <td>{new Date(log.check_in_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                <td>{log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}</td>
                <td>{parseFloat(log.total_hours || 0).toFixed(1)}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
