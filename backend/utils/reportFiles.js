const fs = require("fs");
const os = require("os");
const path = require("path");
const db = require("../config/db");
const { createCombinedPdf, detectFileKind } = require("./pdfBuilder");

const MAX_SUPPORTING_DOCUMENTS = 3;
const MAX_IMAGE_SIZE = 1 * 1024 * 1024;
const MAX_PDF_SIZE = 2 * 1024 * 1024;
const MAX_FILE_SIZE = MAX_PDF_SIZE;
const UPLOAD_RELATIVE_DIR = "uploads/tour-reports";
const uploadDir = path.join(__dirname, "..", UPLOAD_RELATIVE_DIR);
const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);

const maxSizeFor = (mimeType) => (mimeType === "application/pdf" ? MAX_PDF_SIZE : MAX_IMAGE_SIZE);
const fileSizeMessage = "PDF must be 2 MB or less. JPG/PNG images must be 1 MB or less.";

const expectedKindFor = (mimeType) => {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  return "unsupported";
};

const validateFileContent = (file) => {
  const expectedKind = expectedKindFor(file.mimetype);
  const actualKind = detectFileKind(file.buffer);
  if (actualKind !== expectedKind) {
    throw new Error("File content does not match its type. Please upload a valid PDF, JPG, or PNG file.");
  }
};

const timestampForFileName = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date()).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}`;
};

const markFileCurrentTime = (absolutePath) => {
  const now = new Date();
  fs.utimesSync(absolutePath, now, now);
};

const localFileRecord = (file, prefix) => {
  if (!allowedTypes.has(file.mimetype)) throw new Error("Only PDF, JPG, and PNG files are allowed.");
  if (file.size > maxSizeFor(file.mimetype)) throw new Error(fileSizeMessage);
  validateFileContent(file);

  fs.mkdirSync(uploadDir, { recursive: true });
  const ext = path.extname(file.originalname).toLowerCase() || ".bin";
  const safeName = `${prefix}-${timestampForFileName()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const absolutePath = path.join(uploadDir, safeName);
  fs.writeFileSync(absolutePath, file.buffer);
  markFileCurrentTime(absolutePath);

  return {
    fileName: file.originalname,
    fileType: file.mimetype,
    filePath: `${UPLOAD_RELATIVE_DIR}/${safeName}`,
  };
};

const saveUploadedFile = async (file, prefix) => {
  if (!file?.buffer || !file?.originalname || !file?.mimetype) throw new Error("Invalid file upload.");
  if (!allowedTypes.has(file.mimetype)) throw new Error("Only PDF, JPG, and PNG files are allowed.");
  if (file.size > maxSizeFor(file.mimetype)) throw new Error(fileSizeMessage);

  return localFileRecord(file, prefix);
};

const attachSupportDocs = (reports, res) => {
  const ids = reports.map((report) => report.id);
  if (ids.length === 0) return res.json([]);

  db.query("SELECT * FROM tour_supporting_documents WHERE tour_report_id IN (?)", [ids], (err, docs) => {
    if (err) return res.status(500).json({ message: "Documents could not be loaded." });

    const docsByReport = docs.reduce((acc, doc) => {
      acc[doc.tour_report_id] = acc[doc.tour_report_id] || [];
      acc[doc.tour_report_id].push(doc);
      return acc;
    }, {});

  
    res.json(reports.map((report) => ({
      ...report,
      supporting_documents: docsByReport[report.id] || [],
    })));
  });
};

const saveSupportFiles = (reportId, supportFiles, res, done) => {
  if (supportFiles.length === 0) return done();

  const rows = supportFiles.map((file) => [reportId, file.fileName, file.filePath, file.fileType]);
  db.query(
    "INSERT INTO tour_supporting_documents (tour_report_id, file_name, file_path, file_type) VALUES ?",
    [rows],
    (err) => {
      if (err) return res.status(500).json({ message: "Supporting documents could not be saved." });
      done();
    }
  );
};

