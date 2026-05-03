/**
 * File: frontend/src/components/Layout.jsx
 * Purpose: Persistent layout wrapper with global user context.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedInTime, setCheckedInTime] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchCurrentStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/profile/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to load layout profile');
    }
  };

  const fetchCurrentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/attendance/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'checked_in') {
        setCheckedIn(true);
        setCheckedInTime(res.data.log.check_in_time);
      } else {
        setCheckedIn(false);
        setCheckedInTime(null);
      }
    } catch (err) {
      console.error('Failed to fetch status', err);
    }
  };

  const handleCheckIn = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/attendance/check-in', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCheckedIn(true);
      setCheckedInTime(res.data.log.check_in_time);
      toast.success('Checked IN successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/attendance/check-out', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCheckedIn(false);
      setCheckedInTime(null);
      toast.success('Checked OUT successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check out');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Time Off', path: '/time-off' },
    { name: 'My Profile', path: '/profile' },
  ];

  if (profile?.role === 'Admin' || profile?.role === 'HR Officer' || profile?.role === 'Payroll Officer') {
    menuItems.splice(1, 0, { name: 'Employees', path: '/employees' }); 
    menuItems.splice(2, 0, { name: 'Attendance', path: '/attendance' }); 
  }

  if (profile?.role === 'Admin' || profile?.role === 'Payroll Officer') {
    menuItems.splice(3, 0, { name: 'Payroll', path: '/payroll' });
  }

  if (profile?.role === 'Admin') {
    menuItems.push({ name: 'Reports', path: '/reports' });
    menuItems.push({ name: 'Settings', path: '/settings' });
  }

  return (
    <div className="dashboard-layout">
      <div className="sidebar no-print">
        <div className="sidebar-logo" onClick={() => navigate('/dashboard')} style={{cursor: 'pointer'}}>
          {profile?.company_logo ? (
            <img src={`http://localhost:5000${profile.company_logo}`} alt="Logo" />
          ) : (
            <div style={{ width: 40, height: 40, background: '#eee', borderRadius: '4px' }}></div>
          )}
          <span>{profile?.company_name || 'EmPay'}</span>
        </div>
        <div className="sidebar-nav">
          {menuItems.map(item => (
            <div 
              key={item.path} 
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.name}
            </div>
          ))}
        </div>
      </div>

      <div className="main-area">
        <div className="top-header no-print">
          <div className="header-left">
             <h2 style={{ fontSize: '1.2rem', color: '#333', margin: 0 }}>
                {menuItems.find(i => i.path === (location.pathname.startsWith('/employee') ? '/dashboard' : location.pathname))?.name || 'Management'}
             </h2>
          </div>
          
          <div className="header-right">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span 
                className={`status-indicator ${checkedIn ? 'status-green' : 'status-red'}`} 
                style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowProfileDropdown(false); }}
              ></span>
              
              {showStatusDropdown && (
                <div className="profile-dropdown" style={{ top: '35px', right: '-10px', width: '220px' }}>
                  <div className="systray" style={{ padding: '15px' }}>
                    <button className="btn-outline" onClick={() => { handleCheckIn(); setShowStatusDropdown(false); }} disabled={checkedIn} style={{width: '100%', marginBottom: '10px'}}>
                      Check IN →
                    </button>
                    <p style={{ fontSize: '0.75rem', color: '#666', textAlign: 'center', margin: '5px 0' }}>
                      {checkedIn && checkedInTime ? `Since ${new Date(checkedInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Not checked in'}
                    </p>
                    <button className="btn-outline" onClick={() => { handleCheckOut(); setShowStatusDropdown(false); }} disabled={!checkedIn} style={{width: '100%'}}>
                      Check Out →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ position: 'relative', marginLeft: '15px' }}>
              <div 
                className="profile-avatar" 
                onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowStatusDropdown(false); }}
              >
                {profile?.name?.charAt(0).toUpperCase()}
              </div>

              {showProfileDropdown && (
                <div className="profile-dropdown" style={{ top: '35px', right: 0 }}>
                  <div className="dropdown-item" onClick={() => { setShowProfileDropdown(false); navigate('/profile'); }}>My Profile</div>
                  <div className="dropdown-item" onClick={handleLogout} style={{ color: '#dc3545' }}>Log Out</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-content" style={{ padding: '30px' }}>
          <Outlet context={{ checkedIn, currentUser: profile }} />
        </div>
      </div>
    </div>
  );
};

export default Layout;
