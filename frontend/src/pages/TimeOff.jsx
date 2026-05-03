import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';

const TimeOff = () => {
  const { currentUser } = useOutletContext();
  const [activeTab, setActiveTab] = useState('Time Off');
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New Request Form
  const [requestForm, setRequestForm] = useState({
    leave_type: 'Paid Time Off',
    start_date: '',
    end_date: '',
    reason: '',
    attachment_url: ''
  });

  // Allocation Form
  const [employees, setEmployees] = useState([]);
  const [allocForm, setAllocForm] = useState({
    user_id: '',
    leave_type: 'Paid Time Off',
    total_days: '',
    year: new Date().getFullYear()
  });

  useEffect(() => {
    fetchData();
    if (currentUser?.role === 'Admin' || currentUser?.role === 'HR Officer') {
      fetchEmployees();
    }
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [reqRes, balRes] = await Promise.all([
        axios.get('http://localhost:5000/api/leaves/requests', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/leaves/balances', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setRequests(reqRes.data);
      setBalances(balRes.data);
    } catch (err) {
      toast.error('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/employees', { headers: { Authorization: `Bearer ${token}` } });
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees');
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/leaves/request', requestForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Leave request submitted!');
      setShowRequestModal(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to submit request');
    }
  };

  const handleAllocSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/leaves/allocate', allocForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Leave allocated successfully!');
      setShowAllocModal(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to allocate leave');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/leaves/status/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Request ${status}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filteredRequests = requests.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.leave_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAuthorized = currentUser?.role === 'Admin' || currentUser?.role === 'HR Officer';

  return (
    <div className="timeoff-page">
      <div className="top-nav-tabs">
        <button className={`tab-btn ${activeTab === 'Time Off' ? 'active' : ''}`} onClick={() => setActiveTab('Time Off')}>Time Off</button>
        {isAuthorized && (
          <button className={`tab-btn ${activeTab === 'Allocation' ? 'active' : ''}`} onClick={() => setActiveTab('Allocation')}>Allocation</button>
        )}
      </div>

      <div className="action-bar" style={{ marginTop: '20px' }}>
        <button className="btn-new" onClick={() => setShowRequestModal(true)}>NEW REQUEST</button>
        <input 
          type="text" 
          className="search-bar" 
          placeholder="Search requests..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="balance-summary-row">
        {balances.map((bal, idx) => (
          <div key={idx} className="balance-card">
            <label>{bal.leave_type}</label>
            <div className="balance-val">{bal.available} Days Available</div>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{bal.used} used of {bal.total}</p>
          </div>
        ))}
        {balances.length === 0 && !loading && (
          <div className="empty-balance">No leave balances allocated yet.</div>
        )}
      </div>

      <div className="requests-table-container card">
        <table className="payroll-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Period</th>
              <th>Type</th>
              <th>Reason</th>
              <th>Status</th>
              {isAuthorized && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map(req => (
              <tr key={req.id}>
                <td><strong>{req.name}</strong></td>
                <td>{new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</td>
                <td><span className="type-badge">{req.leave_type}</span></td>
                <td>{req.reason || '-'}</td>
                <td>
                  <span className={`status-tag status-${req.status.toLowerCase()}`}>
                    {req.status}
                  </span>
                </td>
                {isAuthorized && (
                  <td>
                    {req.status === 'Pending' ? (
                      <div className="action-btns">
                        <button className="action-btn reject" onClick={() => handleStatusUpdate(req.id, 'Rejected')}>✖</button>
                        <button className="action-btn approve" onClick={() => handleStatusUpdate(req.id, 'Approved')}>✔</button>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Processed</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {filteredRequests.length === 0 && !loading && (
              <tr><td colSpan={isAuthorized ? 6 : 5} style={{ textAlign: 'center', padding: '40px' }}>No leave requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '500px' }}>
            <button className="modal-close" onClick={() => setShowRequestModal(false)}>×</button>
            <h3>Apply for Time Off</h3>
            <form onSubmit={handleRequestSubmit} style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label>Time off Type</label>
                <select value={requestForm.leave_type} onChange={(e) => setRequestForm({...requestForm, leave_type: e.target.value})} required>
                  <option value="Paid Time Off">Paid Time Off</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>
              <div className="form-group-row" style={{ display: 'flex', gap: '20px' }}>
                <div className="form-group" style={{ flex: 1 }}><label>Start Date</label><input type="date" value={requestForm.start_date} onChange={(e) => setRequestForm({...requestForm, start_date: e.target.value})} required /></div>
                <div className="form-group" style={{ flex: 1 }}><label>End Date</label><input type="date" value={requestForm.end_date} onChange={(e) => setRequestForm({...requestForm, end_date: e.target.value})} required /></div>
              </div>
              <div className="form-group"><label>Reason</label><textarea value={requestForm.reason} onChange={(e) => setRequestForm({...requestForm, reason: e.target.value})} rows="3" /></div>
              <button type="submit" className="btn" style={{ width: '100%', marginTop: '10px' }}>Submit Request</button>
            </form>
          </div>
        </div>
      )}

      {/* Allocation Tab / Modal View */}
      {activeTab === 'Allocation' && (
        <div className="allocation-section card" style={{ marginTop: '20px', padding: '30px' }}>
          <h3>Grant Leave Balance</h3>
          <p style={{ color: '#64748b', marginBottom: '30px' }}>Assign new leave credits to an employee for the current year.</p>
          <form onSubmit={handleAllocSubmit} style={{ maxWidth: '600px' }}>
             <div className="form-group">
                <label>Employee</label>
                <select value={allocForm.user_id} onChange={(e) => setAllocForm({...allocForm, user_id: e.target.value})} required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
             </div>
             <div className="form-group-row" style={{ display: 'flex', gap: '20px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Leave Type</label>
                  <select value={allocForm.leave_type} onChange={(e) => setAllocForm({...allocForm, leave_type: e.target.value})} required>
                    <option value="Paid Time Off">Paid Time Off</option>
                    <option value="Sick Leave">Sick Leave</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}><label>Days to Grant</label><input type="number" step="0.5" value={allocForm.total_days} onChange={(e) => setAllocForm({...allocForm, total_days: e.target.value})} placeholder="e.g. 10" required /></div>
             </div>
             <button type="submit" className="btn" style={{ marginTop: '10px' }}>Allocate Days</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TimeOff;
