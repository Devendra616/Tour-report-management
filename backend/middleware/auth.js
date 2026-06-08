const jwt = require("jsonwebtoken");

const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const verifyAdminFileAccess = (req, res, next) => {
  const bearerToken = req.headers.authorization?.split(" ")[1];
  const token = bearerToken || req.query.token;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const verifyEmployee = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "employee") {
      return res.status(403).json({ message: "Employee access required" });
    }
    req.employee = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { verifyAdmin, verifyAdminFileAccess, verifyEmployee };
