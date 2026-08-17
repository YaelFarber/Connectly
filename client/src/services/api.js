export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:3001";
const API_BASE = `${API_ORIGIN}/api`;

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function performRequest(path, options = {}) {
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
    body:
      hasBody && !isFormData && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });

  if (!response.ok) {
    let message = "The request failed";
    try {
      const text = await response.text();
      if (text) message = text;
    } catch {
      message = "The request failed";
    }
    throw new ApiError(response.status, message);
  }

  return response;
}

function resourceIdFromLocation(location) {
  if (!location) throw new Error("The server did not return a resource location");
  const parts = location.split("/").filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1]);
}

export async function apiRequest(path, options = {}) {
  const response = await performRequest(path, options);

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export async function apiCreatedResource(path, options = {}) {
  const response = await performRequest(path, options);
  return {
    id: resourceIdFromLocation(response.headers.get("Location")),
    attachmentId: response.headers.get("X-Attachment-Id") || null,
  };
}

export function attachmentUrl(attachmentId) {
  return `${API_BASE}/attachments/${attachmentId}`;
}
