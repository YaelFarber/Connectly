const HttpError = require("./httpError");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/;

function requiredString(value, fieldName, { min = 1, max = 255 } = {}) {
  if (typeof value !== "string") {
    throw new HttpError(400, `${fieldName} is required`, "VALIDATION_ERROR");
  }

  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw new HttpError(
      400,
      `${fieldName} must contain between ${min} and ${max} characters`,
      "VALIDATION_ERROR"
    );
  }

  return normalized;
}

function optionalString(value, fieldName, { max = 255 } = {}) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return requiredString(value, fieldName, { min: 1, max });
}

function email(value) {
  const normalized = requiredString(value, "email", { min: 5, max: 254 }).toLowerCase();
  if (!EMAIL_PATTERN.test(normalized)) {
    throw new HttpError(400, "Invalid email address", "VALIDATION_ERROR");
  }
  return normalized;
}

function username(value) {
  const normalized = requiredString(value, "username", { min: 3, max: 30 });
  if (!USERNAME_PATTERN.test(normalized)) {
    throw new HttpError(
      400,
      "Username may contain letters, numbers, dots, underscores and hyphens",
      "VALIDATION_ERROR"
    );
  }
  return normalized;
}

function password(value, fieldName = "password") {
  if (typeof value !== "string" || value.length < 10 || value.length > 128) {
    throw new HttpError(
      400,
      `${fieldName} must contain between 10 and 128 characters`,
      "VALIDATION_ERROR"
    );
  }

  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    throw new HttpError(
      400,
      `${fieldName} must include an uppercase letter, a lowercase letter and a number`,
      "VALIDATION_ERROR"
    );
  }
  return value;
}

function uuid(value, fieldName = "id") {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new HttpError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
  return value;
}

function pagination(query, { defaultLimit = 30, maxLimit = 50 } = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, offset: (page - 1) * limit };
}

module.exports = {
  requiredString,
  optionalString,
  email,
  username,
  password,
  uuid,
  pagination,
};
