/**
 * File: frontend/src/pages/Profile.jsx
 * Purpose: Detailed user profile management.
 * What it does: Displays and allows editing of personal info, skills, and professional details.
 * Data Fetching: GET /api/profile/me.
 * Data Sending: PUT /api/profile.
 * External Dependencies: react, axios, react-hot-toast.
 * Environment Variables Required: N/A.
 * Related Files: backend/controllers/profileController.js
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

// Helper Components for Salary Engine
const SalarySummary = ({ salary }) => {
  const basic = salary.monthly_wage * (salary.basic_percent / 100);
  const hra = basic * (salary.hra_percent / 100);
  const perf = salary.monthly_wage * (salary.performance_bonus_percent / 100);
  const lta = salary.monthly_wage * (salary.lta_percent / 100);
  const standard = parseFloat(salary.standard_allowance) || 0;
  
  const pf = basic * (salary.pf_percent / 100);
  const profTax = parseFloat(salary.professional_tax) || 0;
  const netSalary = salary.monthly_wage - (pf + profTax);

  return (
    <div className="salary-summary-card">
      <div className="summary-item">
        <label>Gross Salary</label>
        <span className="summary-val">₹ {parseFloat(salary.monthly_wage).toLocaleString()}</span>
      </div>
      <div className="summary-divider"></div>
      <div className="summary-item">
        <label>Total Deductions</label>
        <span className="summary-val" style={{color: '#dc3545'}}>₹ {(pf + profTax).toLocaleString()}</span>
      </div>
      <div className="summary-divider"></div>
      <div className="summary-item">
        <label>Net In-Hand Salary</label>
        <span className="summary-val" style={{color: '#28a745'}}>₹ {netSalary.toLocaleString()}</span>
      </div>
    </div>
  );
};

const SalaryRow = ({ label, value, rule, percent, amount, onChange, isFixed, readOnly }) => (
  <div className="component-row">
    <div className="component-info">
      <label>{label}</label>
      <span className="calculated-value">₹ {value.toFixed(2)}</span>
      <p className="formula-text">Rule: {rule}</p>
    </div>
    <div className="percent-input" style={isFixed ? { width: '120px' } : {}}>
      {isFixed ? <span>₹</span> : null}
      <input 
        type="number" 
        value={isFixed ? amount : percent} 
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        disabled={readOnly}
      />
      {!isFixed ? <span>%</span> : null}
    </div>
  </div>
);

const BalancingRow = ({ salary }) => {
  const basic = salary.monthly_wage * (salary.basic_percent / 100);
  const hra = basic * (salary.hra_percent / 100);
  const perf = salary.monthly_wage * (salary.performance_bonus_percent / 100);
  const lta = salary.monthly_wage * (salary.lta_percent / 100);
  const standard = parseFloat(salary.standard_allowance) || 0;
  const fixed = salary.monthly_wage - (basic + hra + perf + lta + standard);

  return (
    <div className="component-row balancing-comp" style={{ background: fixed < 0 ? '#fff5f5' : '#f8f9fa' }}>
      <div className="component-info">
        <label>Fixed Allowance (Balancing)</label>
        <span className="calculated-value" style={{ color: fixed < 0 ? '#dc3545' : '#28a745' }}>₹ {fixed.toFixed(2)}</span>
        <p className="formula-text">Auto: Wage - All Components</p>
        {fixed < 0 && <p style={{color: '#dc3545', fontSize: '0.7rem', margin: 0}}>⚠️ Exceeds Wage!</p>}
      </div>
    </div>
  );
};

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [salary, setSalary] = useState(null);
  const [activeTab, setActiveTab] = useState('Private Info');
  const [isEditing, setIsEditing] = useState({ about: false, jobLove: false, interests: false });
  const [privateInfo, setPrivateInfo] = useState({});
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const userId = id || (profile ? profile.user_id : null);
    if (userId && (profile.role === 'Admin' || profile.role === 'Payroll Officer') && activeTab === 'Salary Info') {
      fetchSalary(userId);
      fetchTemplates();
    }
  }, [profile, activeTab, id]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      // If id is provided in URL, fetch that user, otherwise fetch 'me'
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

  const fetchSalary = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/salary/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalary(res.data);
      setSelectedTemplateId(res.data.template_id);
    } catch (err) {
      console.error('Failed to load salary info');
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/salary/templates/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(res.data);
    } catch (err) {
      console.error('Failed to load templates');
    }
  };

  const handleTemplateChange = (templateId) => {
    const selected = templates.find(t => t.id === parseInt(templateId));
    if (selected) {
      setSalary({
        ...salary,
        template_id: selected.id,
        template_name: selected.name,
        basic_percent: selected.basic_percent,
        hra_percent: selected.hra_percent,
        performance_bonus_percent: selected.performance_bonus_percent,
        lta_percent: selected.lta_percent,
        pf_percent: selected.pf_percent,
        standard_allowance: selected.standard_allowance,
        professional_tax: selected.professional_tax
      });
      setSelectedTemplateId(selected.id);
    }
  };

  const handleSalaryUpdate = async (updatedSalary) => {
    try {
      const token = localStorage.getItem('token');
      const userId = id || profile.user_id;
      await axios.put(`http://localhost:5000/api/salary/${userId}`, updatedSalary, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Salary updated');
    } catch (err) {
      toast.error('Failed to save salary');
    }
  };

  const handleUpdate = async (field, value) => {
    try {
      const token = localStorage.getItem('token');
      const updateData = field === 'all' ? value : { [field]: value };
      
      await axios.put('http://localhost:5000/api/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (field === 'all') {
        setProfile({ ...profile, ...value });
      } else {
        setProfile({ ...profile, [field]: value });
      }
      toast.success('Updated successfully');
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const addSkill = (type) => {
    const skill = prompt(`Enter new ${type === 'skills' ? 'skill' : 'certification'}:`);
    if (skill) {
      const currentList = Array.isArray(profile[type]) ? profile[type] : [];
      handleUpdate(type, [...currentList, skill]);
    }
  };

  if (loading) return <div className="loading">Loading Profile...</div>;
  if (!profile) return null;

  return (
    <div className="dashboard-layout">
      {/* Reusing Sidebar Styles */}
      <div className="sidebar">
        <div className="sidebar-logo" onClick={() => navigate('/dashboard')} style={{cursor: 'pointer'}}>
          {profile.company_logo ? (
            <img src={`http://localhost:5000${profile.company_logo}`} alt="Logo" />
          ) : (
            <div style={{ width: 40, height: 40, background: '#eee', borderRadius: '4px' }}></div>
          )}
          <span>{profile.company_name}</span>
        </div>
        <div className="sidebar-nav">
          <div className="nav-item" onClick={() => navigate('/dashboard')}>Dashboard</div>
          <div className="nav-item active">My Profile</div>
          <div className="nav-item">Attendance</div>
          <div className="nav-item">Payroll</div>
        </div>
      </div>

      <div className="main-area">
        <div className="top-header">
          <div className="header-left">
            <h2 style={{ fontSize: '1.2rem', color: '#333' }}>My Profile</h2>
          </div>
          <div className="header-right">
             <div className="profile-avatar" onClick={() => navigate('/dashboard')} title="Back to Dashboard">
               {profile.name.charAt(0).toUpperCase()}
             </div>
          </div>
        </div>

        <div className="dashboard-content" style={{ padding: '30px' }}>
          {/* Header Info Card */}
          <div className="profile-header-card">
             <div className="profile-pic-container">
                <div className="profile-pic-large">
                  {profile.name.charAt(0).toUpperCase()}
                  <div className="edit-overlay"><span role="img" aria-label="edit">✎</span></div>
                </div>
             </div>
             
             <div className="profile-main-info">
                <h1 style={{ margin: '0 0 10px 0', fontSize: '2.4rem' }}>{profile.name}</h1>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                   <div>
                      <p><strong>Login ID:</strong> {profile.login_id}</p>
                      <p><strong>Email:</strong> {profile.email}</p>
                      <p><strong>Mobile:</strong> {profile.phone || 'N/A'}</p>
                   </div>
                   <div>
                      <p><strong>Company:</strong> {profile.company_name}</p>
                      <p><strong>Department:</strong> {profile.department || 'Not Assigned'}</p>
                      <p><strong>Location:</strong> {profile.location || 'Remote'}</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Tabs */}
          <div className="profile-tabs">
             {['Resume', 'Private Info', 'Salary Info', 'Security'].map(tab => (
               <div 
                 key={tab} 
                 className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
                 onClick={() => setActiveTab(tab)}
               >
                 {tab}
               </div>
             ))}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
             {activeTab === 'Private Info' && (
               <div className="private-info-container">
                  <div className="private-info-grid">
                     {/* Left Column: Personal Info */}
                     <div className="info-column">
                        <h4 className="info-group-title">Personal Details</h4>
                        <div className="form-group-horizontal">
                           <label>Date of Birth</label>
                           <input type="date" value={privateInfo.dob ? privateInfo.dob.split('T')[0] : ''} onChange={(e) => setPrivateInfo({...privateInfo, dob: e.target.value})} />
                        </div>
                        <div className="form-group-horizontal">
                           <label>Residing Address</label>
                           <textarea value={privateInfo.residing_address || ''} onChange={(e) => setPrivateInfo({...privateInfo, residing_address: e.target.value})} rows="2" />
                        </div>
                        <div className="form-group-horizontal">
                           <label>Nationality</label>
                           <input type="text" value={privateInfo.nationality || ''} onChange={(e) => setPrivateInfo({...privateInfo, nationality: e.target.value})} />
                        </div>
                        <div className="form-group-horizontal">
                           <label>Personal Email</label>
                           <input type="email" value={privateInfo.personal_email || ''} onChange={(e) => setPrivateInfo({...privateInfo, personal_email: e.target.value})} />
                        </div>
                        <div className="form-group-horizontal">
                           <label>Gender</label>
                           <select value={privateInfo.gender || ''} onChange={(e) => setPrivateInfo({...privateInfo, gender: e.target.value})}>
                              <option value="">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                           </select>
                        </div>
                        <div className="form-group-horizontal">
                           <label>Marital Status</label>
                           <select value={privateInfo.marital_status || ''} onChange={(e) => setPrivateInfo({...privateInfo, marital_status: e.target.value})}>
                              <option value="">Select</option>
                              <option value="Single">Single</option>
                              <option value="Married">Married</option>
                           </select>
                        </div>
                        <div className="form-group-horizontal">
                           <label>Date of Joining</label>
                           <input type="text" value={profile.year_of_joining} disabled className="disabled-input" />
                        </div>
                     </div>

                     {/* Right Column: Bank Details */}
                     <div className="info-column">
                        <h4 className="info-group-title">Bank Details</h4>
                        <div className="form-group-horizontal">
                           <label>Account Number</label>
                           <input type="text" value={privateInfo.account_number || ''} onChange={(e) => setPrivateInfo({...privateInfo, account_number: e.target.value})} />
                        </div>
                        <div className="form-group-horizontal">
                           <label>Bank Name</label>
                           <input type="text" value={privateInfo.bank_name || ''} onChange={(e) => setPrivateInfo({...privateInfo, bank_name: e.target.value})} />
                        </div>
                        <div className="form-group-horizontal">
                           <label>IFSC Code</label>
                           <input type="text" value={privateInfo.ifsc_code || ''} onChange={(e) => setPrivateInfo({...privateInfo, ifsc_code: e.target.value})} />
                        </div>
                        <div className="form-group-horizontal">
                           <label>PAN No</label>
                           <input type="text" value={privateInfo.pan_no || ''} onChange={(e) => setPrivateInfo({...privateInfo, pan_no: e.target.value})} />
                        </div>
                        <div className="form-group-horizontal">
                           <label>UAN NO</label>
                           <input type="text" value={privateInfo.uan_no || ''} onChange={(e) => setPrivateInfo({...privateInfo, uan_no: e.target.value})} />
                        </div>
                        <div className="form-group-horizontal">
                           <label>Emp Code</label>
                           <input type="text" value={`EMP-${profile.login_id.split('-').pop()}`} disabled className="disabled-input" />
                        </div>
                        
                        <button className="btn" style={{ marginTop: '30px', width: '100%' }} onClick={() => handleUpdate('all', privateInfo)}>
                           Save Private Information
                        </button>
                     </div>
                  </div>

                  <hr style={{ margin: '40px 0', border: 'none', borderBottom: '1px solid #eee' }} />

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                    {/* The existing About/Skills sections go here, but I'll move them slightly below or keep them integrated */}
                    <div className="content-left">
                       <section className="profile-section">
                          <h3>About <span className="edit-btn" onClick={() => setIsEditing({...isEditing, about: !isEditing.about})}>✎</span></h3>
                          {isEditing.about ? (
                            <textarea 
                              defaultValue={profile.about_me} 
                              onBlur={(e) => { handleUpdate('about_me', e.target.value); setIsEditing({...isEditing, about: false}); }}
                              autoFocus
                            />
                          ) : (
                            <p>{profile.about_me || 'Tell us about yourself...'}</p>
                          )}
                       </section>

                       <section className="profile-section">
                          <h3>What I love about my job <span className="edit-btn" onClick={() => setIsEditing({...isEditing, jobLove: !isEditing.jobLove})}>✎</span></h3>
                          {isEditing.jobLove ? (
                            <textarea 
                              defaultValue={profile.job_love_description} 
                              onBlur={(e) => { handleUpdate('job_love_description', e.target.value); setIsEditing({...isEditing, jobLove: false}); }}
                              autoFocus
                            />
                          ) : (
                            <p>{profile.job_love_description || 'What makes your work exciting?'}</p>
                          )}
                       </section>

                       <section className="profile-section">
                          <h3>My interests and hobbies <span className="edit-btn" onClick={() => setIsEditing({...isEditing, interests: !isEditing.interests})}>✎</span></h3>
                          {isEditing.interests ? (
                            <textarea 
                              defaultValue={profile.interests_hobbies} 
                              onBlur={(e) => { handleUpdate('interests_hobbies', e.target.value); setIsEditing({...isEditing, interests: false}); }}
                              autoFocus
                            />
                          ) : (
                            <p>{profile.interests_hobbies || 'Share your passions outside work...'}</p>
                          )}
                       </section>
                    </div>

                    <div className="content-right">
                       <section className="profile-section">
                          <h3>Skills</h3>
                          <div className="tag-container">
                            {Array.isArray(profile.skills) && profile.skills.map((s, i) => (
                              <span key={i} className="tag">{s}</span>
                            ))}
                          </div>
                          <button className="btn-text" onClick={() => addSkill('skills')}>+ Add Skills</button>
                       </section>

                       <section className="profile-section" style={{ marginTop: '20px' }}>
                          <h3>Certification</h3>
                          <div className="tag-container">
                             {Array.isArray(profile.certifications) && profile.certifications.map((c, i) => (
                               <span key={i} className="tag tag-blue">{c}</span>
                             ))}
                          </div>
                          <button className="btn-text" onClick={() => addSkill('certifications')}>+ Add Certification</button>
                       </section>
                    </div>
                  </div>
               </div>
             )}

             {activeTab === 'Salary Info' && (profile.role === 'Admin' || profile.role === 'Payroll Officer') && (
               !salary ? (
                 <div className="loading">Loading Salary Configuration...</div>
               ) : (
                 <div className="salary-container">
                    {/* Executive Summary Card */}
                    <SalarySummary salary={salary} />

                    <div className="salary-header-grid">
                      <div className="salary-input-group">
                        <label>Monthly Wage (Base)</label>
                        <div className="input-with-label">
                          <input 
                            type="number" 
                            value={salary.monthly_wage} 
                            onChange={(e) => setSalary({...salary, monthly_wage: parseFloat(e.target.value) || 0})}
                          />
                          <span>/ Month</span>
                        </div>
                      </div>
                      <div className="salary-input-group">
                        <label>Select Template (Rules)</label>
                        <select 
                          value={selectedTemplateId || ''} 
                          onChange={(e) => handleTemplateChange(e.target.value)}
                          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                          {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="salary-input-group">
                        <label>Working Days/Week</label>
                        <input 
                          type="number" 
                          value={salary.working_days_per_week} 
                          onChange={(e) => setSalary({...salary, working_days_per_week: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    </div>

                    <hr style={{ margin: '30px 0', border: 'none', borderBottom: '1px solid #eee' }} />

                    <div className="salary-components-grid">
                      <div className="components-column">
                        <h4 className="info-group-title">1. Earnings (Monthly)</h4>
                        
                        <SalaryRow label="Basic Salary" value={salary.monthly_wage * (salary.basic_percent / 100)} rule={`${salary.basic_percent}% of Wage`} percent={salary.basic_percent} readOnly={true} />
                        
                        <SalaryRow label="House Rent Allowance (HRA)" value={(salary.monthly_wage * (salary.basic_percent / 100)) * (salary.hra_percent / 100)} rule={`${salary.hra_percent}% of Basic`} percent={salary.hra_percent} readOnly={true} />
                        
                        <SalaryRow label="Standard Allowance" value={parseFloat(salary.standard_allowance)} rule="Fixed Amount" isFixed amount={salary.standard_allowance} readOnly={true} />
                        
                        <SalaryRow label="Performance Bonus" value={salary.monthly_wage * (salary.performance_bonus_percent / 100)} rule={`${salary.performance_bonus_percent}% of Wage`} percent={salary.performance_bonus_percent} readOnly={true} />
                        
                        <SalaryRow label="Leave Travel Allowance (LTA)" value={salary.monthly_wage * (salary.lta_percent / 100)} rule={`${salary.lta_percent}% of Wage`} percent={salary.lta_percent} readOnly={true} />

                        <BalancingRow salary={salary} />
                      </div>

                      <div className="deductions-column">
                        <h4 className="info-group-title">2. Deductions</h4>
                        <SalaryRow label="Provident Fund (PF)" value={(salary.monthly_wage * (salary.basic_percent / 100)) * (salary.pf_percent / 100)} rule={`${salary.pf_percent}% of Basic`} percent={salary.pf_percent} readOnly={true} />

                        <SalaryRow label="Professional Tax" value={parseFloat(salary.professional_tax)} rule="Fixed Amount" isFixed amount={salary.professional_tax} readOnly={true} />
                        
                        <div style={{ marginTop: '50px' }}>
                          <button 
                            className="btn" 
                            style={{ width: '100%' }}
                            onClick={() => {
                              const basic = salary.monthly_wage * (salary.basic_percent / 100);
                              const hra = basic * (salary.hra_percent / 100);
                              const perf = salary.monthly_wage * (salary.performance_bonus_percent / 100);
                              const lta = salary.monthly_wage * (salary.lta_percent / 100);
                              const standard = parseFloat(salary.standard_allowance) || 0;
                              const fixed = salary.monthly_wage - (basic + hra + perf + lta + standard);
                              
                              if (fixed < 0) {
                                toast.error('Total components cannot exceed Monthly Wage');
                                return;
                              }
                              handleSalaryUpdate(salary);
                            }}
                          >
                            Apply Template & Update Salary
                          </button>
                        </div>
                      </div>
                    </div>
                 </div>
               )
             )}

             {activeTab === 'Salary Info' && !salary && profile.role === 'Employee' && (
               <div className="empty-state">
                 <h3>Salary Details</h3>
                 <p>This information is confidential and managed by the Payroll department.</p>
               </div>
             )}
             
             {activeTab === 'Resume' && (
               <div className="empty-state">
                 <h3>My Resume</h3>
                 <button className="btn">Upload Resume</button>
               </div>
             )}

             {activeTab === 'Security' && (
               <div className="empty-state">
                 <h3>Security Settings</h3>
                 <button className="btn" onClick={() => navigate('/change-password')}>Change Password</button>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
