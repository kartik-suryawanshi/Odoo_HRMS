import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const PayrollOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [costMode, setCostMode] = useState('Annually');
  const [countMode, setCountMode] = useState('Annually');

  const [showBankModal, setShowBankModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [payslips, setPayslips] = useState([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (activeTab === 'Dashboard') fetchStats();
    if (activeTab === 'Payrun') fetchPayslips();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/salary/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      toast.error('Failed to load payroll stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const now = new Date();
      const res = await axios.get(`http://localhost:5000/api/salary/admin/payslips?month=${now.getMonth() + 1}&year=${now.getFullYear()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayslips(res.data);
    } catch (err) {
      toast.error('Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayrun = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const now = new Date();
      await axios.post('http://localhost:5000/api/salary/generate-payrun', {
        month: now.getMonth() + 1,
        year: now.getFullYear()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payrun generated successfully');
      fetchPayslips();
    } catch (err) {
      toast.error('Failed to generate payrun');
    } finally {
      setGenerating(false);
    }
  };

  const handleValidatePayrun = async () => {
    try {
      const token = localStorage.getItem('token');
      const monthYear = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      await axios.post('http://localhost:5000/api/salary/validate-payrun', { monthYear }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payrun validated');
      fetchPayslips();
    } catch (err) {
      toast.error('Validation failed');
    }
  };

  if (loading && activeTab === 'Dashboard') return <div className="loading">Loading Payroll Dashboard...</div>;

  return (
    <div className="payroll-overview">
      <div className="payroll-top-nav" style={{ display: 'flex', gap: '30px', borderBottom: '1px solid #eee', marginBottom: '30px', paddingBottom: '10px' }}>
        <span 
          onClick={() => setActiveTab('Dashboard')}
          style={{ fontWeight: activeTab === 'Dashboard' ? '600' : '400', color: activeTab === 'Dashboard' ? '#7c3aed' : '#64748b', borderBottom: activeTab === 'Dashboard' ? '2px solid #7c3aed' : 'none', paddingBottom: '10px', cursor: 'pointer' }}
        >Dashboard</span>
        <span 
          onClick={() => setActiveTab('Payrun')}
          style={{ fontWeight: activeTab === 'Payrun' ? '600' : '400', color: activeTab === 'Payrun' ? '#7c3aed' : '#64748b', borderBottom: activeTab === 'Payrun' ? '2px solid #7c3aed' : 'none', paddingBottom: '10px', cursor: 'pointer' }}
        >Payrun</span>
        <span style={{ color: '#64748b', cursor: 'pointer' }}>Configuration</span>
      </div>

      {activeTab === 'Dashboard' && (
        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '25px' }}>
          {/* Warnings Card */}
          <div className="warning-card" style={{ background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #fee2e2', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#b91c1c' }}>Warning</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4338ca', fontWeight: '500', cursor: 'pointer' }}
                onClick={() => setShowBankModal(true)}
              >
                 <span style={{ color: '#ef4444' }}>●</span>
                 <span>{stats?.missingBankCount || 0} Employee without Bank A/c</span>
              </div>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4338ca', fontWeight: '500', cursor: 'pointer' }}
                onClick={() => setShowManagerModal(true)}
              >
                 <span style={{ color: '#ef4444' }}>●</span>
                 <span>{stats?.missingManagerCount || 0} Employee without Manager</span>
              </div>
            </div>
          </div>

          {/* Payrun Card */}
          <div className="payrun-card" style={{ background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>Payrun</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {stats?.payruns.map(run => (
                <div key={run.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#4338ca', marginBottom: '4px' }}>Payrun {run.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{run.count} Payslip generated</div>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>₹{parseFloat(run.employer_cost || 0).toLocaleString()}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Employer Cost</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>₹{parseFloat(run.gross || 0).toLocaleString()}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Gross</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>₹{parseFloat(run.net || 0).toLocaleString()}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Net</div>
                    </div>
                    <span style={{ 
                      background: run.status === 'Done' ? '#dcfce7' : '#fef3c7',
                      color: run.status === 'Done' ? '#166534' : '#92400e',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: '700'
                    }}>
                      {run.status}
                    </span>
                  </div>
                </div>
              ))}
              {stats?.payruns.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.9rem' }}>No payruns found. Go to the Payrun tab to generate one.</div>
              )}
            </div>
          </div>
          
          {/* Employer Cost Chart */}
          <div className="chart-container" style={{ background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Employer cost</h3>
              <div className="toggle-group" style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '20px' }}>
                <button 
                  onClick={() => setCostMode('Annually')}
                  style={{ border: 'none', padding: '5px 15px', borderRadius: '18px', fontSize: '0.75rem', cursor: 'pointer', background: costMode === 'Annually' ? 'white' : 'transparent', boxShadow: costMode === 'Annually' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
                >Annually</button>
                <button 
                  onClick={() => setCostMode('Monthly')}
                  style={{ border: 'none', padding: '5px 15px', borderRadius: '18px', fontSize: '0.75rem', cursor: 'pointer', background: costMode === 'Monthly' ? 'white' : 'transparent', boxShadow: costMode === 'Monthly' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
                >Monthly</button>
              </div>
            </div>
            <div style={{ height: '200px', width: '100%' }}>
              <ResponsiveContainer>
                <BarChart data={stats?.costData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Employee Count Chart */}
          <div className="chart-container" style={{ background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Employee count</h3>
              <div className="toggle-group" style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '20px' }}>
                <button 
                  onClick={() => setCountMode('Annually')}
                  style={{ border: 'none', padding: '5px 15px', borderRadius: '18px', fontSize: '0.75rem', cursor: 'pointer', background: countMode === 'Annually' ? 'white' : 'transparent', boxShadow: countMode === 'Annually' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
                >Annually</button>
                <button 
                  onClick={() => setCountMode('Monthly')}
                  style={{ border: 'none', padding: '5px 15px', borderRadius: '18px', fontSize: '0.75rem', cursor: 'pointer', background: countMode === 'Monthly' ? 'white' : 'transparent', boxShadow: countMode === 'Monthly' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
                >Monthly</button>
              </div>
            </div>
            <div style={{ height: '200px', width: '100%' }}>
              <ResponsiveContainer>
                <BarChart data={stats?.countData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Payrun' && (
        <div className="payrun-view">
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
            <button 
              className="btn" 
              onClick={handleGeneratePayrun}
              disabled={generating}
              style={{ background: '#7c3aed' }}
            >
              {generating ? 'Generating...' : 'Payrun'}
            </button>
            <button 
              className="btn" 
              onClick={handleValidatePayrun}
              style={{ background: '#e2e8f0', color: '#475569' }}
            >
              Validate
            </button>
          </div>

          <div className="payroll-table-container">
            <table className="payroll-table">
              <thead>
                <tr>
                  <th>Pay Period</th>
                  <th>Employee</th>
                  <th>Employer Cost</th>
                  <th>Basic Wage</th>
                  <th>Gross Wage</th>
                  <th>Net Wage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map(ps => (
                  <tr key={ps.id}>
                    <td>{ps.month_year}</td>
                    <td style={{ fontWeight: 600 }}>
                      <a href={`/payslip/${ps.id}`} style={{ color: '#7c3aed', textDecoration: 'none' }}>
                        {ps.employee_name}
                      </a>
                    </td>
                    <td>₹{parseFloat(ps.employer_cost).toLocaleString()}</td>
                    <td>₹{parseFloat(ps.basic_wage).toLocaleString()}</td>
                    <td>₹{parseFloat(ps.gross_wage).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>₹{parseFloat(ps.net_wage).toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${ps.status.toLowerCase()}`} style={{ 
                        background: ps.status === 'Done' ? '#dcfce7' : '#fef3c7',
                        color: ps.status === 'Done' ? '#166534' : '#92400e',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {ps.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {payslips.length === 0 && !loading && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No payslips generated for this month. Click 'Payrun' to generate.</td></tr>
                )}
                {loading && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Loading payslips...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Missing Bank Account Modal */}
      {showBankModal && (
        <div className="modal-overlay" onClick={() => setShowBankModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
            <button className="modal-close" onClick={() => setShowBankModal(false)}>×</button>
            <h3 style={{ color: '#b91c1c', marginBottom: '20px' }}>Employees without Bank Account</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="payroll-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.missingBankEmployees?.map(emp => (
                    <tr key={emp.id}>
                      <td>{emp.login_id}</td>
                      <td style={{ fontWeight: 600 }}>{emp.name}</td>
                      <td>
                         <button 
                           className="btn-text" 
                           onClick={() => window.location.href = `/profile`} 
                           style={{ fontSize: '0.75rem' }}
                         >
                           Set Account
                         </button>
                      </td>
                    </tr>
                  ))}
                  {stats?.missingBankEmployees?.length === 0 && (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>All employees have bank accounts!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Missing Manager Modal */}
      {showManagerModal && (
        <div className="modal-overlay" onClick={() => setShowManagerModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
            <button className="modal-close" onClick={() => setShowManagerModal(false)}>×</button>
            <h3 style={{ color: '#b91c1c', marginBottom: '20px' }}>Employees without Manager</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="payroll-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.missingManagerEmployees?.map(emp => (
                    <tr key={emp.id}>
                      <td>{emp.login_id}</td>
                      <td style={{ fontWeight: 600 }}>{emp.name}</td>
                      <td>
                         <button 
                           className="btn-text" 
                           onClick={() => window.location.href = `/employees`}
                           style={{ fontSize: '0.75rem' }}
                         >
                           Assign Manager
                         </button>
                      </td>
                    </tr>
                  ))}
                  {stats?.missingManagerEmployees?.length === 0 && (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>All employees have assigned managers!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollOverview;
