USE tour_report_management;

CREATE TABLE IF NOT EXISTS employees (
  id int NOT NULL AUTO_INCREMENT,
  sap_id varchar(8) NOT NULL UNIQUE,
  name varchar(100) NOT NULL,
  email varchar(150) NOT NULL UNIQUE,
  designation varchar(100) NOT NULL,
  grade varchar(20) NOT NULL,
  department varchar(100) NOT NULL,
  status enum('active','inactive') NOT NULL DEFAULT 'active',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY status (status)
);

ALTER TABLE tour_reports
  ADD COLUMN employee_id int DEFAULT NULL AFTER id;

ALTER TABLE tour_reports
  ADD KEY employee_id (employee_id);

ALTER TABLE tour_reports
  ADD CONSTRAINT tour_reports_employee_fk FOREIGN KEY (employee_id) REFERENCES employees(id);
