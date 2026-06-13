USE tour_report_management;

INSERT IGNORE INTO users (user_id, password, role, department_name, status)
VALUES
  ('ADMIN001', '$2a$10$8Yy3Aw3O1bsHmkz9q04VPek1ASpRov.KV0NjVfeqU/Z/Z1he9ranW', 'admin', NULL, 'active'),
  ('DEPTCIT01', '$2a$10$NSF7p9kCiV./G1TgWfNgq.rDfmxhZq7rlh375JtIdi9h3kzhtqNES', 'department', 'C & IT', 'active'),
  ('DEPTCIV01', '$2a$10$qGZiEXCccKc8hLjnz0/vZOieCuUsY4GNrqNAKm..APCabsiFEylI2', 'department', 'Civil', 'active');

INSERT IGNORE INTO employees (sap_id, name, email, designation, grade, department, status)
VALUES
  ('87654321', 'Tameshwari Sahu', 'tameshwari@example.com', 'Engineer', 'RS8', 'C & IT', 'active'),
  ('12345678', 'Devendra Singh', 'devendra@example.com', 'Sr Manager', 'JO', 'C & IT', 'active');
