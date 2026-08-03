const express = require("express");
const UserController = require("../controllers/user.controller");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(authenticate);

router.get("/", asyncHandler(UserController.search));
router.patch("/me", asyncHandler(UserController.updateMe));
router.patch("/me/password", asyncHandler(UserController.changePassword));
router.post("/:userId/block", asyncHandler(UserController.block));
router.delete("/:userId/block", asyncHandler(UserController.unblock));

module.exports = router;
