/**
 * File: frontend/src/pages/Profile.jsx
 * Purpose: Detailed user profile management with Grade-Based Salary ERP Engine.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';

// Helper Components for the new Grade-Based Engine
const SalarySummary = ({ summary }) => (
  <div className="salary-summary-card">
    <div className="summary-item">
      <label>Base Monthly Wage</label>
      <span className="summary-val" style={{ fontSize: '1.1rem', color: '#94a3b8' }}>₹ {parseFloat(summary.base_wage || 0).toLocaleString()}</span>
    </div>
    <div className="summary-divider"></div>
    <div className="summary-item">
      <label>Payable Days</label>
      <span className="summary-val" style={{ color: '#d678f2' }}>{summary.payable_days} / {summary.total_working_days}</span>
    </div>
    <div className="summary-divider"></div>
    <div className="summary-item">
      <label>Actual Gross</label>
      <span className="summary-val">₹ {parseFloat(summary.gross || 0).toLocaleString()}</span>
    </div>
    <div className="summary-divider"></div>
    <div className="summary-item">
      <label>Total Deductions</label>
      <span className="summary-val" style={{ color: '#dc3545' }}>₹ {parseFloat(summary.total_deductions || 0).toLocaleString()}</span>
    </div>
    <div className="summary-divider"></div>
    <div className="summary-item">
      <label>Net In-Hand</label>
      <span className="summary-val" style={{ color: '#28a745' }}>₹ {parseFloat(summary.net_salary || 0).toLocaleString()}</span>
    </div>
  </div>
);

const BreakdownSection = ({ title, items, color }) => (
  <div className="breakdown-section">
    <h4 className="info-group-title">{title}</h4>
    {items.map((item, idx) => (
      <div key={idx} className="component-row">
        <div className="component-info">
          <label>{item.name}</label>
          <span className="calculated-value" style={{ color: color }}>₹ {parseFloat(item.amount).toFixed(2)}</span>
          <p className="formula-text">{item.rule}</p>
        </div>
      </div>
    ))}
  </div>
);

const Profile = () => {
  const { id } = useParams();
  const { currentUser } = useOutletContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [salaryData, setSalaryData] = useState(null);
  const [activeTab, setActiveTab] = useState('Private Info');
  const [privateInfo, setPrivateInfo] = useState({});
  const [selectedBreakdownId, setSelectedBreakdownId] = useState(id || null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [attMonth, setAttMonth] = useState(new Date().getMonth() + 1);
  const [attYear, setAttYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchProfile();
  }, [id]);

  useEffect(() => {
    const userId = id || (profile ? profile.user_id : null);
    if (!userId) return;

    if (activeTab === 'Salary Info') {
      fetchSalaryData(userId);
      if (currentUser?.role === 'Admin' || currentUser?.role === 'Payroll Officer') {
        fetchAdminContext();
      }
    } else if (activeTab === 'Attendance') {
      fetchAttendanceData(userId);
    }
  }, [profile, activeTab, id, attMonth, attYear]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = id ? `http://localhost:5000/api/profile/${id}` : 'http://localhost:5000/api/profile/me';
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setPrivateInfo(res.data);
    } catch (err) {
      toast.error('Failed to load profile');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryData = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/salary/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalaryData(res.data);
    } catch (err) {
      console.error('Failed to load salary data');
    }
  };

  const fetchAttendanceData = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/attendance/summary?userId=${userId}&month=${attMonth}&year=${attYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceData(res.data);
    } catch (err) {
      console.error('Failed to load attendance data');
    }
  };

  const fetchAdminContext = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/salary/admin/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllEmployees(res.data.employees || []);
    } catch (err) {
      console.error('Failed to load admin context');
    }
  };

  const formatHours = (decimalHours) => {
    if (!decimalHours) return '-';
    const totalMinutes = Math.round(parseFloat(decimalHours) * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleUpdate = async (field, value) => {
    try {
      const token = localStorage.getItem('token');
      const updateData = field === 'all' ? { ...value } : { [field]: value };
      
      // If we are an Admin editing someone else (id exists in params)
      if (id) updateData.userId = id;

      await axios.put('http://localhost:5000/api/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (field === 'all') setProfile({ ...profile, ...value });
      else setProfile({ ...profile, [field]: value });
      toast.success('Updated successfully');
    } catch (err) {
      toast.error('Update failed');
    }
  };

  if (loading) return <div className="loading">Loading Profile...</div>;
  if (!profile) return null;

  return (
    <div className="profile-page-container">
      {/* Header Info Card */}
      <div className="profile-header-card">
        <div className="profile-pic-large">
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div className="profile-main-info">
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.4rem' }}>{profile.name}</h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p><strong>Job Position:</strong> {profile.job_position || 'Not Assigned'}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Mobile:</strong> {profile.phone || 'N/A'}</p>
            </div>
            <div>
              <p><strong>Company:</strong> {profile.company_name}</p>
              <p><strong>Department:</strong> {profile.department || 'Not Assigned'}</p>
              <p><strong>Manager:</strong> {profile.manager_name || 'No Manager'}</p>
              <p><strong>Location:</strong> {profile.location || 'Remote'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        {['Resume', 'Private Info', 'Attendance', 'Salary Info', 'Security'].map(tab => (
          <div key={tab} className={`profile-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</div>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'Private Info' && (
          <div className="private-info-container">
            <div className="private-info-grid">
              <div className="info-column">
                <h4 className="info-group-title">Personal Details</h4>
                <div className="form-group-horizontal"><label>DOB</label><input type="date" value={privateInfo.dob ? privateInfo.dob.split('T')[0] : ''} onChange={(e) => setPrivateInfo({ ...privateInfo, dob: e.target.value })} /></div>
                <div className="form-group-horizontal"><label>Residing Address</label><textarea value={privateInfo.residing_address || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, residing_address: e.target.value })} rows="2" /></div>
                <div className="form-group-horizontal"><label>Nationality</label><input type="text" value={privateInfo.nationality || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, nationality: e.target.value })} /></div>
                <div className="form-group-horizontal"><label>Personal Email</label><input type="email" value={privateInfo.personal_email || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, personal_email: e.target.value })} /></div>
                <div className="form-group-horizontal"><label>Gender</label>
                  <select value={privateInfo.gender || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, gender: e.target.value })}>
                    <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group-horizontal"><label>Marital Status</label>
                  <select value={privateInfo.marital_status || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, marital_status: e.target.value })}>
                    <option value="">Select</option><option value="Single">Single</option><option value="Married">Married</option>
                  </select>
                </div>
                <div className="form-group-horizontal"><label>Date of Joining</label><input type="date" value={privateInfo.date_of_joining ? privateInfo.date_of_joining.split('T')[0] : ''} onChange={(e) => setPrivateInfo({ ...privateInfo, date_of_joining: e.target.value })} /></div>
              </div>
              <div className="info-column">
                <h4 className="info-group-title">Bank Details</h4>
                <div className="form-group-horizontal"><label>Account Number</label><input type="text" value={privateInfo.account_number || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, account_number: e.target.value })} /></div>
                <div className="form-group-horizontal"><label>Bank Name</label><input type="text" value={privateInfo.bank_name || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, bank_name: e.target.value })} /></div>
                <div className="form-group-horizontal"><label>IFSC Code</label><input type="text" value={privateInfo.ifsc_code || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, ifsc_code: e.target.value })} /></div>
                <div className="form-group-horizontal"><label>PAN No</label><input type="text" value={privateInfo.pan_no || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, pan_no: e.target.value })} /></div>
                <div className="form-group-horizontal"><label>UAN NO</label><input type="text" value={privateInfo.uan_no || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, uan_no: e.target.value })} /></div>
                <div className="form-group-horizontal"><label>Emp Code</label><input type="text" value={profile.login_id} disabled style={{ background: '#f0f0f0' }} /></div>
                
                {currentUser?.role === 'Admin' && (
                  <>
                    <h4 className="info-group-title" style={{ marginTop: '20px' }}>Admin Controls</h4>
                    <div className="form-group-horizontal"><label>Job Position</label><input type="text" value={privateInfo.job_position || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, job_position: e.target.value })} /></div>
                    <div className="form-group-horizontal"><label>Manager ID</label><input type="number" value={privateInfo.manager_id || ''} onChange={(e) => setPrivateInfo({ ...privateInfo, manager_id: e.target.value })} /></div>
                  </>
                )}

                <button className="btn" style={{ marginTop: '30px', width: '100%' }} onClick={() => handleUpdate('all', privateInfo)}>Save Information</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Attendance' && (
          <div className="attendance-profile-view">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Attendance Log</h3>
                <div className="nav-arrows">
                  <button className="arrow-btn" onClick={() => setAttMonth(m => m === 1 ? 12 : m - 1)}>{'<'}</button>
                  <span style={{ margin: '0 15px', fontWeight: '600' }}>{new Date(attYear, attMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  <button className="arrow-btn" onClick={() => setAttMonth(m => m === 12 ? 1 : m + 1)}>{'>'}</button>
                </div>
             </div>

             {attendanceData && (
                <div className="attendance-stats-row" style={{ marginBottom: '25px' }}>
                  <div className="stat-pill"><label>Days Present</label><span>{attendanceData.summary.presentCount}</span></div>
                  <div className="stat-pill"><label>Leaves Count</label><span>{attendanceData.summary.leavesCount}</span></div>
                  <div className="stat-pill"><label>Total Working Days</label><span>{attendanceData.summary.totalWorkingDays}</span></div>
                </div>
             )}

             <div className="attendance-table-card">
                <table className="payroll-table">
                  <thead>
                    <tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Work Hours</th></tr>
                  </thead>
                  <tbody>
                    {attendanceData?.logs.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px' }}>No records found</td></tr>
                    ) : (
                      attendanceData?.logs.map((log, i) => (
                        <tr key={i}>
                          <td>{new Date(log.check_in_time).toLocaleDateString('en-GB')}</td>
                          <td>{new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td>{log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                          <td>{formatHours(log.total_hours)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'Salary Info' && (
          <div className="salary-container">
            <h3 style={{ marginBottom: '20px' }}>
              {id ? `Salary Breakdown for ${profile.name}` : 'My Salary Breakdown'}
            </h3>
            {salaryData ? (
              <div className="salary-breakdown">
                <SalarySummary summary={salaryData.summary} />
                <div className="salary-components-grid" style={{ marginTop: '30px' }}>
                  <BreakdownSection title="Earnings" items={salaryData.earnings} color="#28a745" />
                  <BreakdownSection title="Deductions" items={salaryData.deductions} color="#dc3545" />
                </div>
                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                  <button className="btn-outline">Download Payslip (PDF)</button>
                </div>
              </div>
            ) : (
              <div className="empty-state">No salary information available for this period.</div>
            )}
          </div>
        )}

        {activeTab === 'Resume' && <div className="empty-state"><h3>My Resume</h3><button className="btn">Upload Resume</button></div>}
        {activeTab === 'Security' && <div className="empty-state"><h3>Security Settings</h3><button className="btn" onClick={() => navigate('/change-password')}>Change Password</button></div>}
      </div>
    </div>
  );
};

export default Profile;
