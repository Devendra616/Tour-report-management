const express = require("express");
const {
  saveDraft,
  submitReport,
  getEmployeeReports,
  getReports,
  updateStatus,
  fileResponse,
} = require("../controllers/reportController");
const { verifyAdmin, verifyAdminFileAccess, verifyEmployee } = require("../middleware/auth");

const router = express.Router();

router.get("/employee", verifyEmployee, getEmployeeReports);
router.post("/draft", verifyEmployee, saveDraft);
router.put("/:id/draft", verifyEmployee, saveDraft);
router.post("/submit", verifyEmployee, submitReport);
router.put("/:id/submit", verifyEmployee, submitReport);
router.get("/", verifyAdmin, getReports);
router.put("/:id/status", verifyAdmin, updateStatus);
router.get("/file", verifyAdminFileAccess, fileResponse);

module.exports = router;
