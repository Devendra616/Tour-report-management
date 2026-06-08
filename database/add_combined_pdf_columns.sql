USE tour_report_management;

SET @has_combined_pdf_path := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'tour_reports'
    AND column_name = 'combined_pdf_path'
);
SET @sql := IF(@has_combined_pdf_path = 0,
  'ALTER TABLE tour_reports ADD COLUMN combined_pdf_path varchar(255) DEFAULT NULL AFTER approval_note_name',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_combined_pdf_name := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'tour_reports'
    AND column_name = 'combined_pdf_name'
);
SET @sql := IF(@has_combined_pdf_name = 0,
  'ALTER TABLE tour_reports ADD COLUMN combined_pdf_name varchar(255) DEFAULT NULL AFTER combined_pdf_path',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
