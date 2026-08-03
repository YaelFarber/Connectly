export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:3001";
const API_BASE = `${API_ORIGIN}/api`;

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData = options.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
    body: hasBody && !isFormData && typeof options.body !== "string"
      ? JSON.stringify(options.body)
      : options.body,
  });

  if (!response.ok) {
    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }
    throw new ApiError(
      response.status,
      payload?.code || "REQUEST_FAILED",
      payload?.message || "The request failed"
    );
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export function attachmentUrl(attachmentId) {
  return `${API_BASE}/attachments/${attachmentId}`;
}
