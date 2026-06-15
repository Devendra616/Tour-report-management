const multer = require("multer");
const { MAX_FILE_SIZE, MAX_SUPPORTING_DOCUMENTS, allowedTypes } = require("../utils/reportFiles");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!allowedTypes.has(file.mimetype)) {
    cb(new Error("Only PDF, JPG, and PNG files are allowed."));
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

const reportUpload = upload.fields([
  { name: "approval_note", maxCount: 1 },
  { name: "supporting_documents", maxCount: MAX_SUPPORTING_DOCUMENTS },
]);

const handleUploadError = (req, res, next) => {
  reportUpload(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "PDF must be 2 MB or less. JPG/PNG images must be 1 MB or less." });
    }
    res.status(400).json({ message: err.message || "Files could not be uploaded." });
  });
};

module.exports = { handleUploadError };
