const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const ConversationModel = require("../models/conversation.model");
const MessageModel = require("../models/message.model");
const UserModel = require("../models/user.model");
const HttpError = require("../utils/httpError");
const validation = require("../utils/validation");

async function requireParticipant(userId, conversationId) {
  const conversation = await ConversationModel.getForUser(conversationId, userId);
  if (!conversation) throw new HttpError(404, "Conversation not found", "NOT_FOUND");
  return conversation;
}

async function ensurePrivateMessagingAllowed(userId, conversation) {
  if (conversation.type !== "private") return;
  const otherUserId = await ConversationModel.getOtherPrivateParticipant(conversation.id, userId);
  if (!otherUserId || (await UserModel.isBlockedBetween(userId, otherUserId))) {
    throw new HttpError(403, "Messages cannot be sent in this conversation", "FORBIDDEN");
  }
}

async function list(userId, conversationId, query) {
  validation.uuid(conversationId, "conversation id");

  const conversation = await ConversationModel.getChatSummaryForUser(conversationId, userId);
  if (!conversation) throw new HttpError(404, "Conversation not found", "NOT_FOUND");

  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 30));
  let before = null;
  if (query.before) {
    const date = new Date(query.before);
    if (Number.isNaN(date.getTime())) {
      throw new HttpError(400, "Invalid message cursor", "VALIDATION_ERROR");
    }
    before = date.toISOString().slice(0, 19).replace("T", " ");
  }

  const rows = await MessageModel.list(conversationId, { limit, before });
  const items = rows.reverse().map((message) => {
    const mine = message.senderId === userId;
    return {
      id: message.id,
      mine,
      ...(mine ? {} : { senderName: message.senderName }),
      content: message.content,
      isEdited: Boolean(message.isEdited),
      isDeleted: Boolean(message.deletedAt),
      createdAt: message.createdAt,
      attachment: message.attachmentId
        ? {
            id: message.attachmentId,
            name: message.attachmentName,
            mimeType: message.attachmentMimeType,
          }
        : null,
    };
  });

  return {
    conversation: {
      name: conversation.name,
      participantCount: Number(conversation.participantCount),
    },
    items,
  };
}

async function create(userId, conversationId, input, file) {
  try {
    validation.uuid(conversationId, "conversation id");
    const conversation = await requireParticipant(userId, conversationId);
    await ensurePrivateMessagingAllowed(userId, conversation);

    const content = input.content
      ? validation.requiredString(input.content, "content", { min: 1, max: 2000 })
      : null;
    if (!content && !file) {
      throw new HttpError(400, "A message must contain text or one attachment", "VALIDATION_ERROR");
    }

    const messageType = file ? (file.mimetype.startsWith("image/") ? "image" : "file") : "text";
    const attachment = file
      ? {
          id: crypto.randomUUID(),
          originalName: path.basename(file.originalname).slice(0, 255),
          storedName: file.filename,
          filePath: file.filename,
          mimeType: file.mimetype,
          fileSize: file.size,
        }
      : null;

    const id = crypto.randomUUID();
    const createdAt = new Date();
    await MessageModel.create({
      id,
      conversationId,
      senderId: userId,
      content,
      messageType,
      attachment,
      createdAt,
    });

    return {
      id,
      attachmentId: attachment?.id || null,
    };
  } catch (error) {
    if (file) await fs.unlink(file.path).catch(() => {});
    throw error;
  }
}

async function update(userId, messageId, input) {
  validation.uuid(messageId, "message id");
  const message = await MessageModel.findById(messageId);
  if (!message) throw new HttpError(404, "Message not found", "NOT_FOUND");
  await requireParticipant(userId, message.conversationId);
  if (message.senderId !== userId) {
    throw new HttpError(403, "Only the sender may edit this message", "FORBIDDEN");
  }
  if (message.deletedAt) {
    throw new HttpError(409, "Deleted messages cannot be edited", "CONFLICT");
  }
  const content = validation.requiredString(input.content, "content", { min: 1, max: 2000 });
  await MessageModel.updateContent(messageId, content);
}

async function remove(userId, messageId) {
  validation.uuid(messageId, "message id");
  const message = await MessageModel.findById(messageId);
  if (!message) throw new HttpError(404, "Message not found", "NOT_FOUND");
  await requireParticipant(userId, message.conversationId);
  if (message.senderId !== userId) {
    throw new HttpError(403, "Only the sender may delete this message", "FORBIDDEN");
  }
  await MessageModel.softDelete(messageId);
}

async function getAttachment(userId, attachmentId) {
  validation.uuid(attachmentId, "attachment id");
  const attachment = await MessageModel.getAttachmentForUser(attachmentId, userId);
  if (!attachment || attachment.messageDeletedAt) {
    throw new HttpError(404, "Attachment not found", "NOT_FOUND");
  }
  return attachment;
}

module.exports = { list, create, update, remove, getAttachment };
