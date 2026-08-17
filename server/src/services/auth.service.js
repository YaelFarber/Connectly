const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { withTransaction } = require("../config/db");
const UserModel = require("../models/user.model");
const HttpError = require("../utils/httpError");
const validation = require("../utils/validation");

function createToken(userId) {
  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: userId,
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
    algorithm: "HS256",
    issuer: "connectly-server",
    audience: "connectly-client",
  });
}

async function register(input) {
  const username = validation.username(input.username);
  const email = validation.email(input.email);
  const displayName = validation.requiredString(input.displayName, "displayName", {
    min: 2,
    max: 60,
  });
  const password = validation.password(input.password);

  if (await UserModel.existsByUsernameOrEmail(username, email)) {
    throw new HttpError(409, "Username or email already exists", "ACCOUNT_EXISTS");
  }

  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);

  await withTransaction((connection) =>
    UserModel.create(connection, { id, username, email, displayName }, passwordHash)
  );

  return { token: createToken(id) };
}

async function login(input) {
  const identifier = validation.requiredString(input.identifier, "identifier", {
    min: 3,
    max: 254,
  });
  const password = validation.requiredString(input.password, "password", {
    min: 1,
    max: 128,
  });

  const user = await UserModel.findCredentialsByIdentifier(identifier);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Invalid username, email or password", "INVALID_CREDENTIALS");
  }
  if (user.isBlocked) {
    throw new HttpError(403, "This account is blocked", "ACCOUNT_BLOCKED");
  }

  return { token: createToken(user.id) };
}

module.exports = { register, login };
