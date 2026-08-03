const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const conversationRoutes = require("./routes/conversation.routes");
const messageRoutes = require("./routes/message.routes");
const attachmentRoutes = require("./routes/attachment.routes");
const adminRoutes = require("./routes/admin.routes");
const healthRoutes = require("./routes/health.routes");
const {
  securityHeaders,
  verifyRequestOrigin,
  createRateLimiter,
} = require("./middleware/security.middleware");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();
app.disable("x-powered-by");

app.use(securityHeaders);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    exposedHeaders: ["Location"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(verifyRequestOrigin);
app.use(
  createRateLimiter({
    windowMs: 60 * 1000,
    max: 180,
    message: "Too many requests. Please slow down.",
  })
);
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/attachments", attachmentRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
