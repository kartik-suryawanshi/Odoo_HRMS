# EmPay – Smart Human Resource Management System

EmPay is a robust, enterprise-grade HRMS (Human Resource Management System) designed to handle complex payroll logic, secure attendance tracking, and multi-role administrative workflows. Built with a modern tech stack, it prioritizes data integrity, role-based security, and a premium user experience.

---

## 🚀 Key Features

### 1. **Grade-Based Payroll Engine (ERP Standard)**
*   **Dynamic Grade Library**: Create and manage salary grades (e.g., Grade A, Senior Lead) with distinct base wages.
*   **Salary Template Library**: Define complex earning and deduction rules (HRA, PF, Tax, Allowance) using percentage-based or flat-rate formulas.
*   **Automatic Calculation**: Real-time computation of Net Salary based on payable days, grade rules, and templates.
*   **Payslip Generation**: Detailed breakdown of earnings and deductions with PDF export capabilities.

### 2. **Hardened Attendance Integrity (Heartbeat System)**
*   **Anti-Cheat Protection**: Implemented a server-side "Heartbeat" mechanism. Instead of relying on spoofable client-side timestamps, the system pings the server every 5 minutes to verify active presence.
*   **Pulse-Based Hours**: Working hours are calculated based on verified pulses, making it immune to system clock manipulation or timezone jumping.
*   **Active Session Locking**: Prevents multiple check-ins and ensures session finalization upon logout.

### 3. **Granular Role-Based Access Control (RBAC)**
*   **Admin**: Full system control, company configuration, and user management.
*   **HR Officer**: Employee lifecycle management, reporting, and attendance oversight.
*   **Payroll Officer**: Specialized access to Salary Templates, Grade Libraries, and Payrun validation.
*   **Employee**: Personal profile management, payslip viewing, and attendance tracking.

### 4. **Scalable Architecture & Data Isolation**
*   **Company Isolation**: Multi-tenant structure where each company (e.g., Atlas Copco, Odoo India) has its own isolated ecosystem of employees and configurations.
*   **Performance Ready**: Seeding scripts capable of populating 600+ records with full attendance history for stress testing.

---

## 🛠️ Tech Stack

*   **Frontend**: React.js, React Router, Axios, React Hot Toast.
*   **Backend**: Node.js, Express.js.
*   **Database**: PostgreSQL (Relational schema for complex ERP relations).
*   **Security**: JWT (JSON Web Tokens), Bcryptjs (Password hashing), Role-based Middlewares.
*   **Styling**: Premium Vanilla CSS (custom design system, no generic UI libraries).

---

## 📥 Installation & Setup

### 1. Prerequisites
*   Node.js (v16+)
*   PostgreSQL (v14+)

### 2. Environment Configuration
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
DATABASE_URL=postgres://your_user:your_password@localhost:5432/empay_db
JWT_SECRET=your_secure_secret
```

### 3. Database Initialization
Run the schema setup and initialization scripts:
```powershell
# In the backend directory
node scripts/initHeartbeats.js
node setupGradeSystem.js
node scripts/seedLargeData.js  # Optional: Seed 600 users for testing
```

### 4. Running the Application
```powershell
# Start Backend (from /backend)
npm install
npm start

# Start Frontend (from /frontend)
npm install
npm start
```

---

## 🧪 Testing Performance
The system is pre-configured with a performance testing script:
1. Run `node backend/scripts/seedLargeData.js` to create 600 unique employees under the "Atlas Copco" company.
2. Log in as an Admin to test the **Search Hub** and **Reporting Dashboards** under high-volume data conditions.

---

## 📜 Database Schema Summary
*   `users`: Core authentication and role data.
*   `user_profiles`: Detailed employee info (Personal, Bank, Job position).
*   `companies`: Tenant isolation data.
*   `attendance_logs`: Session records and total hour aggregation.
*   `attendance_heartbeats`: 5-minute verified presence markers.
*   `salary_templates` & `grades`: Payroll configuration engine.

---

© 2026 EmPay HRMS – Hardening Access & Attendance Integrity.
