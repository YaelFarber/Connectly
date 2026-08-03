const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const ConversationModel = require("../models/conversation.model");
const UserModel = require("../models/user.model");
const MessageModel = require("../models/message.model");
const HttpError = require("../utils/httpError");
const validation = require("../utils/validation");

function privatePairKey(firstId, secondId) {
  return [firstId, secondId].sort().join(":");
}

async function list(userId, query) {
  const { page, limit, offset } = validation.pagination(query, {
    defaultLimit: 30,
    maxLimit: 50,
  });
  const rows = await ConversationModel.listForUser(userId, { limit: limit + 1, offset });
  const hasMore = rows.length > limit;
  return { items: rows.slice(0, limit), page, hasMore };
}

async function getDetails(userId, conversationId) {
  validation.uuid(conversationId, "conversation id");
  const conversation = await ConversationModel.getForUser(conversationId, userId);
  if (!conversation) throw new HttpError(404, "Conversation not found", "NOT_FOUND");

  const participants = await ConversationModel.getParticipants(conversationId);
  let name = conversation.name;
  if (conversation.type === "private") {
    const other = participants.find((participant) => participant.id !== userId);
    name = other?.displayName || other?.username || "Private conversation";
  }

  return { ...conversation, name, participants };
}

async function createPrivate(userId, input) {
  const targetId = validation.uuid(input.userId, "user id");
  if (userId === targetId) {
    throw new HttpError(400, "You cannot create a conversation with yourself", "VALIDATION_ERROR");
  }
  const target = await UserModel.findAuthById(targetId);
  if (!target || target.isBlocked) throw new HttpError(404, "User not found", "NOT_FOUND");
  if (await UserModel.isBlockedBetween(userId, targetId)) {
    throw new HttpError(403, "A conversation cannot be created between these users", "FORBIDDEN");
  }

  const pairKey = privatePairKey(userId, targetId);
  const existing = await ConversationModel.findPrivateByPairKey(pairKey);
  if (existing) return { id: existing.id, created: false };

  const id = crypto.randomUUID();
  try {
    await ConversationModel.createPrivate({
      id,
      pairKey,
      firstUserId: userId,
      secondUserId: targetId,
    });
    return { id, created: true };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const duplicate = await ConversationModel.findPrivateByPairKey(pairKey);
      if (duplicate) return { id: duplicate.id, created: false };
    }
    throw error;
  }
}

async function createGroup(userId, input) {
  const name = validation.requiredString(input.name, "name", { min: 2, max: 80 });
  if (!Array.isArray(input.participantIds)) {
    throw new HttpError(400, "participantIds must be an array", "VALIDATION_ERROR");
  }

  const participantIds = [...new Set(input.participantIds)]
    .filter((id) => id !== userId)
    .map((id) => validation.uuid(id, "participant id"));

  if (participantIds.length < 1 || participantIds.length > 49) {
    throw new HttpError(400, "A group requires between 1 and 49 additional members", "VALIDATION_ERROR");
  }

  for (const participantId of participantIds) {
    const participant = await UserModel.findAuthById(participantId);
    if (!participant || participant.isBlocked) {
      throw new HttpError(400, "One or more participants are unavailable", "VALIDATION_ERROR");
    }
    if (await UserModel.isBlockedBetween(userId, participantId)) {
      throw new HttpError(403, "A blocked user cannot be added to the group", "FORBIDDEN");
    }
  }

  const id = crypto.randomUUID();
  await ConversationModel.createGroup({ id, name, creatorId: userId, participantIds });
  return { id };
}

async function requireGroupAdmin(userId, conversationId) {
  const conversation = await ConversationModel.getForUser(conversationId, userId);
  if (!conversation || conversation.type !== "group") {
    throw new HttpError(404, "Group not found", "NOT_FOUND");
  }
  if (conversation.currentUserRole !== "admin") {
    throw new HttpError(403, "Group administrator permission required", "FORBIDDEN");
  }
  return conversation;
}

async function updateGroup(userId, conversationId, input) {
  validation.uuid(conversationId, "conversation id");
  await requireGroupAdmin(userId, conversationId);
  const name = validation.requiredString(input.name, "name", { min: 2, max: 80 });
  await ConversationModel.updateGroup(conversationId, name);
}

async function addParticipant(userId, conversationId, input) {
  validation.uuid(conversationId, "conversation id");
  await requireGroupAdmin(userId, conversationId);
  const targetId = validation.uuid(input.userId, "user id");
  const target = await UserModel.findAuthById(targetId);
  if (!target || target.isBlocked) throw new HttpError(404, "User not found", "NOT_FOUND");
  if (await UserModel.isBlockedBetween(userId, targetId)) {
    throw new HttpError(403, "A blocked user cannot be added", "FORBIDDEN");
  }
  await ConversationModel.addParticipant(conversationId, targetId);
}

async function removeParticipant(userId, conversationId, targetId) {
  validation.uuid(conversationId, "conversation id");
  validation.uuid(targetId, "user id");
  await requireGroupAdmin(userId, conversationId);
  if (userId === targetId) {
    throw new HttpError(400, "Use the leave endpoint to leave a group", "VALIDATION_ERROR");
  }
  await ConversationModel.removeParticipant(conversationId, targetId);
}

async function leave(userId, conversationId) {
  validation.uuid(conversationId, "conversation id");
  const conversation = await ConversationModel.getForUser(conversationId, userId);
  if (!conversation || conversation.type !== "group") {
    throw new HttpError(404, "Group not found", "NOT_FOUND");
  }
  await ConversationModel.removeParticipant(conversationId, userId);
}

async function deleteGroup(userId, conversationId) {
  validation.uuid(conversationId, "conversation id");
  await requireGroupAdmin(userId, conversationId);
  const attachmentPaths = await MessageModel.listAttachmentPathsByConversation(conversationId);
  await ConversationModel.deleteGroup(conversationId);
  const uploadsDirectory = path.join(__dirname, "../../uploads");
  await Promise.all(
    attachmentPaths.map((filePath) =>
      fs.unlink(path.join(uploadsDirectory, path.basename(filePath))).catch(() => {})
    )
  );
}

module.exports = {
  list,
  getDetails,
  createPrivate,
  createGroup,
  updateGroup,
  addParticipant,
  removeParticipant,
  leave,
  deleteGroup,
};
