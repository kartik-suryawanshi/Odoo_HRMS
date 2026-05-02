/**
 * File: frontend/src/main.jsx
 * Purpose: Entry point for the React frontend application.
 * What it does: Renders the root App component into the DOM.
 * Data Fetching: N/A.
 * Data Sending: N/A.
 * External Dependencies: react, react-dom.
 * Environment Variables Required: N/A.
 * Related Files: frontend/src/App.jsx, frontend/src/index.css
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
