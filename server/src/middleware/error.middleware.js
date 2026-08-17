const multer = require("multer");
const HttpError = require("../utils/httpError");

function notFound(req, res) {
  res.status(404).type("text/plain").send("Route not found");
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "File is too large" : "Invalid upload";
    return res.status(400).type("text/plain").send(message);
  }

  if (error instanceof HttpError) {
    return res.status(error.status).type("text/plain").send(error.message);
  }

  if (error?.code === "ER_DUP_ENTRY") {
    return res.status(409).type("text/plain").send("The value already exists");
  }

  console.error("Unhandled server error:", error);
  res.status(500).type("text/plain").send("Internal server error");
}

module.exports = { notFound, errorHandler };
