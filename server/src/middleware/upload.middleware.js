const crypto = require("crypto");
const path = require("path");
const multer = require("multer");
const HttpError = require("../utils/httpError");

const ALLOWED_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["application/pdf", ".pdf"],
  ["text/plain", ".txt"],
]);

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"),
  filename: (req, file, callback) => {
    const extension = ALLOWED_TYPES.get(file.mimetype) || "";
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return callback(new HttpError(415, "Unsupported file type", "UNSUPPORTED_MEDIA_TYPE"));
    }
    callback(null, true);
  },
});

module.exports = upload;
