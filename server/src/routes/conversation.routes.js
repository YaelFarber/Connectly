const express = require("express");
const ConversationController = require("../controllers/conversation.controller");
const MessageController = require("../controllers/message.controller");
const upload = require("../middleware/upload.middleware");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(authenticate);

router.get("/", asyncHandler(ConversationController.list));
router.post("/private", asyncHandler(ConversationController.createPrivate));
router.post("/groups", asyncHandler(ConversationController.createGroup));
router.patch("/:conversationId", asyncHandler(ConversationController.updateGroup));
router.delete("/:conversationId", asyncHandler(ConversationController.removeGroup));

router.post(
  "/:conversationId/participants",
  asyncHandler(ConversationController.addParticipant)
);
router.delete("/:conversationId/participants/me", asyncHandler(ConversationController.leave));
router.delete(
  "/:conversationId/participants/:userId",
  asyncHandler(ConversationController.removeParticipant)
);

router.get("/:conversationId/messages", asyncHandler(MessageController.list));
router.post(
  "/:conversationId/messages",
  upload.single("attachment"),
  asyncHandler(MessageController.create)
);

module.exports = router;
