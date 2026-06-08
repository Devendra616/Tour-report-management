const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error("Unhandled error:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "This frontend URL is not allowed by CORS." });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Uploaded data is too large." });
  }

  res.status(err.status || 500).json({
    message: err.message || "Something went wrong.",
  });
};

module.exports = { notFound, errorHandler };
