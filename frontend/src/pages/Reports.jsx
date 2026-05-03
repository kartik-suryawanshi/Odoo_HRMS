import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Reports.css';

const Reports = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
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
      toast.error('Failed to load employees');
    }
  };

  const handlePrint = async () => {
    if (!selectedEmployee) return toast.error('Please select an employee');
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/salary/statement/${selectedEmployee}?year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(res.data);
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-container">
      <div className="report-config-card no-print">
        <div className="report-header-row">
          <h3 className="report-title-main">Salary Statement Report</h3>
          <button className="btn-print-top" onClick={handlePrint} disabled={loading}>
            {loading ? 'Generating...' : 'Print'}
          </button>
        </div>
        
        <div className="report-divider"></div>

        <div className="report-form">
          <div className="report-form-group">
            <label>Employee Name :</label>
            <div className="select-wrapper">
              <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="report-form-group">
            <label>Year</label>
            <div className="select-wrapper">
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {reportData && (
        <div className="report-print-view only-print">
          <div className="print-header">
            <h1 className="report-title">Salary Statement Report Print</h1>
            <div className="company-name">{reportData.company}</div>
            <h2 className="statement-subtitle">Salary Statement Report</h2>
          </div>

          <div className="employee-info-grid">
            <div className="info-item">
              <label>Employee Name</label>
              <span>{reportData.employee.name}</span>
            </div>
            <div className="info-item">
              <label>Date Of Joining</label>
              <span>{reportData.employee.joining_date ? new Date(reportData.employee.joining_date).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Designation</label>
              <span>{reportData.employee.designation}</span>
            </div>
            <div className="info-item">
              <label>Salary Effective From</label>
              <span>{reportData.employee.effective_from ? new Date(reportData.employee.effective_from).toLocaleDateString() : `01/01/${selectedYear}`}</span>
            </div>
          </div>

          <table className="statement-table">
            <thead>
              <tr>
                <th>Salary Components</th>
                <th className="text-right">Monthly Amount</th>
                <th className="text-right">Yearly Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="category-row">
                <td colSpan="3">Earnings</td>
              </tr>
              {reportData.monthly.earnings.map((e, idx) => (
                <tr key={idx}>
                  <td>{e.name}</td>
                  <td className="text-right">₹ {e.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td className="text-right">₹ {reportData.yearly.earnings[idx].amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
              ))}
              
              <tr className="category-row" style={{ marginTop: '20px' }}>
                <td colSpan="3">Deduction</td>
              </tr>
              {reportData.monthly.deductions.map((d, idx) => (
                <tr key={idx}>
                  <td>{d.name}</td>
                  <td className="text-right">₹ {d.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td className="text-right">₹ {reportData.yearly.deductions[idx].amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td>Net Salary</td>
                <td className="text-right">₹ {reportData.monthly.summary.net_salary.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td className="text-right">₹ {reportData.yearly.summary.net_salary.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;
