const express = require("express");
const MessageController = require("../controllers/message.controller");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(authenticate);
router.patch("/:messageId", asyncHandler(MessageController.update));
router.delete("/:messageId", asyncHandler(MessageController.remove));

module.exports = router;
