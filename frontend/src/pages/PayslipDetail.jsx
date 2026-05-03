import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import './PayslipDetail.css';

const PayslipDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Worked Days');
  const printRef = useRef();

  useEffect(() => {
    fetchPayslip();
  }, [id]);

  const fetchPayslip = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/salary/payslip/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load payslip details');
      navigate('/payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/salary/validate-payrun', { monthYear: data.payslip.month_year }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payslip validated');
      fetchPayslip();
    } catch (err) {
      toast.error('Validation failed');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="loading">Loading Payslip Details...</div>;
  if (!data) return <div>No data found</div>;

  const { payslip, breakdown } = data;

  return (
    <div className="payslip-detail-container">
      {/* Header Buttons */}
      <div className="payslip-header-actions no-print">
        <button className="btn btn-purple">New Payslip</button>
        <button className="btn btn-purple-light" onClick={fetchPayslip}>Compute</button>
        <button className="btn btn-gray" onClick={handleValidate} disabled={payslip.status === 'Done'}>Validate</button>
        <button className="btn btn-gray">Cancel</button>
        <button className="btn btn-gray" onClick={handlePrint}>Print</button>
      </div>

      <div className="payslip-main-card" ref={printRef}>
        {/* Profile Section */}
        <div className="payslip-profile-header">
          <h1 className="employee-name-title">[{payslip.employee_name}]</h1>
          <div className="profile-info-grid">
            <div className="info-item">
              <label>Payrun</label>
              <span className="link-text">Payrun {payslip.month_year}</span>
            </div>
            <div className="info-item">
              <label>Salary Structure</label>
              <span className="link-text">{payslip.structure_name || 'Regular Pay'}</span>
            </div>
            <div className="info-item">
              <label>Period</label>
              <span>01 {payslip.month_year.split(' ')[0]} To {new Date(payslip.month_year.split(' ')[1], new Date(Date.parse(payslip.month_year.split(' ')[0] + " 1, 2022")).getMonth() + 1, 0).getDate()} {payslip.month_year.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="payslip-tabs no-print">
          <button 
            className={`tab-btn ${activeTab === 'Worked Days' ? 'active' : ''}`}
            onClick={() => setActiveTab('Worked Days')}
          >Worked Days</button>
          <button 
            className={`tab-btn ${activeTab === 'Salary Computation' ? 'active' : ''}`}
            onClick={() => setActiveTab('Salary Computation')}
          >Salary Computation</button>
        </div>

        <div className="tab-content">
          {activeTab === 'Worked Days' ? (
            <div className="worked-days-view">
              <table className="breakdown-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Days</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Attendance</td>
                    <td>{breakdown.summary.present_days}.00 (5 working days in week)</td>
                    <td>₹ {((breakdown.summary.base_wage / breakdown.summary.total_working_days) * breakdown.summary.present_days).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  </tr>
                  <tr>
                    <td>Paid Time off</td>
                    <td>{breakdown.summary.paid_leave_days}.00 ({breakdown.summary.paid_leave_days} Paid leaves/Month)</td>
                    <td>₹ {((breakdown.summary.base_wage / breakdown.summary.total_working_days) * breakdown.summary.paid_leave_days).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  </tr>
                  {breakdown.summary.absences > 0 && (
                    <tr style={{ color: '#ef4444' }}>
                      <td>Unpaid Absence</td>
                      <td>{breakdown.summary.absences}.00 (Deducted)</td>
                      <td>- ₹ {((breakdown.summary.base_wage / breakdown.summary.total_working_days) * breakdown.summary.absences).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td></td>
                    <td>{breakdown.summary.total_working_days}.00</td>
                    <td>₹ {breakdown.summary.actual_wage.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  </tr>
                </tfoot>
              </table>
              <p className="logic-desc">
                Salary is calculated based on the employee's monthly attendance. Paid leaves are included in the total payable days, while unpaid leaves are deducted from the salary.
              </p>
            </div>
          ) : (
            <div className="salary-computation-view">
              <table className="breakdown-table">
                <thead>
                  <tr>
                    <th>Rule Name</th>
                    <th>Rate %</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.earnings.map((e, i) => (
                    <tr key={i}>
                      <td>{e.name}</td>
                      <td>100</td>
                      <td>₹ {e.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    </tr>
                  ))}
                  <tr className="subtotal-row">
                    <td><strong>Gross</strong></td>
                    <td>100</td>
                    <td><strong>₹ {breakdown.summary.gross.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></td>
                  </tr>
                  {breakdown.deductions.map((d, i) => (
                    <tr key={i}>
                      <td>{d.name}</td>
                      <td>100</td>
                      <td>- ₹ {d.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="net-total-row">
                    <td><strong>Net Amount</strong></td>
                    <td>100</td>
                    <td><strong>₹ {breakdown.summary.net_salary.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Print Layout (Hidden on screen usually, but here we'll use media queries) */}
        <div className="print-only-layout">
           <div className="print-header">
              <div className="company-logo-placeholder">[Company Logo]</div>
              <div className="swift-seal">Swift Seal</div>
           </div>
           <h2 className="print-title">Salary slip for month of {payslip.month_year}</h2>
           
           <div className="print-info-box">
              <div className="info-col">
                <p><strong>Employee name :</strong> {payslip.employee_name}</p>
                <p><strong>Employee Code :</strong> {payslip.login_id}</p>
                <p><strong>Department :</strong> {payslip.department || 'N/A'}</p>
                <p><strong>Location :</strong> {payslip.location || 'N/A'}</p>
                <p><strong>Date of joining :</strong> {payslip.date_of_joining ? new Date(payslip.date_of_joining).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="info-col">
                <p><strong>PAN :</strong> {payslip.pan_no || 'N/A'}</p>
                <p><strong>UAN :</strong> {payslip.uan_no || 'N/A'}</p>
                <p><strong>Bank A/c NO. :</strong> {payslip.account_number || 'N/A'}</p>
                <p><strong>Pay period :</strong> 01/{payslip.month_year} to {new Date(payslip.month_year.split(' ')[1], new Date(Date.parse(payslip.month_year.split(' ')[0] + " 1, 2022")).getMonth() + 1, 0).getDate()}/{payslip.month_year}</p>
                <p><strong>Pay date :</strong> {new Date().toLocaleDateString()}</p>
              </div>
           </div>

           <div className="print-table-section">
              <div className="print-table-header">Worked Days <span>Number of Days</span></div>
              <div className="print-table-row">Attendance <span>{breakdown.summary.present_days} Days</span></div>
              <div className="print-table-row">Paid Time Off <span>{breakdown.summary.paid_leave_days} Days</span></div>
              {breakdown.summary.absences > 0 && (
                <div className="print-table-row" style={{ color: '#ef4444' }}>Unpaid Absence <span>{breakdown.summary.absences} Days</span></div>
              )}
              <div className="print-table-row total">Total <span>{breakdown.summary.total_working_days} Days</span></div>
           </div>

           <div className="print-computation-grid">
              <div className="comp-col">
                <div className="comp-header">Earnings <span>Amounts</span></div>
                {breakdown.earnings.map((e, i) => (
                  <div key={i} className="comp-row">{e.name} <span>₹ {e.amount.toFixed(2)}</span></div>
                ))}
                <div className="comp-row total">Gross <span>₹ {breakdown.summary.gross.toFixed(2)}</span></div>
              </div>
              <div className="comp-col">
                <div className="comp-header">Deductions <span>Amounts</span></div>
                {breakdown.deductions.map((d, i) => (
                  <div key={i} className="comp-row">{d.name} <span>- ₹ {d.amount.toFixed(2)}</span></div>
                ))}
              </div>
           </div>

           <div className="print-footer">
              <div className="net-payable-box">
                Total Net Payable <span>(Gross Earning - Total deductions)</span>
              </div>
              <div className="net-amount-display">
                <div className="amount-val">{breakdown.summary.net_salary.toFixed(2)}</div>
                <div className="amount-words">[Amount in words] only</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PayslipDetail;
