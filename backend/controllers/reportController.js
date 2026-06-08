const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const { sendMail } = require("../utils/mailer");
const { createCombinedPdf } = require("../utils/pdfBuilder");

const uploadDir = path.join(__dirname, "..", "uploads", "tour-reports");
const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
const maxFileSize = 10 * 1024 * 1024;

const normalizeTime = (value, period = "") => {
  let raw = String(value || "").trim().toUpperCase();
  if (!raw) return null;

  const suffixMatch = raw.match(/\s*(AM|PM)$/);
  const effectivePeriod = suffixMatch ? suffixMatch[1] : String(period || "").toUpperCase();
  if (suffixMatch) {
    raw = raw.replace(/\s*(AM|PM)$/, "").trim();
  }

  let hours;
  let minutes;

  if (/^\d{1,2}$/.test(raw)) {
    hours = Number(raw);
    minutes = 0;
  } else if (/^\d{3,4}$/.test(raw)) {
    const padded = raw.padStart(4, "0");
    hours = Number(padded.slice(0, 2));
    minutes = Number(padded.slice(2));
  } else {
    const match = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    hours = Number(match[1]);
    minutes = Number(match[2]);
  }

  if (effectivePeriod) {
    if (!["AM", "PM"].includes(effectivePeriod) || hours < 1 || hours > 12) {
      return null;
    }
    if (effectivePeriod === "AM") {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const saveBase64File = (file, prefix) => {
  if (!file?.data || !file?.name || !file?.type) {
    throw new Error("Invalid file upload.");
  }

  if (!allowedTypes.has(file.type)) {
    throw new Error("Only PDF, JPG, and PNG files are allowed.");
  }

  const buffer = Buffer.from(file.data, "base64");
  if (buffer.length > maxFileSize) {
    throw new Error("Each uploaded file must be 10 MB or less.");
  }

  fs.mkdirSync(uploadDir, { recursive: true });
  const ext = path.extname(file.name).toLowerCase() || ".bin";
  const safeName = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const absolutePath = path.join(uploadDir, safeName);
  fs.writeFileSync(absolutePath, buffer);

  return {
    fileName: file.name,
    fileType: file.type,
    filePath: `uploads/tour-reports/${safeName}`,
  };
};

const validateSubmittedReport = (body, hasApprovalNote) => {
  const required = [
    body.name,
    body.designation,
    body.grade,
    body.department,
    body.tour_type,
    body.purpose,
    body.start_date,
    body.start_place,
    body.end_date,
    body.destination,
    body.mode_of_travel,
    body.weekly_off,
    body.approving_authority,
  ];

  if (required.some((value) => !String(value || "").trim())) {
    return "Please fill all required fields.";
  }

  if (!hasApprovalNote) {
    return "Approval note is required.";
  }

  if (new Date(body.start_date) > new Date(body.end_date)) {
    return "End date cannot be before start date.";
  }

  const startTime = normalizeTime(body.start_time, body.start_period);
  const endTime = normalizeTime(body.end_time, body.end_period);

  if ((body.start_time && !startTime) || (body.end_time && !endTime)) {
    return "Please enter valid time, for example 10:00 AM.";
  }

  if (body.start_date === body.end_date && startTime && endTime && startTime >= endTime) {
    return "End time must be after start time for same-day tour.";
  }

  if (body.start_date && body.end_date && startTime && endTime) {
    const start = new Date(`${body.start_date}T${startTime}`);
    const end = new Date(`${body.end_date}T${endTime}`);

    if (end <= start) {
      return "End date/time must be after start date/time.";
    }
  }

  return "";
};

const supportDocsByReport = (reports, res) => {
  const ids = reports.map((report) => report.id);
  if (ids.length === 0) return res.json([]);

  db.query("SELECT * FROM tour_supporting_documents WHERE tour_report_id IN (?)", [ids], (docErr, docs) => {
    if (docErr) return res.status(500).json({ message: "Documents could not be loaded." });

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

  const docRows = supportFiles.map((file) => [reportId, file.fileName, file.filePath, file.fileType]);
  db.query(
    "INSERT INTO tour_supporting_documents (tour_report_id, file_name, file_path, file_type) VALUES ?",
    [docRows],
    (docErr) => {
      if (docErr) return res.status(500).json({ message: "Supporting documents could not be saved." });
      done();
    }
  );
};

const generateCombinedReportPdf = (reportId, done) => {
  db.query("SELECT * FROM tour_reports WHERE id = ?", [reportId], (reportErr, reports) => {
    if (reportErr || reports.length === 0) return done(reportErr || new Error("Report not found."));

    db.query(
      "SELECT * FROM tour_supporting_documents WHERE tour_report_id = ? ORDER BY id ASC",
      [reportId],
      async (docErr, docs) => {
        if (docErr) return done(docErr);

        const report = reports[0];
        const relativeFiles = [
          report.approval_note_path,
          ...docs.map((doc) => doc.file_path),
        ].filter(Boolean);
        const absoluteFiles = relativeFiles
          .map((filePath) => path.join(__dirname, "..", filePath))
          .filter((filePath) => fs.existsSync(filePath));

        if (absoluteFiles.length === 0) return done();

        try {
          const fileName = `combined-report-${reportId}-${Date.now()}.pdf`;
          await createCombinedPdf({
            files: absoluteFiles,
            outputDir: uploadDir,
            outputName: fileName,
          });

          db.query(
            "UPDATE tour_reports SET combined_pdf_path = ?, combined_pdf_name = ? WHERE id = ?",
            [`uploads/tour-reports/${fileName}`, fileName, reportId],
            (updateErr) => done(updateErr)
          );
        } catch (err) {
          done(err);
        }
      }
    );
  });
};

const finishReportSave = (reportId, res, message = "Report saved successfully.") => {
  generateCombinedReportPdf(reportId, (combineErr) => {
    if (combineErr) {
      console.error("Combined PDF failed:", combineErr.message);
      return res.status(500).json({ message: "Report saved, but combined PDF could not be created." });
    }

    res.json({ message, id: reportId });
  });
};

const reportValues = (body, employee, approvalFile, status) => [
  employee.id,
  employee.sap_id,
  body.name || employee.name,
  body.designation || employee.designation,
  body.grade || employee.grade,
  body.department || employee.department,
  body.tour_type || null,
  body.purpose || null,
  body.start_date || null,
  normalizeTime(body.start_time, body.start_period),
  body.start_place || null,
  body.end_date || null,
  normalizeTime(body.end_time, body.end_period),
  body.destination || null,
  body.mode_of_travel || null,
  body.weekly_off || null,
  body.approving_authority || null,
  approvalFile?.filePath || null,
  approvalFile?.fileName || null,
  status,
];

const saveEmployeeReport = (req, res, status) => {
  const reportId = req.params.id;
  const employee = req.employee;
  const { approval_note, supporting_documents = [] } = req.body;
  req.body.start_time = normalizeTime(req.body.start_time, req.body.start_period) || req.body.start_time;
  req.body.end_time = normalizeTime(req.body.end_time, req.body.end_period) || req.body.end_time;

  if (supporting_documents.length > 5) {
    return res.status(400).json({ message: "Only 5 supporting documents are allowed." });
  }

  let approvalFile = null;
  let supportFiles = [];

  try {
    approvalFile = approval_note ? saveBase64File(approval_note, "approval-note") : null;
    supportFiles = supporting_documents.map((file) => saveBase64File(file, "support"));
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  const finishSave = (existingReport = null) => {
    if (existingReport?.status === "Approved") {
      return res.status(403).json({ message: "Approved reports cannot be edited." });
    }

    const finalApprovalFile = approvalFile || {
      filePath: existingReport?.approval_note_path || null,
      fileName: existingReport?.approval_note_name || null,
    };

    if (status === "Pending") {
      const validationMessage = validateSubmittedReport(req.body, Boolean(finalApprovalFile.filePath));
      if (validationMessage) return res.status(400).json({ message: validationMessage });
    }

    if (existingReport) {
      const params = [
        req.body.name || employee.name,
        req.body.designation || employee.designation,
        req.body.grade || employee.grade,
        req.body.department || employee.department,
        req.body.tour_type || null,
        req.body.purpose || null,
        req.body.start_date || null,
        normalizeTime(req.body.start_time, req.body.start_period),
        req.body.start_place || null,
        req.body.end_date || null,
        normalizeTime(req.body.end_time, req.body.end_period),
        req.body.destination || null,
        req.body.mode_of_travel || null,
        req.body.weekly_off || null,
        req.body.approving_authority || null,
        finalApprovalFile.filePath,
        finalApprovalFile.fileName,
        status,
        existingReport.id,
        employee.id,
      ];

      db.query(
        `UPDATE tour_reports
         SET name = ?, designation = ?, grade = ?, department = ?, tour_type = ?, purpose = ?,
             start_date = ?, start_time = ?, start_place = ?, end_date = ?, end_time = ?,
             destination = ?, mode_of_travel = ?, weekly_off = ?, approving_authority = ?,
             approval_note_path = ?, approval_note_name = ?, status = ?,
             submitted_at = ${status === "Pending" ? "NOW()" : "submitted_at"},
             rejection_reason = ${status === "Pending" ? "NULL" : "rejection_reason"}
         WHERE id = ? AND employee_id = ?`,
        params,
        (err) => {
          if (err) return res.status(500).json({ message: "Report could not be saved." });
          if (supportFiles.length > 0) {
            db.query("DELETE FROM tour_supporting_documents WHERE tour_report_id = ?", [existingReport.id], (deleteErr) => {
              if (deleteErr) return res.status(500).json({ message: "Old supporting documents could not be replaced." });
              saveSupportFiles(existingReport.id, supportFiles, res, () => finishReportSave(existingReport.id, res));
            });
            return;
          }
          finishReportSave(existingReport.id, res);
        }
      );
      return;
    }

    db.query(
      `INSERT INTO tour_reports
       (employee_id, sap_id, name, designation, grade, department, tour_type, purpose, start_date,
        start_time, start_place, end_date, end_time, destination, mode_of_travel, weekly_off,
        approving_authority, approval_note_path, approval_note_name, status, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${status === "Pending" ? "NOW()" : "NULL"})`,
      reportValues(req.body, employee, finalApprovalFile, status),
      (err, result) => {
        if (err) return res.status(500).json({ message: "Report could not be saved." });
        saveSupportFiles(result.insertId, supportFiles, res, () => {
          finishReportSave(result.insertId, res);
        });
      }
    );
  };

  if (reportId) {
    db.query(
      "SELECT * FROM tour_reports WHERE id = ? AND employee_id = ?",
      [reportId, employee.id],
      (err, rows) => {
        if (err) return res.status(500).json({ message: "Report could not be loaded." });
        if (rows.length === 0) return res.status(404).json({ message: "Report not found." });
        finishSave(rows[0]);
      }
    );
    return;
  }

  db.query(
    "SELECT id, status FROM tour_reports WHERE employee_id = ? AND status IN ('Draft', 'Pending', 'Rejected') ORDER BY id DESC LIMIT 1",
    [employee.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Report could not be checked." });
      if (rows.length > 0) {
        const current = rows[0];
        return res.status(409).json({
          message: `You already have a ${current.status.toLowerCase()} report. Please continue that report.`,
          report_id: current.id,
          status: current.status,
        });
      }

      finishSave();
    }
  );
};

exports.saveDraft = (req, res) => saveEmployeeReport(req, res, "Draft");

exports.submitReport = (req, res) => saveEmployeeReport(req, res, "Pending");

exports.getEmployeeReports = (req, res) => {
  db.query(
    "SELECT * FROM tour_reports WHERE employee_id = ? ORDER BY created_at DESC, id DESC",
    [req.employee.id],
    (err, reports) => {
      if (err) return res.status(500).json({ message: "Reports could not be loaded." });
      supportDocsByReport(reports, res);
    }
  );
};

exports.getReports = (req, res) => {
  const { year, status, fromDate, toDate } = req.query;
  const where = [];
  const params = [];

  if (year) {
    where.push("YEAR(tr.start_date) = ?");
    params.push(year);
  }

  if (status && status !== "all") {
    where.push("tr.status = ?");
    params.push(status);
  } else {
    where.push("tr.status <> 'Draft'");
  }

  if (fromDate) {
    where.push("tr.start_date >= ?");
    params.push(fromDate);
  }

  if (toDate) {
    where.push("tr.start_date <= ?");
    params.push(toDate);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sql = `
    SELECT tr.*, a.sap_id AS approved_by_sap, e.email AS employee_email
    FROM tour_reports tr
    LEFT JOIN admins a ON tr.approved_by = a.id
    LEFT JOIN employees e ON tr.employee_id = e.id
    ${whereSql}
    ORDER BY COALESCE(tr.submitted_at, tr.created_at) DESC, tr.id DESC
  `;

  db.query(sql, params, (err, reports) => {
    if (err) return res.status(500).json({ message: "Reports could not be loaded." });
    supportDocsByReport(reports, res);
  });
};

exports.updateStatus = (req, res) => {
  const { status, rejection_reason } = req.body;
  const { id } = req.params;

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status." });
  }

  if (status === "Rejected" && !String(rejection_reason || "").trim()) {
    return res.status(400).json({ message: "Rejection reason is required." });
  }

  db.query(
    "UPDATE tour_reports SET status = ?, rejection_reason = ?, approved_by = ?, approved_at = NOW() WHERE id = ? AND status = 'Pending'",
    [status, status === "Rejected" ? rejection_reason.trim() : null, req.admin.id, id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Status update failed." });
      if (result.affectedRows === 0) return res.status(400).json({ message: "Only pending reports can be updated." });

      db.query(
        `SELECT tr.*, e.email
         FROM tour_reports tr
         LEFT JOIN employees e ON tr.employee_id = e.id
         WHERE tr.id = ?`,
        [id],
        async (loadErr, rows) => {
          if (!loadErr && rows[0]?.email) {
            const report = rows[0];
            const reasonText = status === "Rejected" ? `\nReason: ${report.rejection_reason}` : "";
            try {
              await sendMail({
                to: report.email,
                subject: `Tour Report ${status}`,
                text: `Your tour report for ${report.destination || "your tour"} has been ${status}.${reasonText}`,
              });
            } catch {
              console.log("[email failed] status notification", { reportId: id, status });
            }
          }

          res.json({ message: `Report ${status.toLowerCase()} successfully.` });
        }
      );
    }
  );
};

exports.fileResponse = (req, res) => {
  const filePath = req.query.path;
  const mode = req.query.mode || "preview";

  if (!filePath || !filePath.startsWith("uploads/tour-reports/")) {
    return res.status(400).json({ message: "Invalid file path." });
  }

  const absolutePath = path.join(__dirname, "..", filePath);
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ message: "File not found." });
  }

  if (mode === "download") {
    return res.download(absolutePath);
  }

  res.sendFile(absolutePath);
};
