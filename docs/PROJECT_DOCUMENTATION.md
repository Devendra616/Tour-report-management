# Tour Report Management System Documentation

## 1. Project Overview

The Tour Report Management System is a web-based application used to create, submit, review, approve, and reject tour reports. It supports employee-submitted tour reports as well as department-submitted reports created on behalf of employees or other persons.

The system helps maintain a structured workflow for official tours, medical self tours, and medical escort duty tours. It also keeps uploaded approval notes and supporting documents linked with each report.

## 2. Problem Statement

In many organizations, tour report work is handled through paper forms, emails, manual approvals, and separate file storage. This creates several problems:

- Employees may not know the current status of their submitted tour report.
- Admin users may need to search through emails or physical documents to find report details.
- Uploaded approval notes and supporting documents can become difficult to track.
- Rejection reasons may not be recorded clearly.
- Duplicate, incomplete, or incorrectly filled reports can be hard to control.
- Report filtering, exporting, and reviewing can take more time when data is not stored in one system.
- Department users may need a controlled way to submit reports on behalf of employees or other persons.

This project is required to solve these problems by keeping the complete tour report process in one centralized system. It makes report submission, document upload, admin approval, rejection tracking, and report filtering easier, faster, and more organized.

## 3. Why This Project Is Useful

The project is useful because it provides:

- A single place to submit and manage tour reports.
- OTP-based employee login for safer employee access.
- Separate admin and department access based on user role.
- Draft saving so users do not lose incomplete work.
- Clear report statuses such as Draft, Pending, Approved, and Rejected.
- File upload support for approval notes and supporting documents.
- Email notifications for OTP, approval, and rejection.
- Admin filters and export options for easier reporting.
- MySQL database storage for structured and searchable records.

## 4. Simple Explanation for New Users

This system works like an online tour report register.

An employee logs in, fills a tour form, uploads the required approval note and documents, and submits the report. The report then goes to the admin dashboard. The admin checks the report and either approves it or rejects it with a reason. If rejected, the user can correct the report and submit it again.

A department user can also log in and submit a report for their department. The admin can see all submitted reports, filter them, check documents, and export report data when needed.

## 5. Main Users

The project has three main user types:

| User Type | Login Method | Main Access |
|---|---|---|
| Employee | SAP ID, email, and OTP | Fill and submit their own tour report |
| Department User | User ID and password | Fill tour reports for a department |
| Admin User | User ID and password | Review, approve, reject, filter, and export reports |

## 6. Main Features

- Employee OTP-based login using registered SAP ID and email.
- Department login using user ID and password.
- Admin login using user ID and password.
- Employee and department tour report form.
- Draft saving for incomplete reports.
- Report submission for admin approval.
- Admin dashboard to view submitted reports.
- Report filtering by year, date range, and status.
- Approval and rejection workflow.
- Rejection reason capture.
- Email notifications for OTP, approval, and rejection.
- Approval note upload.
- Supporting document upload.
- Combined PDF generation for submitted reports.
- Excel export from admin dashboard.
- MySQL database storage.
- Docker support for frontend, backend, and MySQL.

## 7. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, Axios |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Authentication | JWT, OTP for employee login |
| File Upload | Multer |
| Email | Nodemailer SMTP |
| PDF Handling | pdf-lib |
| Containerization | Docker and Docker Compose |

## 8. Project Folder Structure

```text
tour_report_management/
  backend/
    config/
    controllers/
    middleware/
    routes/
    utils/
    server.js
    package.json

  frontend/
    public/
    src/
      components/
      pages/
      api.js
      main.jsx
      styles.css
    package.json

  database/
    schema.sql
    docker_seed.sql

  docs/
    PROJECT_DOCUMENTATION.md

  docker-compose.yml
  README.md
  .env.docker.example
```

### Important Folders

| Folder | Purpose |
|---|---|
| `backend` | Contains Express server, APIs, authentication, file upload, email, PDF logic, and database access |
| `frontend` | Contains React pages, components, styling, and frontend API configuration |
| `database` | Contains MySQL schema and Docker seed data |
| `docs` | Contains project documentation |

## 9. Application Flow

### Employee Flow

