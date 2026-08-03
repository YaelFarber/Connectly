const bcrypt = require("bcryptjs");
const UserModel = require("../models/user.model");
const HttpError = require("../utils/httpError");
const validation = require("../utils/validation");

async function getMe(userId) {
  const user = await UserModel.findPublicById(userId);
  if (!user) throw new HttpError(404, "User not found", "NOT_FOUND");
  return user;
}

async function searchUsers(userId, query) {
  const { page, limit, offset } = validation.pagination(query, {
    defaultLimit: 20,
    maxLimit: 30,
  });
  const search = typeof query.search === "string" ? query.search.trim().slice(0, 60) : "";
  const rows = await UserModel.search({ currentUserId: userId, search, limit: limit + 1, offset });
  const hasMore = rows.length > limit;
  return { items: rows.slice(0, limit), page, hasMore };
}

async function updateProfile(userId, input) {
  const current = await getMe(userId);
  const email = input.email === undefined ? current.email : validation.email(input.email);
  const displayName =
    input.displayName === undefined
      ? current.displayName
      : validation.requiredString(input.displayName, "displayName", { min: 2, max: 60 });
  const bio =
    input.bio === undefined
      ? current.bio
      : validation.optionalString(input.bio, "bio", { max: 300 });

  await UserModel.updateProfile(userId, { email, displayName, bio });
}

async function changePassword(userId, input) {
  const currentPassword = validation.requiredString(input.currentPassword, "currentPassword", {
    min: 1,
    max: 128,
  });
  const newPassword = validation.password(input.newPassword, "newPassword");
  const currentHash = await UserModel.getPasswordHash(userId);

  if (!currentHash || !(await bcrypt.compare(currentPassword, currentHash))) {
    throw new HttpError(401, "Current password is incorrect", "INVALID_CREDENTIALS");
  }
  if (await bcrypt.compare(newPassword, currentHash)) {
    throw new HttpError(400, "New password must be different", "VALIDATION_ERROR");
  }

  await UserModel.updatePassword(userId, await bcrypt.hash(newPassword, 12));
}

async function blockUser(userId, targetId) {
  validation.uuid(targetId, "user id");
  if (userId === targetId) {
    throw new HttpError(400, "You cannot block yourself", "VALIDATION_ERROR");
  }
  if (!(await UserModel.findAuthById(targetId))) {
    throw new HttpError(404, "User not found", "NOT_FOUND");
  }
  await UserModel.block(userId, targetId);
}

async function unblockUser(userId, targetId) {
  validation.uuid(targetId, "user id");
  await UserModel.unblock(userId, targetId);
}

async function listForAdmin(query) {
  const { page, limit, offset } = validation.pagination(query, {
    defaultLimit: 25,
    maxLimit: 50,
  });
  const search = typeof query.search === "string" ? query.search.trim().slice(0, 60) : "";
  const rows = await UserModel.adminList({ search, limit: limit + 1, offset });
  const hasMore = rows.length > limit;
  return { items: rows.slice(0, limit), page, hasMore };
}

async function setBlockedByAdmin(adminId, targetId, blocked) {
  validation.uuid(targetId, "user id");
  if (typeof blocked !== "boolean") {
    throw new HttpError(400, "blocked must be a boolean", "VALIDATION_ERROR");
  }
  if (adminId === targetId) {
    throw new HttpError(400, "Administrators cannot block themselves", "VALIDATION_ERROR");
  }
  const target = await UserModel.findAuthById(targetId);
  if (!target) throw new HttpError(404, "User not found", "NOT_FOUND");
  if (target.role === "admin") {
    throw new HttpError(403, "Administrator accounts cannot be blocked here", "FORBIDDEN");
  }
  await UserModel.setBlocked(targetId, Boolean(blocked));
}

module.exports = {
  getMe,
  searchUsers,
  updateProfile,
  changePassword,
  blockUser,
  unblockUser,
  listForAdmin,
  setBlockedByAdmin,
};
