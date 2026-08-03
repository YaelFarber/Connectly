const AuthService = require("../services/auth.service");
const UserService = require("../services/user.service");
const { setAuthCookie, clearAuthCookie } = require("../utils/authCookie");

async function register(req, res) {
  const result = await AuthService.register(req.body);
  setAuthCookie(res, result.token);
  res.status(201).end();
}

async function login(req, res) {
  const result = await AuthService.login(req.body);
  setAuthCookie(res, result.token);
  res.status(204).end();
}

async function logout(req, res) {
  clearAuthCookie(res);
  res.status(204).end();
}

async function me(req, res) {
  res.status(200).json(await UserService.getMe(req.user.id));
}

module.exports = { register, login, logout, me };