1. Employee enters SAP ID and email.
2. System checks whether the SAP ID and email exist in the `employees` table.
3. System sends a 6-digit OTP to the registered email.
4. Employee verifies OTP.
5. System creates an employee JWT token.
6. Employee fills the tour report form.
7. Employee can save the report as draft or submit it.
8. Submitted reports go to admin with `Pending` status.
9. Admin approves or rejects the report.
10. Employee receives an email notification after approval or rejection.

### Department User Flow

1. Department user logs in using user ID and password.
2. Department user opens the tour report form.
3. Department field is locked based on the logged-in department user.
4. Department user enters employee/person details and SAP ID.
5. Department user saves draft or submits report.
6. Submitted report goes to admin approval.

### Admin Flow

1. Admin logs in using user ID and password.
2. Admin opens the approval dashboard.
3. Admin can filter reports by status, year, and date range.
4. Admin can preview or download uploaded files.
5. Admin can approve pending reports.
6. Admin can reject pending reports by entering a rejection reason.
7. Admin can export filtered reports to Excel.

## 10. Login and Authentication

### Employee Login

Employee login uses:

- SAP ID
- Email
- OTP

SAP ID must be exactly 8 digits. OTP is valid for 10 minutes. OTP requests are limited to reduce repeated requests.

### Department Login

Department login uses:

- User ID
- Password

The user must exist in the `users` table with:

```text
role = department
status = active
```

### Admin Login

Admin login uses:

- User ID
- Password

The user must exist in the `users` table with:

```text
role = admin
status = active
```

User IDs must be 4 to 20 alphanumeric characters.

## 11. Report Statuses

| Status | Meaning |
|---|---|
| Draft | Report is saved but not submitted |
| Pending | Report is submitted and waiting for admin action |
| Approved | Report is approved by admin |
| Rejected | Report is rejected by admin and can be edited again |

### Editing Rules

- Draft reports can be edited.
- Rejected reports can be edited and submitted again.
- Pending reports cannot be edited until admin action is taken.
- Approved reports cannot be edited.

## 12. Tour Report Types

The form supports these main tour types:

- Official
- Medical(Self)
- Medical (Escort Duty)

Different fields become required depending on the selected tour type.

### Common Required Fields for Submission

- Name
- Designation
- Grade
- Department
- Type of tour
- Start date
- Start time
- Started from
- End date
- End time
- Mode of travel
- Weekly off
- Approving authority
- Approval note

### Official Tour Required Fields

- Purpose
- Destination

### Medical Tour Required Fields

- Referred hospital name
- Reference letter number
- Reference letter date

### Medical Escort Duty Required Fields

- Patient name
- Patient relation
- Escort employee SAP ID, if provided, must be exactly 8 digits

## 13. Validation Rules

- SAP ID must be exactly 8 digits.
- Employee name must contain only alphabets and spaces.
- Patient name must contain only alphabets and spaces.
- Hospital name must contain only letters, numbers, and spaces.
- End date cannot be before start date.
- For same-day tours, end time must be after start time.
- If leave is availed, leave start date and leave end date are required.
- Leave end date cannot be before leave start date.
- Approval note is required when submitting a report.

## 14. File Upload Rules

| File Type | Rule |
|---|---|
| Approval note | 1 file required for submission |
| Supporting documents | Maximum 3 files |
| Allowed formats | PDF, JPG, JPEG, PNG |
| PDF size limit | 2 MB |
| JPG/PNG size limit | 1 MB |

Uploaded files are handled by the backend and stored under the backend upload location. In Docker, uploaded files are stored in the `tour_report_uploads` Docker volume.

## 15. Database Tables

| Table | Purpose |
|---|---|
| `users` | Stores admin and department users |
| `employees` | Stores registered employees allowed to use OTP login |
| `employee_otps` | Stores OTP codes, expiry time, and usage status |
| `master_grades` | Stores grade master data |
| `master_departments` | Stores department master data |
| `master_destinations` | Stores destination master data |
| `tour_reports` | Stores tour report data and approval status |
| `tour_supporting_documents` | Stores supporting document records for tour reports |

## 16. Important API Endpoints

### Admin APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/verify` | Verify admin token |

### Employee and Department APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/employee/request-otp` | Send OTP to employee email |
| POST | `/api/employee/verify-otp` | Verify OTP and login employee |
| POST | `/api/employee/login` | Alias for OTP verification |
| POST | `/api/employee/department-login` | Department user login |

