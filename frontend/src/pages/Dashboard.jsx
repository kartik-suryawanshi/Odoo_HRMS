import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Admin User', logoUrl: '' };
  
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const [employees, setEmployees] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', yearOfJoining: new Date().getFullYear() });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
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
      toast.success('Employee added successfully! Email sent.');
      setShowAddModal(false);
      setAddFormData({ firstName: '', lastName: '', email: '', phone: '', yearOfJoining: new Date().getFullYear() });
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleCheckIn = () => {
    setCheckedIn(true);
    toast.success('Checked IN successfully!');
  };

  const handleCheckOut = () => {
    setCheckedIn(false);
    toast.success('Checked OUT successfully!');
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'present': return <span className="status-indicator status-green" title="Present"></span>;
      case 'absent': return <span className="status-indicator status-yellow" title="Absent"></span>;
      case 'leave': return <span className="status-indicator status-leave" title="On Leave">✈️</span>;
      default: return null;
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          {user.logoUrl ? (
            <img src={`http://localhost:5000${user.logoUrl}`} alt="Company Logo" />
          ) : (
            <div style={{ width: 40, height: 40, background: '#eee', borderRadius: '4px' }}></div>
          )}
          <span>{user.companyName || 'Company Name'}</span>
        </div>
        <div className="sidebar-nav">
          <div className="nav-item active">Employees</div>
          <div className="nav-item">Attendance</div>
          <div className="nav-item">Time Off</div>
          <div className="nav-item">Payroll</div>
          <div className="nav-item">Reports</div>
          <div className="nav-item">Settings</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-area">
        {/* Header */}
        <div className="top-header">
          <div className="header-left">
            {user.role === 'Admin' && (
              <button className="btn-new" onClick={() => setShowAddModal(true)}>NEW</button>
            )}
            <input type="text" className="search-bar" placeholder="Search..." />
          </div>
          
          <div className="header-right">
            {/* The global status indicator for the logged-in user */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span 
                className={`status-indicator ${checkedIn ? 'status-green' : 'status-red'}`} 
                style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowProfileDropdown(false); }}
                title="Attendance Status"
              ></span>
              
              {showStatusDropdown && (
                <div className="profile-dropdown" style={{ top: '30px', right: '-10px', width: '200px' }}>
                  <div className="systray">
                    <button className="btn-outline" onClick={() => { handleCheckIn(); setShowStatusDropdown(false); }} disabled={checkedIn}>
                      Check IN →
                    </button>
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>
                      {checkedIn ? 'Since 09:00 AM' : 'Not checked in'}
                    </span>
                    <button className="btn-outline" onClick={() => { handleCheckOut(); setShowStatusDropdown(false); }} disabled={!checkedIn}>
                      Check Out →
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ position: 'relative' }}>
              <div 
                className="profile-avatar" 
                onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowStatusDropdown(false); }}
                title="Profile"
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="dropdown-item" onClick={() => { setShowProfileDropdown(false); toast('Profile coming soon'); }}>
                    My Profile
                  </div>
                  <div className="dropdown-item" onClick={handleLogout} style={{ color: '#dc3545' }}>
                    Log Out
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Content (Employee Grid) */}
        <div className="dashboard-content">
          <div className="employee-grid">
            {employees.length === 0 ? (
              <p style={{ textAlign: 'center', width: '100%', gridColumn: '1 / -1', color: '#666', marginTop: '40px' }}>
                No employees found. Click "NEW" to add one.
              </p>
            ) : (
              employees.map((emp) => (
                <div 
                  key={emp.id} 
                  className="employee-card"
                  onClick={() => setSelectedEmployee(emp)}
                >
                  <div className="card-status">
                    {getStatusIcon('present')} {/* Mock status for now */}
                  </div>
                  <div className="card-avatar">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div className="card-name">{emp.name}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* View-Only Employee Modal */}
      {selectedEmployee && (
        <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedEmployee(null)}>×</button>
            <h2 style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              Employee Information
            </h2>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
              <div className="card-avatar" style={{ margin: 0, width: '80px', height: '80px' }}>
                <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>{selectedEmployee.name}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                  Status: <strong style={{textTransform: 'capitalize'}}>{selectedEmployee.status}</strong>
                </p>
                <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>Role: Staff / Employee</p>
              </div>
            </div>
            
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '4px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}><strong>Email:</strong> {selectedEmployee.email}</p>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}><strong>Phone:</strong> {selectedEmployee.phone || 'N/A'}</p>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}><strong>Login ID:</strong> {selectedEmployee.login_id}</p>
              <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Join Year:</strong> {selectedEmployee.year_of_joining}</p>
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: '#999', fontStyle: 'italic' }}>View-only mode</span>
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
              <div className="form-group">
                <label>First Name</label>
                <input type="text" value={addFormData.firstName} onChange={(e) => setAddFormData({...addFormData, firstName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" value={addFormData.lastName} onChange={(e) => setAddFormData({...addFormData, lastName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={addFormData.email} onChange={(e) => setAddFormData({...addFormData, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="text" value={addFormData.phone} onChange={(e) => setAddFormData({...addFormData, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Year of Joining</label>
                <input type="number" value={addFormData.yearOfJoining} onChange={(e) => setAddFormData({...addFormData, yearOfJoining: e.target.value})} required />
              </div>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Adding...' : 'Add Employee'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
