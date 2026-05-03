/**
 * File: frontend/src/App.jsx
 * Purpose: Main application component and routing configuration.
 * What it does: Sets up the React Router with paths to /login and /register.
 *               Acts as the root container for the application's UI.
 * Data Fetching: N/A - Handles client-side routing.
 * Data Sending: N/A.
 * External Dependencies: react-router-dom.
 * Environment Variables Required: N/A.
 * Related Files: frontend/src/pages/SignIn.jsx, frontend/src/pages/SignUp.jsx
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import ChangePassword from './pages/ChangePassword';
import Profile from './pages/Profile';
import PayrollDashboard from './pages/PayrollDashboard';
import SalaryTemplates from './pages/SalaryTemplates';
import Grades from './pages/Grades';
import Attendance from './pages/Attendance';
import TimeOff from './pages/TimeOff';
import PayrollOverview from './pages/PayrollOverview';
import Settings from './pages/Settings';
import PayslipDetail from './pages/PayslipDetail';
import Reports from './pages/Reports';
import './index.css';

import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/register" element={<SignUp />} />
          
          {/* Authenticated Routes wrapped in Layout */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/employee/:id" element={<Profile />} />
            <Route path="/payroll" element={<PayrollOverview />} />
            <Route path="/employees" element={<PayrollDashboard />} />
            <Route path="/salary-templates" element={<SalaryTemplates />} />
            <Route path="/grades" element={<Grades />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/time-off" element={<TimeOff />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/payslip/:id" element={<PayslipDetail />} />
          </Route>

          <Route path="/change-password" element={<ChangePassword />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
