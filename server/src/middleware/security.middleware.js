function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Cache-Control", "no-store");
  next();
}

function verifyRequestOrigin(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";
  if (origin && origin !== allowedOrigin) {
    return res.status(403).json({ code: "INVALID_ORIGIN", message: "Request origin is not allowed" });
  }
  next();
}

function createRateLimiter({ windowMs, max, message }) {
  const clients = new Map();

  return (req, res, next) => {
    const now = Date.now();
    if (clients.size > 10000) {
      for (const [clientKey, entry] of clients) {
        if (entry.resetAt <= now) clients.delete(clientKey);
      }
    }
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const current = clients.get(key);

    if (!current || current.resetAt <= now) {
      clients.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ code: "RATE_LIMITED", message });
    }

    next();
  };
}

module.exports = { securityHeaders, verifyRequestOrigin, createRateLimiter };
