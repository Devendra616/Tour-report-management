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

CREATE TABLE IF NOT EXISTS employee_otps (
  id int NOT NULL AUTO_INCREMENT,
  employee_id int NOT NULL,
  otp_code varchar(6) NOT NULL,
  expires_at timestamp NOT NULL,
  used_at timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY employee_id (employee_id),
  KEY otp_code (otp_code)
);

SET @has_department := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'tour_reports'
    AND column_name = 'department'
);
SET @sql := IF(@has_department = 0,
  'ALTER TABLE tour_reports ADD COLUMN department varchar(100) DEFAULT NULL AFTER grade',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE tour_reports
  MODIFY name varchar(100) DEFAULT NULL,
  MODIFY designation varchar(100) DEFAULT NULL,
  MODIFY grade varchar(20) DEFAULT NULL,
  MODIFY department varchar(100) DEFAULT NULL,
  MODIFY tour_type varchar(50) DEFAULT NULL,
  MODIFY purpose varchar(255) DEFAULT NULL,
  MODIFY start_date date DEFAULT NULL,
  MODIFY start_place varchar(150) DEFAULT NULL,
  MODIFY end_date date DEFAULT NULL,
  MODIFY destination varchar(150) DEFAULT NULL,
  MODIFY mode_of_travel varchar(50) DEFAULT NULL,
  MODIFY weekly_off varchar(20) DEFAULT NULL,
  MODIFY approving_authority varchar(100) DEFAULT NULL,
  MODIFY approval_note_path varchar(255) DEFAULT NULL,
  MODIFY approval_note_name varchar(255) DEFAULT NULL,
  MODIFY status enum('Draft','Pending','Approved','Rejected') NOT NULL DEFAULT 'Draft';

SET @has_employee_id := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'tour_reports'
    AND column_name = 'employee_id'
);
SET @sql := IF(@has_employee_id = 0,
  'ALTER TABLE tour_reports ADD COLUMN employee_id int DEFAULT NULL AFTER id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_submitted_at := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'tour_reports'
    AND column_name = 'submitted_at'
);
SET @sql := IF(@has_submitted_at = 0,
  'ALTER TABLE tour_reports ADD COLUMN submitted_at timestamp NULL DEFAULT NULL AFTER approved_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_updated_at := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'tour_reports'
    AND column_name = 'updated_at'
);
SET @sql := IF(@has_updated_at = 0,
  'ALTER TABLE tour_reports ADD COLUMN updated_at timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER submitted_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
