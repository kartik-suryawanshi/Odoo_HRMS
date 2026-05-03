import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';

const Attendance = () => {
  const { currentUser } = useOutletContext();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAdminAttendance();
  }, [targetDate]);

  const fetchAdminAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/attendance/all?date=${targetDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load daily attendance');
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (decimalHours) => {
    if (!decimalHours) return '-';
    const totalMinutes = Math.round(parseFloat(decimalHours) * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDateNav = (days) => {
    const d = new Date(targetDate);
    d.setDate(d.getDate() + days);
    setTargetDate(d.toISOString().split('T')[0]);
  };

  if (loading && data.length === 0) return <div className="loading">Loading Monitoring Data...</div>;

  return (
    <div className="attendance-page">
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#1e293b', fontWeight: '800' }}>Team Monitoring</h2>
        <p style={{ color: '#64748b', marginTop: '8px' }}>Daily oversight of employee check-ins and working hours.</p>
      </div>

      <div className="attendance-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="nav-arrows">
            <button className="arrow-btn" onClick={() => handleDateNav(-1)}>{'<'}</button>
            <button className="arrow-btn" onClick={() => handleDateNav(1)}>{'>'}</button>
          </div>
          <div className="date-display">
            <strong>{new Date(targetDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            <span style={{ marginLeft: '10px', color: '#64748b' }}>Day View</span>
          </div>
        </div>

        <div className="search-wrapper" style={{ flex: 1, maxWidth: '400px', marginLeft: '30px' }}>
          <input type="text" placeholder="Search employees..." className="search-input" />
        </div>
      </div>

      <div className="attendance-table-card card">
        <table className="payroll-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Work Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No attendance records found for this date.
                </td>
              </tr>
            ) : (
              data.map((log, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{log.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.role}</span>
                    </div>
                  </td>
                  <td>{formatTime(log.check_in_time)}</td>
                  <td>{formatTime(log.check_out_time)}</td>
                  <td>{formatHours(log.total_hours)}</td>
                  <td>
                    <span className={`tag ${log.check_in_time ? 'tag-green' : 'tag-gray'}`}>
                      {log.check_in_time ? 'Present' : 'Absent'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Attendance;
