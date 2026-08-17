const ConversationService = require("../services/conversation.service");

async function list(req, res) {
  res.status(200).json(await ConversationService.list(req.user.id, req.query));
}

async function createPrivate(req, res) {
  const result = await ConversationService.createPrivate(req.user.id, req.body);
  res
    .status(result.created ? 201 : 200)
    .set("Location", `/api/conversations/${result.id}`)
    .end();
}

async function createGroup(req, res) {
  const result = await ConversationService.createGroup(req.user.id, req.body);
  res.status(201).set("Location", `/api/conversations/${result.id}`).end();
}

async function updateGroup(req, res) {
  await ConversationService.updateGroup(req.user.id, req.params.conversationId, req.body);
  res.status(204).end();
}

async function addParticipant(req, res) {
  await ConversationService.addParticipant(req.user.id, req.params.conversationId, req.body);
  res.status(204).end();
}

async function removeParticipant(req, res) {
  await ConversationService.removeParticipant(
    req.user.id,
    req.params.conversationId,
    req.params.userId
  );
  res.status(204).end();
}

async function leave(req, res) {
  await ConversationService.leave(req.user.id, req.params.conversationId);
  res.status(204).end();
}

async function removeGroup(req, res) {
  await ConversationService.deleteGroup(req.user.id, req.params.conversationId);
  res.status(204).end();
}

module.exports = {
  list,
  createPrivate,
  createGroup,
  updateGroup,
  addParticipant,
  removeParticipant,
  leave,
  removeGroup,
};
