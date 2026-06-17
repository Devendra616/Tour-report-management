const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tour_report_management",
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'local',
  dateStrings: true
};



const db = mysql.createPool(dbConfig);


db.query("SELECT 1", (err) => {
  if (err) {
    console.error("Database connection failed:", err.code || err.message);
    return;
  }
  console.log("MySQL database connected");
});

module.exports = db;

