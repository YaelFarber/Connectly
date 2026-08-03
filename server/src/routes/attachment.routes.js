const express = require("express");
const MessageController = require("../controllers/message.controller");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();
router.get("/:attachmentId", authenticate, asyncHandler(MessageController.downloadAttachment));

module.exports = router;
