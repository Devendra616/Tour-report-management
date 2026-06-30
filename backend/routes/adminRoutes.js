const express = require("express");
const {
  createDepartment,
  createEmployee,
  listDepartments,
  listEmployees,
  login,
  updateDepartment,
  updateDepartmentStatus,
  updateEmployee,
  updateEmployeeStatus,
  verify,
} = require("../controllers/adminController");
const { verifyAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/login", login);
router.get("/verify", verifyAdmin, verify);
router.get("/employees", verifyAdmin, listEmployees);
router.post("/employees", verifyAdmin, createEmployee);
router.put("/employees/:id", verifyAdmin, updateEmployee);
router.patch("/employees/:id/status", verifyAdmin, updateEmployeeStatus);
router.get("/departments", verifyAdmin, listDepartments);
router.post("/departments", verifyAdmin, createDepartment);
router.put("/departments/:id", verifyAdmin, updateDepartment);
router.patch("/departments/:id/status", verifyAdmin, updateDepartmentStatus);

module.exports = router;
