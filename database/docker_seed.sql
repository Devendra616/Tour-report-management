USE tour_report_management;

INSERT IGNORE INTO users (user_id, password, role, department_name, status)
VALUES
  ('ADMIN001', 'Admin@123', 'admin', NULL, 'active'),
  ('DEPTCIT01', 'Dept@123', 'department', 'C & IT', 'active'),
  ('DEPTCIV01', 'Dept@123', 'department', 'Civil', 'active');

INSERT IGNORE INTO employees (sap_id, name, email, designation, grade, department, status)
VALUES
  ('87654321', 'Tameshwari Sahu', 'tameshwari@example.com', 'Engineer', 'RS8', 'C & IT', 'active'),
  ('12345678', 'Devendra Singh', 'devendra@example.com', 'Sr Manager', 'JO', 'C & IT', 'active');
