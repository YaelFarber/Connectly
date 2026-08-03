require("dotenv").config();

const app = require("./app");
const { testConnection } = require("./config/db");

const PORT = Number(process.env.PORT || 3001);

function validateEnvironment() {
  const required = ["DB_HOST", "DB_USER", "DB_NAME", "JWT_SECRET"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }
}

async function start() {
  validateEnvironment();
  await testConnection();
  app.listen(PORT, () => {
    console.log(`Connectly server is running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});
