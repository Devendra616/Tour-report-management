USE tour_report_management;

DELETE FROM admins
WHERE sap_id = '12345678'
  AND password = 'admin123';
