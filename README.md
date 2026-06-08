# Tour Report Management System

A simple web app for submitting tour program details and approving them from an admin dashboard.

## Flow

- Employee opens the public tour form.
- Employee enters registered SAP ID and email.
- OTP is sent to the registered email.
- Employee verifies OTP, fills the tour form, and can save incomplete work as draft.
- Employee can edit draft or rejected reports.
- Approved reports are locked from editing.
- Grade, department, and destination are loaded from master tables to keep form data consistent.
- Data is stored in MySQL.
- Admin logs in using 8-digit SAP ID and password.
- Admin can filter reports by year, date range, and status.
- Admin can preview/download uploaded PDF/image files.
- Admin can approve or reject reports with a reason.

## Tables

| Table | Purpose |
|---|---|
| `admins` | Stores admin SAP ID and password. |
| `employees` | Stores allowed employee SAP ID, email, name, grade, department, and active/inactive status. |
| `employee_otps` | Stores OTP codes, expiry time, and usage status for employee login. |
| `master_grades` | Stores grade options used in the employee form. |
| `master_departments` | Stores department options used in the employee form. |
| `master_destinations` | Stores destination options used in the employee form. |
| `tour_reports` | Stores employee form details, tour details, approval note, and approval status. |
| `tour_supporting_documents` | Stores multiple supporting documents for a tour report. |

## Local Setup

Create database using:

```bash
mysql -u root -p < database/schema.sql
```

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Add an employee before testing employee OTP login:

```sql
INSERT INTO employees
(sap_id, name, email, designation, grade, department)
VALUES
('87654321', 'Tannu Sahu', 'tannu@example.com', 'Engineer', 'RS8', 'C & IT');
```
