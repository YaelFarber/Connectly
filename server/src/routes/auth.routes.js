const express = require("express");
const AuthController = require("../controllers/auth.controller");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth.middleware");
const { createRateLimiter } = require("../middleware/security.middleware");

const router = express.Router();
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: "Too many authentication attempts. Please try again later.",
});

router.post("/register", authLimiter, asyncHandler(AuthController.register));
router.post("/login", authLimiter, asyncHandler(AuthController.login));
router.post("/logout", asyncHandler(AuthController.logout));
router.get("/me", authenticate, asyncHandler(AuthController.me));

module.exports = router;
