/**
 * File: frontend/src/pages/dashboards/AdminDashboard.jsx
 * Purpose: Global overview and employee management for administrators.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminDashboard = ({ employees, fetchEmployees, needsCheckIn }) => {
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeLogs, setEmployeeLogs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', yearOfJoining: new Date().getFullYear(), role: 'Employee' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeLogs(selectedEmployee.id);
    }
  }, [selectedEmployee]);

  const fetchEmployeeLogs = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/attendance/logs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployeeLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch employee logs', err);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/employees', addFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Employee added successfully!');
      setShowAddModal(false);
      setAddFormData({ firstName: '', lastName: '', email: '', phone: '', yearOfJoining: new Date().getFullYear(), role: 'Employee' });
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'present': return <span className="status-indicator status-green" title="Present"></span>;
      case 'absent': return <span className="status-indicator status-yellow" title="Absent"></span>;
      case 'leave': return <span className="status-indicator status-leave" title="On Leave">✈️</span>;
      default: return null;
    }
  };

  const formatHours = (decimalHours) => {
    if (!decimalHours) return '-';
    const totalMinutes = Math.round(parseFloat(decimalHours) * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="admin-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
         <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-new" onClick={() => setShowAddModal(true)}>NEW EMPLOYEE</button>
            <input type="text" className="search-bar" placeholder="Search employees..." style={{ width: '300px' }} />
         </div>
      </div>

      <div className="dashboard-content-area" style={{ position: 'relative', minHeight: '400px' }}>
        {needsCheckIn && (
          <div className="check-in-overlay" style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(255,255,255,0.9)', zIndex: 10, 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            borderRadius: '12px'
          }}>
            <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#dc3545' }}>Action Required</h3>
              <p>Please <strong>Check IN</strong> using the status indicator at the top right to access records.</p>
            </div>
          </div>
        )}

        <div className="employee-grid">
          {employees.map((emp) => (
            <div key={emp.id} className="employee-card" onClick={() => setSelectedEmployee(emp)}>
              <div className="card-status">{getStatusIcon(emp.status)}</div>
              <div className="card-avatar">
                <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <div className="card-name">{emp.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center', marginTop: '2px' }}>{emp.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Modal */}
      {selectedEmployee && (
        <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
            <button className="modal-close" onClick={() => setSelectedEmployee(null)}>×</button>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
              <div className="profile-pic-large" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                {selectedEmployee.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{selectedEmployee.name}</h3>
                <p style={{ margin: '5px 0', color: '#666' }}>{selectedEmployee.email}</p>
                <button className="btn-text" onClick={() => navigate(`/employee/${selectedEmployee.id}`)}>View Full Profile →</button>
              </div>
            </div>
            
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
               <p style={{ margin: '5px 0' }}><strong>Login ID:</strong> {selectedEmployee.login_id}</p>
               <p style={{ margin: '5px 0' }}><strong>Phone:</strong> {selectedEmployee.phone || 'N/A'}</p>
            </div>

            <h4>Recent Attendance</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
               <table className="payroll-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                     <tr><th>Date</th><th>In</th><th>Out</th><th>Hrs</th></tr>
                  </thead>
                  <tbody>
                     {employeeLogs.map(log => (
                       <tr key={log.id}>
                          <td>{new Date(log.check_in_time).toLocaleDateString()}</td>
                          <td>{new Date(log.check_in_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                          <td>{log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}</td>
                          <td>{formatHours(log.total_hours)}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => !loading && setShowAddModal(false)}>×</button>
            <h2 style={{ marginBottom: '20px' }}>Add New Employee</h2>
            <form onSubmit={handleAddSubmit}>
              <div className="form-group"><label>First Name</label><input type="text" value={addFormData.firstName} onChange={(e) => setAddFormData({...addFormData, firstName: e.target.value})} required /></div>
              <div className="form-group"><label>Last Name</label><input type="text" value={addFormData.lastName} onChange={(e) => setAddFormData({...addFormData, lastName: e.target.value})} required /></div>
              <div className="form-group"><label>Email</label><input type="email" value={addFormData.email} onChange={(e) => setAddFormData({...addFormData, email: e.target.value})} required /></div>
              <div className="form-group"><label>Phone</label><input type="text" value={addFormData.phone} onChange={(e) => setAddFormData({...addFormData, phone: e.target.value})} /></div>
              <div className="form-group">
                <label>Assigned Role</label>
                <select value={addFormData.role} onChange={(e) => setAddFormData({...addFormData, role: e.target.value})} required>
                  <option value="Employee">Employee</option><option value="HR Officer">HR Officer</option><option value="Payroll Officer">Payroll Officer</option>
                </select>
              </div>
              <button type="submit" className="btn" disabled={loading}>{loading ? 'Adding...' : 'Add Employee'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
