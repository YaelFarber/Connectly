const multer = require("multer");
const HttpError = require("../utils/httpError");

function notFound(req, res) {
  res.status(404).json({ code: "NOT_FOUND", message: "Route not found" });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "File is too large" : "Invalid upload";
    return res.status(400).json({ code: "UPLOAD_ERROR", message });
  }

  if (error instanceof HttpError) {
    return res.status(error.status).json({ code: error.code, message: error.message });
  }

  if (error?.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ code: "CONFLICT", message: "The value already exists" });
  }

  console.error("Unhandled server error:", error);
  res.status(500).json({ code: "SERVER_ERROR", message: "Internal server error" });
}

module.exports = { notFound, errorHandler };
