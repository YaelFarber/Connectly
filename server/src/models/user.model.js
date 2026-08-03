const { pool } = require("../config/db");

async function findAuthById(id) {
  const [rows] = await pool.execute(
    `SELECT id, username, display_name AS displayName, role, is_blocked AS isBlocked
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function findPublicById(id) {
  const [rows] = await pool.execute(
    `SELECT id, username, email, display_name AS displayName, bio, role
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function findCredentialsByIdentifier(identifier) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.role, u.is_blocked AS isBlocked,
            up.password_hash AS passwordHash
     FROM users u
     JOIN user_passwords up ON up.user_id = u.id
     WHERE u.username = ? OR u.email = ?
     LIMIT 1`,
    [identifier, identifier.toLowerCase()]
  );
  return rows[0] || null;
}

async function existsByUsernameOrEmail(username, email) {
  const [rows] = await pool.execute(
    `SELECT 1
     FROM users
     WHERE username = ? OR email = ?
     LIMIT 1`,
    [username, email]
  );
  return rows.length > 0;
}

async function create(connection, user, passwordHash) {
  await connection.execute(
    `INSERT INTO users (id, username, email, display_name, role)
     VALUES (?, ?, ?, ?, 'user')`,
    [user.id, user.username, user.email, user.displayName]
  );

  await connection.execute(
    `INSERT INTO user_passwords (user_id, password_hash)
     VALUES (?, ?)`,
    [user.id, passwordHash]
  );
}

async function search({ currentUserId, search, limit, offset }) {
  const pattern = `%${search}%`;
  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.display_name AS displayName
     FROM users u
     WHERE u.id <> ?
       AND u.is_blocked = FALSE
       AND (u.username LIKE ? OR u.display_name LIKE ?)
       AND NOT EXISTS (
         SELECT 1
         FROM blocked_users b
         WHERE (b.blocker_id = ? AND b.blocked_id = u.id)
            OR (b.blocker_id = u.id AND b.blocked_id = ?)
       )
     ORDER BY u.display_name, u.username
     LIMIT ? OFFSET ?`,
    [currentUserId, pattern, pattern, currentUserId, currentUserId, limit, offset]
  );
  return rows;
}

async function updateProfile(id, { email, displayName, bio }) {
  await pool.execute(
    `UPDATE users
     SET email = ?, display_name = ?, bio = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [email, displayName, bio, id]
  );
}

async function getPasswordHash(id) {
  const [rows] = await pool.execute(
    `SELECT password_hash AS passwordHash
     FROM user_passwords
     WHERE user_id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0]?.passwordHash || null;
}

async function updatePassword(id, passwordHash) {
  await pool.execute(
    `UPDATE user_passwords
     SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [passwordHash, id]
  );
}

async function block(blockerId, blockedId) {
  await pool.execute(
    `INSERT IGNORE INTO blocked_users (blocker_id, blocked_id)
     VALUES (?, ?)`,
    [blockerId, blockedId]
  );
}

async function unblock(blockerId, blockedId) {
  await pool.execute(
    `DELETE FROM blocked_users
     WHERE blocker_id = ? AND blocked_id = ?`,
    [blockerId, blockedId]
  );
}

async function isBlockedBetween(firstId, secondId) {
  const [rows] = await pool.execute(
    `SELECT 1
     FROM blocked_users
     WHERE (blocker_id = ? AND blocked_id = ?)
        OR (blocker_id = ? AND blocked_id = ?)
     LIMIT 1`,
    [firstId, secondId, secondId, firstId]
  );
  return rows.length > 0;
}

async function adminList({ search, limit, offset }) {
  const pattern = `%${search}%`;
  const [rows] = await pool.execute(
    `SELECT id, username, email, display_name AS displayName,
            role, is_blocked AS isBlocked, created_at AS createdAt
     FROM users
     WHERE username LIKE ? OR email LIKE ? OR display_name LIKE ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [pattern, pattern, pattern, limit, offset]
  );
  return rows;
}

async function setBlocked(id, blocked) {
  await pool.execute(
    `UPDATE users
     SET is_blocked = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [blocked, id]
  );
}

async function getStats() {
  const [[users]] = await pool.query(
    `SELECT COUNT(*) AS totalUsers,
            COALESCE(SUM(role = 'admin'), 0) AS admins,
            COALESCE(SUM(is_blocked = TRUE), 0) AS blockedUsers
     FROM users`
  );
  const [[conversations]] = await pool.query(
    `SELECT COUNT(*) AS totalConversations,
            COALESCE(SUM(type = 'group'), 0) AS groups
     FROM conversations`
  );
  const [[messages]] = await pool.query(
    `SELECT COUNT(*) AS totalMessages
     FROM messages
     WHERE deleted_at IS NULL`
  );
  return { ...users, ...conversations, ...messages };
}

module.exports = {
  findAuthById,
  findPublicById,
  findCredentialsByIdentifier,
  existsByUsernameOrEmail,
  create,
  search,
  updateProfile,
  getPasswordHash,
  updatePassword,
  block,
  unblock,
  isBlockedBetween,
  adminList,
  setBlocked,
  getStats,
};
