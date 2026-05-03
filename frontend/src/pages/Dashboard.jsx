/**
 * File: frontend/src/pages/Dashboard.jsx
 * Purpose: Renders the employee grid and employee-specific management.
 */

import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';

import AdminDashboard from './dashboards/AdminDashboard';
import EmployeeDashboard from './dashboards/EmployeeDashboard';
import HRDashboard from './dashboards/HRDashboard';

const Dashboard = () => {
  const { checkedIn, currentUser } = useOutletContext();
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsCheckIn, setNeedsCheckIn] = useState(false);

  useEffect(() => {
    if (checkedIn) {
      setNeedsCheckIn(false);
      fetchEmployees();
    } else {
      setNeedsCheckIn(true);
      setLoading(false);
    }
  }, [checkedIn]);

  const fetchEmployees = async () => {
    // Only admins and HR/Payroll can fetch all employees
    if (currentUser?.role === 'Employee') {
      setNeedsCheckIn(false);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(res.data);
      setNeedsCheckIn(false);
    } catch (err) {
      if (err.response?.data?.code === 'NOT_CHECKED_IN') {
        setNeedsCheckIn(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading Dashboard...</div>;

  // Role-Based Routing
  switch (currentUser?.role) {
    case 'Admin':
      return <AdminDashboard employees={employees} fetchEmployees={fetchEmployees} needsCheckIn={needsCheckIn} />;
    
    case 'HR Officer':
      return <HRDashboard employees={employees} fetchEmployees={fetchEmployees} needsCheckIn={needsCheckIn} />;
    
    case 'Payroll Officer':
      // Reuse Admin Dashboard for now, or we can point to a specific Payroll view
      return <AdminDashboard employees={employees} fetchEmployees={fetchEmployees} needsCheckIn={needsCheckIn} />;
    
    case 'Employee':
    default:
      return <EmployeeDashboard currentUser={currentUser} />;
  }
};

export default Dashboard;
