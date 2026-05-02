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
import './index.css';

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/register" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
