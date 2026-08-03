require("dotenv").config();

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { withTransaction, testConnection, pool } = require("../config/db");
const UserModel = require("../models/user.model");
const validation = require("../utils/validation");

async function main() {
  const username = validation.username(process.env.ADMIN_USERNAME);
  const email = validation.email(process.env.ADMIN_EMAIL);
  const displayName = validation.requiredString(process.env.ADMIN_DISPLAY_NAME, "ADMIN_DISPLAY_NAME", {
    min: 2,
    max: 60,
  });
  const password = validation.password(process.env.ADMIN_PASSWORD, "ADMIN_PASSWORD");

  await testConnection();
  if (await UserModel.existsByUsernameOrEmail(username, email)) {
    throw new Error("An account with this username or email already exists");
  }

  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);
  await withTransaction(async (connection) => {
    await UserModel.create(connection, { id, username, email, displayName }, passwordHash);
    await connection.execute("UPDATE users SET role = 'admin' WHERE id = ?", [id]);
  });
  console.log(`Administrator created: ${username}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
