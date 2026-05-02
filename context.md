# EmPay – Smart Human Resource Management System

## Vision & Mission
EmPay aims to modernize and simplify how organizations manage people, processes, and payroll through a comprehensive, all-in-one Human Resource Management System (HRMS). The platform provides a clean, reliable, and user-friendly experience for both employees and administrators—enabling seamless collaboration in managing attendance, leave, payroll, and analytics from a unified interface. It targets startups, institutions, and SMEs to reduce manual dependency, improve transparency, and empower organizations to make informed, data-driven workforce decisions.

## Problem Statement
Develop a working HRMS system focusing on specific modules and workflows: User & Role Management, Attendance & Leave Management, Payroll Management, and Dashboard & Analytics. The system must enforce role-based access controls and manage data dependencies across modules (e.g., Employees -> Attendance -> Payroll).

## Phase-Wise Implementation Plan (Derived from Requirements & Mockup Flow)

### Phase 1: Authentication & Authorization (Login & Roles)
- **Login & Registration**: Secure user registration and login functionality.
- **Role Routing**: The system identifies the user as Admin, Employee, HR Officer, or Payroll Officer upon login and redirects them to the appropriate role-based dashboard.

### Phase 2: Dashboard Layout & Analytics
- **Global Navigation**: Sidebar containing links to Dashboard, Employees, Attendance, Time Off, Payroll, and Settings.
- **Metric Cards & Analytics**: Visual display (charts/summaries) of attendance, leaves, and payroll metrics.
- **Admin/HR Overview**: High-level overview of employee data and overall HR statistics.

### Phase 3: User & Employee Directory (Management)
- **Employee Roster**: List view displaying all employees with their basic details and status.
- **Profile Management**: Editable forms for creating, reading, updating, and deleting employee records.
- **Access Limits**: Employees can view the directory but not modify profiles; HR/Admin manage the profiles.

### Phase 4: Attendance Tracking
- **Check-In/Out**: Functionality for employees to mark their daily attendance.
- **Attendance Logs**: Views for tracking personal daily/monthly logs.
- **Global Monitoring**: HR Officers and Admins can monitor the attendance records of all employees.

### Phase 5: Time-Off (Leave) Management
- **Leave Application**: Employees can request time off and check their approval status.
- **Leave Workflows**: Approval and rejection workflows managed by Payroll Officers and HR.
- **Leave Allocation**: HR Officers can allocate new leave balances to employees.

### Phase 6: Payroll processing & Compensation
- **Salary Computation**: Calculations based on attendance records, working hours, basic wage, and approved leaves for the given pay period (Payrun).
- **Deductions Engine**: Automatic calculation of Provident Fund (PF) (e.g., 12% of basic) and Professional Tax.
- **Payslip Generation**: Generating and viewing detailed breakdowns of earnings, deductions, and net pay.
- **Reports**: Option for Admin/Payroll Officer to generate or edit monthly reports and payslips.

## Roles & Responsibilities

1. **Admin**
   - Register on the portal and manage user accounts.
   - Create, read, update, and delete data across all modules.
   - Manage user roles in settings.
   - Oversee all activities and ensure smooth system operations.
   - *Permissions*: No access limitations.

2. **Employee**
   - Apply for time off and see time-off status.
   - View personal attendance and performance records.
   - Access the employee directory and view individual records (read-only).
   - *Restrictions*: Cannot access settings, payroll, reports, or salary info.

3. **HR Officer**
   - Create and update employee profiles and details.
   - Monitor attendance records of all employees.
   - Manage & allocate new leaves to employees.
   - *Restrictions*: Cannot access payroll data or system settings.

4. **Payroll Officer**
   - Approve or reject time-off requests.
   - Generate payslip and leave reports.
   - Manage Payroll, Time Off, and Reports.
   - Can access attendance logs.
   - *Restrictions*: Cannot create or modify employee data or access system settings (except for managing salary-related information).

## Key Terminologies

- **Payroll**: The process of calculating and distributing employee salaries, wages, bonuses, and deductions based on attendance records.
- **Payrun**: A specific payroll cycle/period where salaries are processed based on attendance, approved leaves, and applicable deductions.
- **Payslip**: Official document showing a detailed breakdown of earnings, deductions, and net pay, generated automatically once payroll is processed.
- **Time-Off**: Official absence from work (e.g., vacation, sick leave). Approved time-offs are factored into payroll.
- **Wage**: Monetary compensation calculated based on attendance, working hours, and approved leaves.
- **Provident Fund (PF) Contribution**: Retirement benefit where employee and employer contribute a fixed percentage (commonly 12%) of the basic salary.
- **Professional Tax**: Monthly tax levied by the state government, deducted directly from the gross salary.

## Reference Materials
- **UI/UX Mockups**: [Excalidraw Link](https://link.excalidraw.com/l/65VNwvy7c4X/7gxoB8JymIS)
