const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const isUserId = (value) => /^[A-Za-z0-9]{4,20}$/.test(String(value || ""));
const isEightDigitSap = (value) => /^\d{8}$/.test(String(value || ""));
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
const isStatus = (value) => ["active", "inactive"].includes(String(value || ""));
const cleanText = (value) => String(value || "").trim();

const employeeFields = (body) => ({
  sap_id: cleanText(body.sap_id),
  name: cleanText(body.name),
  email: cleanText(body.email).toLowerCase(),
  designation: cleanText(body.designation),
  grade: cleanText(body.grade),
  department: cleanText(body.department),
  status: cleanText(body.status || "active").toLowerCase(),
});

const validateEmployee = (employee) => {
  if (!isEightDigitSap(employee.sap_id)) return "SAP ID must be exactly 8 digits.";
  if (!employee.name) return "Employee name is required.";
  if (!isEmail(employee.email)) return "Please enter a valid email.";
  if (!employee.designation) return "Designation is required.";
  if (!employee.grade) return "Grade is required.";
  if (!employee.department) return "Department is required.";
  if (!isStatus(employee.status)) return "Status must be active or inactive.";
  return "";
};

const duplicateMessage = (err, fallback) => {
  if (err?.code !== "ER_DUP_ENTRY") return fallback;
  if (String(err.sqlMessage || "").includes("sap_id")) return "SAP ID already exists.";
  if (String(err.sqlMessage || "").includes("email")) return "Email already exists.";
  if (String(err.sqlMessage || "").includes("department_name")) return "Department already exists.";
  return "Record already exists.";
};

exports.login = (req, res) => {
  const { user_id, password } = req.body;

  if (!isUserId(user_id)) {
    return res.status(400).json({ message: "User ID must be 4-20 letters/numbers." });
  }

  db.query("SELECT * FROM users WHERE user_id = ? AND status = 'active'", [user_id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Login failed." });
    if (rows.length === 0) return res.status(401).json({ message: "Invalid credentials." });

    const user = rows[0];
    const stored = user.password || "";
    const isHash = stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");
    const valid = isHash ? bcrypt.compareSync(password, stored) : stored === password;

    if (!valid) return res.status(401).json({ message: "Invalid credentials." });

    if (!["admin", "department"].includes(user.role)) {
      return res.status(403).json({ message: "This user role is not allowed." });
    }

    const tokenRole = user.role === "department" ? "employee" : "admin";
    const token = jwt.sign(
      {
        id: user.role === "department" ? null : user.id,
        user_id: user.user_id,
        role: tokenRole,
        access_type: user.role === "department" ? "department" : undefined,
        department: user.department_name || undefined,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        user_id: user.user_id,
        role: user.role,
        department: user.department_name,
      },
    });
  });
};

exports.verify = (req, res) => {
  res.json({ valid: true, user: req.admin });
};

exports.listEmployees = (req, res) => {
  db.query(
    `SELECT id, sap_id, name, email, designation, grade, department, status, created_at
     FROM employees
     ORDER BY name ASC`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Employees could not be loaded." });
      res.json(rows);
    }
  );
};

exports.createEmployee = (req, res) => {
  const employee = employeeFields(req.body);
  const validationError = validateEmployee(employee);
  if (validationError) return res.status(400).json({ message: validationError });

  db.query(
    `INSERT INTO employees (sap_id, name, email, designation, grade, department, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [employee.sap_id, employee.name, employee.email, employee.designation, employee.grade, employee.department, employee.status],
    (err, result) => {
      if (err) return res.status(500).json({ message: duplicateMessage(err, "Employee could not be created.") });
      res.status(201).json({ id: result.insertId, ...employee });
    }
  );
};

exports.updateEmployee = (req, res) => {
  const employee = employeeFields(req.body);
  const validationError = validateEmployee(employee);
  if (validationError) return res.status(400).json({ message: validationError });

  db.query(
    `UPDATE employees
     SET sap_id = ?, name = ?, email = ?, designation = ?, grade = ?, department = ?, status = ?
     WHERE id = ?`,
    [employee.sap_id, employee.name, employee.email, employee.designation, employee.grade, employee.department, employee.status, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: duplicateMessage(err, "Employee could not be updated.") });
      if (result.affectedRows === 0) return res.status(404).json({ message: "Employee not found." });
      res.json({ id: Number(req.params.id), ...employee });
    }
  );
};

exports.updateEmployeeStatus = (req, res) => {
  const status = cleanText(req.body.status).toLowerCase();
  if (!isStatus(status)) return res.status(400).json({ message: "Status must be active or inactive." });

  db.query("UPDATE employees SET status = ? WHERE id = ?", [status, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: "Employee status could not be updated." });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Employee not found." });
    res.json({ id: Number(req.params.id), status });
  });
};

exports.listDepartments = (req, res) => {
  db.query(
    "SELECT id, department_name, status, created_at FROM master_departments ORDER BY department_name ASC",
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Departments could not be loaded." });
      res.json(rows);
    }
  );
};

exports.createDepartment = (req, res) => {
  const departmentName = cleanText(req.body.department_name);
  const status = cleanText(req.body.status || "active").toLowerCase();

  if (!departmentName) return res.status(400).json({ message: "Department name is required." });
  if (!isStatus(status)) return res.status(400).json({ message: "Status must be active or inactive." });

  db.query(
    "INSERT INTO master_departments (department_name, status) VALUES (?, ?)",
    [departmentName, status],
    (err, result) => {
      if (err) return res.status(500).json({ message: duplicateMessage(err, "Department could not be created.") });
      res.status(201).json({ id: result.insertId, department_name: departmentName, status });
    }
  );
};

exports.updateDepartment = (req, res) => {
  const departmentName = cleanText(req.body.department_name);
  const status = cleanText(req.body.status || "active").toLowerCase();

  if (!departmentName) return res.status(400).json({ message: "Department name is required." });
  if (!isStatus(status)) return res.status(400).json({ message: "Status must be active or inactive." });

  db.query(
    "UPDATE master_departments SET department_name = ?, status = ? WHERE id = ?",
    [departmentName, status, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: duplicateMessage(err, "Department could not be updated.") });
      if (result.affectedRows === 0) return res.status(404).json({ message: "Department not found." });
      res.json({ id: Number(req.params.id), department_name: departmentName, status });
    }
  );
};

exports.updateDepartmentStatus = (req, res) => {
  const status = cleanText(req.body.status).toLowerCase();
  if (!isStatus(status)) return res.status(400).json({ message: "Status must be active or inactive." });

  db.query("UPDATE master_departments SET status = ? WHERE id = ?", [status, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: "Department status could not be updated." });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Department not found." });
    res.json({ id: Number(req.params.id), status });
  });
};
