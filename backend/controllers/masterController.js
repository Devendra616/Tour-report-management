const db = require("../config/db");

exports.getMasters = (req, res) => {
  const response = {};

  db.query("SELECT id, grade_name FROM master_grades WHERE status = 'active' ORDER BY grade_name ASC", (gradeErr, grades) => {
    if (gradeErr) return res.status(500).json({ message: "Grades could not be loaded." });
    response.grades = grades;

    db.query("SELECT id, department_name FROM master_departments WHERE status = 'active' ORDER BY department_name ASC", (deptErr, departments) => {
      if (deptErr) return res.status(500).json({ message: "Departments could not be loaded." });
      response.departments = departments;

      db.query("SELECT id, destination_name FROM master_destinations WHERE status = 'active' ORDER BY destination_name ASC", (destErr, destinations) => {
        if (destErr) return res.status(500).json({ message: "Destinations could not be loaded." });
        response.destinations = destinations;
        res.json(response);
      });
    });
  });
};
