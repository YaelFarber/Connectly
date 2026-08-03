const path = require("path");
const MessageService = require("../services/message.service");

async function list(req, res) {
  res.status(200).json(
    await MessageService.list(req.user.id, req.params.conversationId, req.query)
  );
}

async function create(req, res) {
  const result = await MessageService.create(
    req.user.id,
    req.params.conversationId,
    req.body,
    req.file
  );
  res.status(201).json(result);
}

async function update(req, res) {
  await MessageService.update(req.user.id, req.params.messageId, req.body);
  res.status(204).end();
}

async function remove(req, res) {
  await MessageService.remove(req.user.id, req.params.messageId);
  res.status(204).end();
}

async function downloadAttachment(req, res) {
  const attachment = await MessageService.getAttachment(req.user.id, req.params.attachmentId);
  res.type(attachment.mimeType);
  res.setHeader(
    "Content-Disposition",
    `inline; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`
  );
  res.setHeader("Content-Length", String(attachment.fileSize));
  const safePath = path.join(__dirname, "../../uploads", path.basename(attachment.filePath));
  res.sendFile(safePath);
}

module.exports = { list, create, update, remove, downloadAttachment };
