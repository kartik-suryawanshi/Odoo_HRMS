import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const PayrollDashboard = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [empRes, gradeRes] = await Promise.all([
        axios.get('http://localhost:5000/api/salary/admin/summary', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/salary/grades/all', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setEmployees(empRes.data.employees || []);
      setGrades(gradeRes.data || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInlineChange = (userId, field, value) => {
    setEmployees(prev => prev.map(emp => 
      emp.user_id === userId ? { ...emp, [field]: value } : emp
    ));
  };

  const handleInlineSave = async (emp) => {
    setSavingId(emp.user_id);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/salary/${emp.user_id}`, {
        monthly_wage: emp.monthly_wage,
        grade_id: emp.grade_id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Updated salary for ${emp.name}`);
      fetchData(); // Refresh
    } catch (err) {
      toast.error('Failed to update salary');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="loading">Loading Employee Management...</div>;

  return (
    <div className="employees-management-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Employee Management Hub</h2>
          <p style={{ color: '#64748b', marginTop: '5px' }}>Manage salary grades and wages for all personnel.</p>
        </div>
        <button className="btn" onClick={() => navigate('/grades')}>Grade Library →</button>
      </div>

      <div className="payroll-table-container">
        <table className="payroll-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Current Grade</th>
              <th>Rule Set</th>
              <th>Monthly Wage (CTC)</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.user_id}>
                <td>
                  <div className="emp-name-cell">
                    <div className="emp-avatar">{emp.name.charAt(0)}</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{emp.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{emp.role}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <select 
                    className="table-select"
                    value={emp.grade_id || ''} 
                    onChange={(e) => handleInlineChange(emp.user_id, 'grade_id', e.target.value)}
                  >
                    <option value="">No Grade Assigned</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </td>
                <td>
                  <span className="template-tag" style={{ background: '#eef2ff', color: '#4338ca' }}>
                    {emp.template_name || 'Generic'}
                  </span>
                </td>
                <td>
                  <div className="table-input-wrapper">
                    <span style={{ color: '#94a3b8' }}>₹</span>
                    <input 
                      type="number" 
                      className="table-input"
                      value={emp.monthly_wage || 0}
                      onChange={(e) => handleInlineChange(emp.user_id, 'monthly_wage', e.target.value)}
                    />
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="btn-text" onClick={() => navigate(`/employee/${emp.user_id}`)}>Profile</button>
                    <button 
                      className="btn-save-mini" 
                      onClick={() => handleInlineSave(emp)}
                      disabled={savingId === emp.user_id}
                    >
                      {savingId === emp.user_id ? '...' : 'SAVE'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollDashboard;
