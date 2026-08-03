const UserModel = require("../models/user.model");
const UserService = require("../services/user.service");

async function listUsers(req, res) {
  res.status(200).json(await UserService.listForAdmin(req.query));
}

async function setBlocked(req, res) {
  await UserService.setBlockedByAdmin(req.user.id, req.params.userId, req.body.blocked);
  res.status(204).end();
}

async function stats(req, res) {
  res.status(200).json(await UserModel.getStats());
}

module.exports = { listUsers, setBlocked, stats };
