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
const { handleUploadError } = require("../middleware/upload");

const router = express.Router();

router.get("/employee", verifyEmployee, getEmployeeReports);
router.post("/draft", verifyEmployee, handleUploadError, saveDraft);
router.put("/:id/draft", verifyEmployee, handleUploadError, saveDraft);
router.post("/submit", verifyEmployee, handleUploadError, submitReport);
router.put("/:id/submit", verifyEmployee, handleUploadError, submitReport);
router.get("/", verifyAdmin, getReports);
router.put("/:id/status", verifyAdmin, updateStatus);
router.get("/file", verifyAdminFileAccess, fileResponse);

module.exports = router;