const downloadToTempFile = async (url, index) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Remote file could not be downloaded for PDF merge.");

  const urlPath = new URL(url).pathname;
  const ext = path.extname(urlPath.split("/").pop()) || ".pdf";
  const absolutePath = path.join(os.tmpdir(), `tour-report-source-${Date.now()}-${index}${ext}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(absolutePath, bytes);
  return absolutePath;
};

const filePathForMerge = async (filePath, index) => {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return downloadToTempFile(filePath, index);

  const absolutePath = path.join(__dirname, "..", filePath);
  return fs.existsSync(absolutePath) ? absolutePath : null;
};

const saveCombinedPdf = async (reportId, absoluteFiles) => {
  const fileName = `combined-report-${reportId}-${timestampForFileName()}.pdf`;
  const absolutePath = await createCombinedPdf({ files: absoluteFiles, outputDir: uploadDir, outputName: fileName });
  markFileCurrentTime(absolutePath);
  return { filePath: `${UPLOAD_RELATIVE_DIR}/${fileName}`, fileName };
};

const generateCombinedReportPdf = (reportId, done) => {
  db.query("SELECT * FROM tour_reports WHERE id = ?", [reportId], (reportErr, reports) => {
    if (reportErr || reports.length === 0) return done(reportErr || new Error("Report not found."));
    if (reports[0].status === "Rejected") return done();

    db.query("SELECT * FROM tour_supporting_documents WHERE tour_report_id = ? ORDER BY id ASC", [reportId], async (docErr, docs) => {
      if (docErr) return done(docErr);
      if (reports[0].combined_pdf_path && docs.length === 0) return done();

      const tempFiles = [];
      try {
        const sources = [reports[0].approval_note_path, ...docs.map((doc) => doc.file_path)].filter(Boolean);
        const absoluteFiles = (await Promise.all(sources.map(filePathForMerge))).filter(Boolean);
        tempFiles.push(...absoluteFiles.filter((file) => file.startsWith(os.tmpdir())));
        if (absoluteFiles.length === 0) return done();

        const combined = await saveCombinedPdf(reportId, absoluteFiles);
        db.query(
          "UPDATE tour_reports SET combined_pdf_path = ?, combined_pdf_name = ? WHERE id = ? AND status <> 'Rejected'",
          [combined.filePath, combined.fileName, reportId],
          (updateErr, result) => {
            if (!updateErr && result.affectedRows === 0) deleteLocalReportFile(combined.filePath);
            if (updateErr || result.affectedRows === 0) return done(updateErr);
            deleteCombinedSourceFiles(reportId, reports[0], docs, done);
          }
        );
      } catch (err) {
        done(err);
      } finally {
        tempFiles.forEach((file) => fs.rmSync(file, { force: true }));
      }
    });
  });
};

const resolveReportFile = (filePath) => {
  if (/^https?:\/\//i.test(filePath || "")) return { type: "url", value: filePath };
  if (!filePath || !filePath.startsWith(`${UPLOAD_RELATIVE_DIR}/`)) return null;

  const absolutePath = path.join(__dirname, "..", filePath);
  return fs.existsSync(absolutePath) ? { type: "local", value: absolutePath } : null;
};

const deleteLocalReportFile = (filePath) => {
  if (!filePath || /^https?:\/\//i.test(filePath) || !filePath.startsWith(`${UPLOAD_RELATIVE_DIR}/`)) return;

  const absoluteUploadDir = path.resolve(uploadDir);
  const absolutePath = path.resolve(__dirname, "..", filePath);
  if (!absolutePath.startsWith(`${absoluteUploadDir}${path.sep}`)) return;

  fs.rmSync(absolutePath, { force: true });
};

const deleteCombinedSourceFiles = (reportId, report, docs, done) => {
  try {
    deleteLocalReportFile(report.approval_note_path);
    docs.forEach((doc) => deleteLocalReportFile(doc.file_path));
  } catch (err) {
    return done(err);
  }

  db.query("DELETE FROM tour_supporting_documents WHERE tour_report_id = ?", [reportId], (deleteErr) => {
    if (deleteErr) return done(deleteErr);

    db.query(
      "UPDATE tour_reports SET approval_note_path = NULL, approval_note_name = NULL WHERE id = ?",
      [reportId],
      done
    );
  });
};

const deleteApprovedReportSourceFiles = (reportId, done) => {
  db.query("SELECT approval_note_path FROM tour_reports WHERE id = ?", [reportId], (reportErr, reports) => {
    if (reportErr) return done(reportErr);
    if (reports.length === 0) return done();

    db.query("SELECT file_path FROM tour_supporting_documents WHERE tour_report_id = ?", [reportId], (docErr, docs) => {
      if (docErr) return done(docErr);

      try {
        deleteLocalReportFile(reports[0].approval_note_path);
        docs.forEach((doc) => deleteLocalReportFile(doc.file_path));
      } catch (err) {
        return done(err);
      }

      db.query("DELETE FROM tour_supporting_documents WHERE tour_report_id = ?", [reportId], (deleteErr) => {
        if (deleteErr) return done(deleteErr);

        db.query(
          "UPDATE tour_reports SET approval_note_path = NULL, approval_note_name = NULL WHERE id = ?",
          [reportId],
          done
        );
      });
    });
  });
};

const finalizeApprovedReportFiles = (reportId, done) => {
  generateCombinedReportPdf(reportId, (combineErr) => {
    if (combineErr) return done(combineErr);

    db.query("SELECT combined_pdf_path FROM tour_reports WHERE id = ?", [reportId], (reportErr, reports) => {
      if (reportErr) return done(reportErr);
      if (!reports[0]?.combined_pdf_path) return done(new Error("Combined PDF could not be generated."));

      deleteApprovedReportSourceFiles(reportId, done);
    });
  });
};

const deleteRejectedReportFiles = (reportId, done) => {
  db.query("SELECT approval_note_path, combined_pdf_path FROM tour_reports WHERE id = ?", [reportId], (reportErr, reports) => {
    if (reportErr) return done(reportErr);
    if (reports.length === 0) return done();

    db.query("SELECT file_path FROM tour_supporting_documents WHERE tour_report_id = ?", [reportId], (docErr, docs) => {
      if (docErr) return done(docErr);

      const filePaths = [
        reports[0].approval_note_path,
        reports[0].combined_pdf_path,
        ...docs.map((doc) => doc.file_path),
      ];

      try {
        filePaths.forEach(deleteLocalReportFile);
      } catch (err) {
        return done(err);
      }

      db.query("DELETE FROM tour_supporting_documents WHERE tour_report_id = ?", [reportId], (deleteErr) => {
        if (deleteErr) return done(deleteErr);

        db.query(
          "UPDATE tour_reports SET approval_note_path = NULL, approval_note_name = NULL, combined_pdf_path = NULL, combined_pdf_name = NULL WHERE id = ?",
          [reportId],
          done
        );
      });
    });
  });
};

module.exports = {
  MAX_FILE_SIZE,
  MAX_SUPPORTING_DOCUMENTS,
  allowedTypes,
  attachSupportDocs,
  deleteRejectedReportFiles,
  finalizeApprovedReportFiles,
  generateCombinedReportPdf,
  resolveReportFile,
  saveSupportFiles,
  saveUploadedFile,
};
