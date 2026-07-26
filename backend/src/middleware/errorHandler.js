function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error("[error]", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate entry", detail: err.keyValue });
  }
  if (err.name === "MulterError") {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
  });
}

module.exports = { notFound, errorHandler };
