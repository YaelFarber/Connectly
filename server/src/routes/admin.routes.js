const express = require("express");
const AdminController = require("../controllers/admin.controller");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(authenticate, requireAdmin);
router.get("/users", asyncHandler(AdminController.listUsers));
router.patch("/users/:userId/block", asyncHandler(AdminController.setBlocked));
router.get("/stats", asyncHandler(AdminController.stats));

module.exports = router;
