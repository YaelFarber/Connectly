const { pool, withTransaction } = require("../config/db");

async function list(conversationId, { limit, before }) {
  const params = [conversationId];
  let cursorClause = "";

  if (before) {
    cursorClause = "AND m.created_at < ?";
    params.push(before);
  }

  params.push(limit);

  const [rows] = await pool.query(
    `SELECT m.id,
            m.sender_id AS senderId,
            u.display_name AS senderName,
            CASE
              WHEN m.deleted_at IS NULL THEN m.content
              ELSE NULL
            END AS content,
            m.is_edited AS isEdited,
            m.deleted_at AS deletedAt,
            m.created_at AS createdAt,
            CASE
              WHEN m.deleted_at IS NULL THEN a.id
              ELSE NULL
            END AS attachmentId,
            CASE
              WHEN m.deleted_at IS NULL THEN a.original_name
              ELSE NULL
            END AS attachmentName,
            CASE
              WHEN m.deleted_at IS NULL THEN a.mime_type
              ELSE NULL
            END AS attachmentMimeType
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     LEFT JOIN message_attachments a ON a.message_id = m.id
     WHERE m.conversation_id = ?
       ${cursorClause}
     ORDER BY m.created_at DESC, m.id DESC
     LIMIT ?`,
    params
  );

  return rows;
}

async function create({
  id,
  conversationId,
  senderId,
  content,
  messageType,
  attachment,
  createdAt,
}) {
  return withTransaction(async (connection) => {
    await connection.execute(
      `INSERT INTO messages
         (id, conversation_id, sender_id, content, message_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, conversationId, senderId, content, messageType, createdAt, createdAt]
    );

    if (attachment) {
      await connection.execute(
        `INSERT INTO message_attachments
           (id, message_id, original_name, stored_name, file_path, mime_type, file_size)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          attachment.id,
          id,
          attachment.originalName,
          attachment.storedName,
          attachment.filePath,
          attachment.mimeType,
          attachment.fileSize,
        ]
      );
    }

    await connection.execute(
      `UPDATE conversations
       SET updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [conversationId]
    );

    return id;
  });
}

async function findById(messageId) {
  const [rows] = await pool.execute(
    `SELECT id,
            conversation_id AS conversationId,
            sender_id AS senderId,
            deleted_at AS deletedAt
     FROM messages
     WHERE id = ?
     LIMIT 1`,
    [messageId]
  );

  return rows[0] || null;
}

async function updateContent(messageId, content) {
  await pool.execute(
    `UPDATE messages
     SET content = ?,
         is_edited = TRUE,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?
       AND deleted_at IS NULL`,
    [content, messageId]
  );
}

async function softDelete(messageId) {
  await pool.execute(
    `UPDATE messages
     SET content = NULL,
         deleted_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?
       AND deleted_at IS NULL`,
    [messageId]
  );
}

async function getAttachmentForUser(attachmentId, userId) {
  const [rows] = await pool.execute(
    `SELECT a.original_name AS originalName,
            a.file_path AS filePath,
            a.mime_type AS mimeType,
            a.file_size AS fileSize,
            m.deleted_at AS messageDeletedAt
     FROM message_attachments a
     JOIN messages m ON m.id = a.message_id
     JOIN conversation_participants cp
       ON cp.conversation_id = m.conversation_id
     WHERE a.id = ?
       AND cp.user_id = ?
       AND cp.left_at IS NULL
     LIMIT 1`,
    [attachmentId, userId]
  );

  return rows[0] || null;
}

async function listAttachmentPathsByConversation(conversationId) {
  const [rows] = await pool.execute(
    `SELECT a.file_path AS filePath
     FROM message_attachments a
     JOIN messages m ON m.id = a.message_id
     WHERE m.conversation_id = ?`,
    [conversationId]
  );

  return rows.map((row) => row.filePath);
}

module.exports = {
  list,
  create,
  findById,
  updateContent,
  softDelete,
  getAttachmentForUser,
  listAttachmentPathsByConversation,
};
