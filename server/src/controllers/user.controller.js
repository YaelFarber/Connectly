const UserService = require("../services/user.service");

async function getMe(req, res) {
  res.status(200).json(await UserService.getOwnProfile(req.user.id));
}

async function search(req, res) {
  res.status(200).json(await UserService.searchUsers(req.user.id, req.query));
}

async function updateMe(req, res) {
  await UserService.updateProfile(req.user.id, req.body);
  res.status(204).end();
}

async function changePassword(req, res) {
  await UserService.changePassword(req.user.id, req.body);
  res.status(204).end();
}

async function block(req, res) {
  await UserService.blockUser(req.user.id, req.params.userId);
  res.status(204).end();
}

async function unblock(req, res) {
  await UserService.unblockUser(req.user.id, req.params.userId);
  res.status(204).end();
}

module.exports = { getMe, search, updateMe, changePassword, block, unblock };
