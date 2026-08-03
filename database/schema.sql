-- Connectly database schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS connectly_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE connectly_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS message_attachments;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversation_participants;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS blocked_users;
DROP TABLE IF EXISTS user_passwords;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  username VARCHAR(30) NOT NULL,
  email VARCHAR(254) NOT NULL,
  display_name VARCHAR(60) NOT NULL,
  bio VARCHAR(300) NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_username UNIQUE (username),
  CONSTRAINT uq_users_email UNIQUE (email),
  INDEX idx_users_display_name (display_name),
  INDEX idx_users_created_at (created_at)
) ENGINE = InnoDB;

-- Credentials are isolated from profile data. Only password hashes are stored.
CREATE TABLE user_passwords (
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_passwords_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE blocked_users (
  blocker_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  blocked_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT chk_no_self_block CHECK (blocker_id <> blocked_id),
  CONSTRAINT fk_blocks_blocker
    FOREIGN KEY (blocker_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_blocks_blocked
    FOREIGN KEY (blocked_id) REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_blocks_blocked_id (blocked_id)
) ENGINE = InnoDB;

CREATE TABLE conversations (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  type ENUM('private', 'group') NOT NULL,
  name VARCHAR(80) NULL,
  private_pair_key VARCHAR(73) CHARACTER SET ascii COLLATE ascii_bin NULL,
  created_by CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_private_pair UNIQUE (private_pair_key),
  CONSTRAINT chk_conversation_shape CHECK (
    (type = 'private' AND name IS NULL AND private_pair_key IS NOT NULL)
    OR
    (type = 'group' AND name IS NOT NULL AND private_pair_key IS NULL)
  ),
  CONSTRAINT fk_conversations_creator
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT,
  INDEX idx_conversations_updated_at (updated_at)
) ENGINE = InnoDB;

CREATE TABLE conversation_participants (
  conversation_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  participant_role ENUM('member', 'admin') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL,
  PRIMARY KEY (conversation_id, user_id),
  CONSTRAINT fk_participants_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_participants_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_participants_user_active (user_id, left_at)
) ENGINE = InnoDB;

CREATE TABLE messages (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  conversation_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  sender_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  content VARCHAR(2000) NULL,
  message_type ENUM('text', 'image', 'file') NOT NULL DEFAULT 'text',
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  INDEX idx_messages_conversation_time (conversation_id, created_at, id),
  INDEX idx_messages_sender (sender_id)
) ENGINE = InnoDB;

CREATE TABLE message_attachments (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  message_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  file_size INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_attachment_message UNIQUE (message_id),
  CONSTRAINT fk_attachments_message
    FOREIGN KEY (message_id) REFERENCES messages(id)
    ON DELETE CASCADE
) ENGINE = InnoDB;
