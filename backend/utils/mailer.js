const nodemailer = require("nodemailer");

const hasSmtpConfig = () =>
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  !String(process.env.SMTP_USER).includes("your_email") &&
  !String(process.env.SMTP_PASS).includes("your_app_password");

const sendMail = async ({ to, subject, text }) => {
  if (!hasSmtpConfig()) {
    console.log("[email skipped]", { to, subject, text });
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });

  return true;
};

module.exports = { sendMail };
