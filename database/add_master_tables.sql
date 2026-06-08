USE tour_report_management;

CREATE TABLE IF NOT EXISTS master_grades (
  id int NOT NULL AUTO_INCREMENT,
  grade_name varchar(20) NOT NULL UNIQUE,
  status enum('active','inactive') NOT NULL DEFAULT 'active',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS master_departments (
  id int NOT NULL AUTO_INCREMENT,
  department_name varchar(100) NOT NULL UNIQUE,
  status enum('active','inactive') NOT NULL DEFAULT 'active',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS master_destinations (
  id int NOT NULL AUTO_INCREMENT,
  destination_name varchar(150) NOT NULL UNIQUE,
  status enum('active','inactive') NOT NULL DEFAULT 'active',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

ALTER TABLE tour_reports
  ADD COLUMN department varchar(100) NOT NULL DEFAULT 'General' AFTER grade;

INSERT IGNORE INTO master_grades (grade_name)
VALUES ('RS1'), ('RS2'), ('RS3'), ('RS4'), ('RS5'), ('RS6'), ('RS7'), ('RS8');

INSERT IGNORE INTO master_departments (department_name)
VALUES ('C & IT'), ('Civil'), ('Electrical'), ('Mechanical'), ('Finance'), ('HR');

INSERT IGNORE INTO master_destinations (destination_name)
VALUES ('Bangalore'), ('Hyderabad'), ('Delhi'), ('Mumbai'), ('Raipur'), ('Nagpur');
