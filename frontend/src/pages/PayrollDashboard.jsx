/**
 * File: frontend/src/pages/PayrollDashboard.jsx
 * Purpose: Admin overview of all employee salaries.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const PayrollDashboard = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserAndData();
  }, []);

  const fetchUserAndData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch current user role
      const userRes = await axios.get('http://localhost:5000/api/profile/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userRes.data);

      if (userRes.data.role !== 'Admin' && userRes.data.role !== 'Payroll Officer') {
        toast.error('Unauthorized access');
        navigate('/dashboard');
        return;
      }

      const res = await axios.get('http://localhost:5000/api/salary/admin/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(res.data);
    } catch (err) {
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const calculateNet = (emp) => {
    if (!emp.monthly_wage) return 0;
    const basic = emp.monthly_wage * (emp.basic_percent / 100);
    const pf = basic * (emp.pf_percent / 100);
    const tax = parseFloat(emp.professional_tax) || 0;
    return emp.monthly_wage - (pf + tax);
  };

  if (loading) return <div className="loading">Loading Payroll Dashboard...</div>;

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <div className="sidebar-logo" onClick={() => navigate('/dashboard')} style={{cursor: 'pointer'}}>
          <div style={{ width: 40, height: 40, background: '#eee', borderRadius: '4px' }}></div>
          <span>EmPay</span>
        </div>
        <div className="sidebar-nav">
          <div className="nav-item" onClick={() => navigate('/dashboard')}>Dashboard</div>
          <div className="nav-item" onClick={() => navigate('/profile')}>My Profile</div>
          <div className="nav-item active" onClick={() => navigate('/payroll')}>Payroll</div>
          <div className="nav-item" onClick={() => navigate('/salary-templates')}>Templates</div>
        </div>
      </div>

      <div className="main-area">
        <div className="top-header">
          <h2>Payroll Management</h2>
          <button className="btn" onClick={() => navigate('/salary-templates')}>Manage Templates</button>
        </div>

        <div className="dashboard-content" style={{ padding: '30px' }}>
          <div className="payroll-table-container">
            <table className="payroll-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Template</th>
                  <th>Monthly Wage</th>
                  <th>Net In-Hand</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.user_id}>
                    <td>
                      <div className="emp-name-cell">
                        <div className="emp-avatar">{emp.name.charAt(0)}</div>
                        <span>{emp.name}</span>
                      </div>
                    </td>
                    <td>{emp.role}</td>
                    <td>
                      <span className="template-tag">{emp.template_name || 'Not Set'}</span>
                    </td>
                    <td>₹ {parseFloat(emp.monthly_wage || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 600, color: '#28a745' }}>
                      ₹ {calculateNet(emp).toLocaleString()}
                    </td>
                    <td>
                      <button 
                        className="btn-outline" 
                        onClick={() => navigate(`/employee/${emp.user_id}`)}
                      >
                        Manage Salary
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollDashboard;