### Report APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/reports/employee` | Get reports for logged-in employee or department |
| POST | `/api/reports/draft` | Save a new draft |
| PUT | `/api/reports/:id/draft` | Update an existing draft |
| POST | `/api/reports/submit` | Submit a new report |
| PUT | `/api/reports/:id/submit` | Submit an existing draft or rejected report |
| GET | `/api/reports` | Admin report list |
| PUT | `/api/reports/:id/status` | Approve or reject a report |
| GET | `/api/reports/file` | Admin file preview/download |

### Master APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/masters` | Get grades, departments, and destinations |

## 17. Environment Variables

Do not commit real `.env` files to GitHub. Keep only example files with dummy values.

### Backend Environment Variables

```env
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=tour_report_management
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5174,http://127.0.0.1:5174
```

### Email Environment Variables for SMTP

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=Tour Report Management <yourgmail@gmail.com>
```

### Email Environment Variables for Resend

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=Tour Report Management <onboarding@resend.dev>
```

### Frontend Environment Variable

```env
VITE_API_URL=http://localhost:5001
```

## 18. Local Setup

### Database Setup

Create the database and tables using:

```bash
mysql -u root -p < database/schema.sql
```

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

```text
http://localhost:5001
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5174
```

## 19. Docker Setup

Create a `.env` file from the Docker example:

```bash
copy .env.docker.example .env
```

Start the full project:

```bash
docker compose up --build
```

Docker starts:

| Service | URL / Port |
|---|---|
| Frontend | `http://localhost:5174` |
| Backend | `http://localhost:5001` |
| MySQL | `localhost:3307` |

Stop Docker containers:

```bash
docker compose down
```

Remove Docker containers and volumes:

```bash
docker compose down -v
```

Use `docker compose down -v` carefully because it removes database data and uploaded files stored in Docker volumes.

## 20. Sample Test Data

### Add an Employee

```sql
INSERT INTO employees
(sap_id, name, email, designation, grade, department)
VALUES
('87654321', 'Tannu Sahu', 'tannu@example.com', 'Engineer', 'RS8', 'C & IT');
```

### Add Admin and Department Users

```sql
INSERT INTO users
(user_id, password, role, department_name, status)
VALUES
('ADMIN001', 'Admin@123', 'admin', NULL, 'active'),
('DEPTCIT01', 'Dept@123', 'department', 'C & IT', 'active');
```

Plain passwords are supported for testing, but hashed passwords are recommended for production use.

## 21. Testing Checklist

Use this checklist after setup or after making changes:

- Backend starts without database connection errors.
- Frontend opens on `http://localhost:5174`.
- Admin can log in.
- Department user can log in.
- Employee can request OTP.
- Employee can verify OTP.
- Master data loads in the form.
- Draft report can be saved.
- Submitted report appears in admin dashboard.
- Approval note upload works.
- Supporting document upload works.
- Admin can approve a pending report.
- Admin can reject a pending report with a reason.
- Rejected report can be edited and resubmitted.
- Approved report cannot be edited.
- Email notification is sent when email is configured.
- Docker setup starts all services successfully.

## 22. Deployment Notes

- Backend can be deployed on Render or another Node.js hosting service.
- Frontend can be deployed on Vercel or another static frontend host.
- MySQL database must be available to the backend.
- Set production environment variables in the hosting dashboard.
- Never expose real database passwords, JWT secrets, SMTP passwords, or API keys in frontend code.
- Update `FRONTEND_URL` in backend environment variables to allow production frontend requests.
- Update `VITE_API_URL` in frontend environment variables to point to the deployed backend URL.

## 23. Security Notes

- Keep `.env` files private.
- Use a strong `JWT_SECRET`.
- Use hashed passwords for admin and department users in production.
- Use Gmail App Passwords, not normal Gmail passwords.
- Limit database access to trusted networks.
- Do not expose uploaded files without authorization.
- Keep dependency packages updated.

## 24. Future Improvements

Possible future improvements:

- Add password reset for admin and department users.
- Add full audit history for approval and rejection actions.
- Add role-based permission management.
- Add automated tests for backend APIs.
- Add frontend form unit tests.
- Add admin user management screens.
- Add employee management screens.
- Add better reporting and analytics dashboard.

## 25. Where This Documentation Is Saved

This documentation is saved at:

```text
docs/PROJECT_DOCUMENTATION.md
```
