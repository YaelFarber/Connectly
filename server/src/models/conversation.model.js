const { pool, withTransaction } = require("../config/db");

async function listForUser(userId, { limit, offset }) {
  const [rows] = await pool.query(
    `SELECT c.id, c.type,
            CASE
              WHEN c.type = 'group' THEN c.name
              ELSE COALESCE(other_user.display_name, 'Private conversation')
            END AS name,
            lm.id AS lastMessageId,
            CASE
              WHEN lm.deleted_at IS NOT NULL THEN NULL
              ELSE LEFT(lm.content, 120)
            END AS lastMessagePreview,
            lm.message_type AS lastMessageType,
            (lm.deleted_at IS NOT NULL) AS lastMessageDeleted,
            lm.created_at AS lastMessageAt
     FROM conversation_participants mine
     JOIN conversations c ON c.id = mine.conversation_id
     LEFT JOIN conversation_participants other_participant
       ON c.type = 'private'
      AND other_participant.conversation_id = c.id
      AND other_participant.user_id <> ?
      AND other_participant.left_at IS NULL
     LEFT JOIN users other_user ON other_user.id = other_participant.user_id
     LEFT JOIN messages lm ON lm.id = (
       SELECT m2.id
       FROM messages m2
       WHERE m2.conversation_id = c.id
       ORDER BY m2.created_at DESC, m2.id DESC
       LIMIT 1
     )
     WHERE mine.user_id = ?
       AND mine.left_at IS NULL
     ORDER BY COALESCE(lm.created_at, c.created_at) DESC
     LIMIT ? OFFSET ?`,
    [userId, userId, limit, offset]
  );

  return rows;
}

async function getForUser(conversationId, userId) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.type,
            cp.participant_role AS currentUserRole
     FROM conversations c
     JOIN conversation_participants cp
       ON cp.conversation_id = c.id
     WHERE c.id = ?
       AND cp.user_id = ?
       AND cp.left_at IS NULL
     LIMIT 1`,
    [conversationId, userId]
  );

  return rows[0] || null;
}

async function getChatSummaryForUser(conversationId, userId) {
  const [rows] = await pool.execute(
    `SELECT c.type,
            CASE
              WHEN c.type = 'group' THEN c.name
              ELSE COALESCE(other_user.display_name, 'Private conversation')
            END AS name,
            (
              SELECT COUNT(*)
              FROM conversation_participants active_participant
              WHERE active_participant.conversation_id = c.id
                AND active_participant.left_at IS NULL
            ) AS participantCount
     FROM conversation_participants mine
     JOIN conversations c ON c.id = mine.conversation_id
     LEFT JOIN conversation_participants other_participant
       ON c.type = 'private'
      AND other_participant.conversation_id = c.id
      AND other_participant.user_id <> ?
      AND other_participant.left_at IS NULL
     LEFT JOIN users other_user ON other_user.id = other_participant.user_id
     WHERE mine.conversation_id = ?
       AND mine.user_id = ?
       AND mine.left_at IS NULL
     LIMIT 1`,
    [userId, conversationId, userId]
  );

  return rows[0] || null;
}

async function findPrivateByPairKey(pairKey) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM conversations
     WHERE type = 'private'
       AND private_pair_key = ?
     LIMIT 1`,
    [pairKey]
  );

  return rows[0] || null;
}

async function createPrivate({ id, pairKey, firstUserId, secondUserId }) {
  return withTransaction(async (connection) => {
    await connection.execute(
      `INSERT INTO conversations
         (id, type, private_pair_key, created_by)
       VALUES (?, 'private', ?, ?)`,
      [id, pairKey, firstUserId]
    );

    await connection.execute(
      `INSERT INTO conversation_participants
         (conversation_id, user_id, participant_role)
       VALUES
         (?, ?, 'member'),
         (?, ?, 'member')`,
      [id, firstUserId, id, secondUserId]
    );

    return id;
  });
}

async function createGroup({ id, name, creatorId, participantIds }) {
  return withTransaction(async (connection) => {
    await connection.execute(
      `INSERT INTO conversations
         (id, type, name, created_by)
       VALUES (?, 'group', ?, ?)`,
      [id, name, creatorId]
    );

    await connection.execute(
      `INSERT INTO conversation_participants
         (conversation_id, user_id, participant_role)
       VALUES (?, ?, 'admin')`,
      [id, creatorId]
    );

    for (const participantId of participantIds) {
      await connection.execute(
        `INSERT INTO conversation_participants
           (conversation_id, user_id, participant_role)
         VALUES (?, ?, 'member')`,
        [id, participantId]
      );
    }

    return id;
  });
}

async function updateGroup(conversationId, name) {
  await pool.execute(
    `UPDATE conversations
     SET name = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?
       AND type = 'group'`,
    [name, conversationId]
  );
}

async function addParticipant(conversationId, userId) {
  await pool.execute(
    `INSERT INTO conversation_participants
       (conversation_id, user_id, participant_role, joined_at, left_at)
     VALUES (?, ?, 'member', CURRENT_TIMESTAMP, NULL)
     ON DUPLICATE KEY UPDATE
       participant_role = 'member',
       joined_at = CURRENT_TIMESTAMP,
       left_at = NULL`,
    [conversationId, userId]
  );
}

async function removeParticipant(conversationId, userId) {
  await pool.execute(
    `UPDATE conversation_participants
     SET left_at = CURRENT_TIMESTAMP
     WHERE conversation_id = ?
       AND user_id = ?
       AND left_at IS NULL`,
    [conversationId, userId]
  );
}

async function deleteGroup(conversationId) {
  await pool.execute(
    `DELETE FROM conversations
     WHERE id = ?
       AND type = 'group'`,
    [conversationId]
  );
}

async function getOtherPrivateParticipant(conversationId, userId) {
  const [rows] = await pool.execute(
    `SELECT user_id AS userId
     FROM conversation_participants
     WHERE conversation_id = ?
       AND user_id <> ?
       AND left_at IS NULL
     LIMIT 1`,
    [conversationId, userId]
  );

  return rows[0]?.userId || null;
}

module.exports = {
  listForUser,
  getForUser,
  getChatSummaryForUser,
  findPrivateByPairKey,
  createPrivate,
  createGroup,
  updateGroup,
  addParticipant,
  removeParticipant,
  deleteGroup,
  getOtherPrivateParticipant,
};
