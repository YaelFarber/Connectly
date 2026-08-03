const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");
const HttpError = require("../utils/httpError");
const { COOKIE_NAME, readCookie } = require("../utils/authCookie");

async function authenticate(req, res, next) {
  try {
    const token = readCookie(req, COOKIE_NAME);
    if (!token) {
      throw new HttpError(401, "Authentication required", "AUTH_REQUIRED");
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "connectly-server",
      audience: "connectly-client",
    });

    const user = await UserModel.findAuthById(payload.sub);
    if (!user) {
      throw new HttpError(401, "Invalid session", "INVALID_SESSION");
    }
    if (user.isBlocked) {
      throw new HttpError(403, "This account is blocked", "ACCOUNT_BLOCKED");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return next(new HttpError(401, "Invalid session", "INVALID_SESSION"));
    }
    next(error);
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return next(new HttpError(403, "Administrator permission required", "FORBIDDEN"));
  }
  next();
}

module.exports = { authenticate, requireAdmin };
