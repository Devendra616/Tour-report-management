const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { sendMail } = require("../utils/mailer");

const isEightDigitSap = (value) => /^\d{8}$/.test(String(value || ""));
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
const otpExpiryMinutes = 10;

exports.requestOtp = (req, res) => {
  const { sap_id, email } = req.body;

  if (!isEightDigitSap(sap_id)) {
    return res.status(400).json({ message: "SAP ID must be exactly 8 digits." });
  }

  if (!isEmail(email)) {
    return res.status(400).json({ message: "Please enter a valid email." });
  }

  db.query(
    "SELECT * FROM employees WHERE sap_id = ? AND email = ? AND status = 'active'",
    [sap_id, email],
    async (err, rows) => {
      if (err) {
        console.error("OTP employee lookup failed:", err.message);
        return res.status(500).json({ message: "OTP request failed." });
      }
      if (rows.length === 0) {
        return res.status(404).json({ message: "SAP ID and email are not registered." });
      }

      const employee = rows[0];
      const otp = String(Math.floor(100000 + Math.random() * 900000));

      db.query(
        "INSERT INTO employee_otps (employee_id, otp_code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))",
        [employee.id, otp, otpExpiryMinutes],
        async (otpErr) => {
          if (otpErr) {
            console.error("OTP insert failed:", otpErr.message);
            return res.status(500).json({ message: "OTP could not be created." });
          }

          try {
            const sent = await sendMail({
              to: employee.email,
              subject: "Tour Report OTP",
              text: `Your OTP for Tour Report Management is ${otp}. It is valid for ${otpExpiryMinutes} minutes.`,
            });
            if (!sent) {
              return res.status(500).json({ message: "Email is not configured. Please set SMTP details." });
            }
          } catch (mailErr) {
            console.error("OTP email failed:", mailErr.message);
            return res.status(500).json({ message: "OTP email could not be sent." });
          }

          res.json({ message: "OTP sent to registered email." });
        }
      );
    }
  );
};

exports.verifyOtp = (req, res) => {
  const { sap_id, email, otp } = req.body;

  if (!isEightDigitSap(sap_id) || !isEmail(email) || !/^\d{6}$/.test(String(otp || ""))) {
    return res.status(400).json({ message: "Invalid OTP details." });
  }

  db.query(
    "SELECT * FROM employees WHERE sap_id = ? AND email = ? AND status = 'active'",
    [sap_id, email],
    (err, employees) => {
      if (err) return res.status(500).json({ message: "OTP verification failed." });
      if (employees.length === 0) return res.status(401).json({ message: "Employee not found." });

      const employee = employees[0];
      db.query(
        `SELECT * FROM employee_otps
         WHERE employee_id = ? AND otp_code = ? AND used_at IS NULL AND expires_at > NOW()
         ORDER BY id DESC LIMIT 1`,
        [employee.id, otp],
        (otpErr, otps) => {
          if (otpErr) return res.status(500).json({ message: "OTP verification failed." });
          if (otps.length === 0) return res.status(401).json({ message: "Invalid or expired OTP." });

          db.query("UPDATE employee_otps SET used_at = NOW() WHERE id = ?", [otps[0].id]);

          const token = jwt.sign(
            {
              id: employee.id,
              sap_id: employee.sap_id,
              email: employee.email,
              role: "employee",
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
          );

          res.json({
            token,
            employee: {
              id: employee.id,
              sap_id: employee.sap_id,
              name: employee.name,
              email: employee.email,
              designation: employee.designation,
              grade: employee.grade,
              department: employee.department,
            },
          });
        }
      );
    }
  );
};
