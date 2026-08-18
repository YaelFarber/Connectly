import { useState } from "react";
import { attachmentUrl } from "../services/api";

export default function MessageList({
  messages,
  currentUserId,
  onEdit,
  onDelete,
}) {
  const [editingMessageId, setEditingMessageId] =
    useState(null);

  const [editContent, setEditContent] = useState("");

  const [savingMessageId, setSavingMessageId] =
    useState(null);

  const [confirmingDeleteId, setConfirmingDeleteId] =
    useState(null);

  const [deletingMessageId, setDeletingMessageId] =
    useState(null);

  if (!messages.length) {
    return (
      <div className="empty-chat">
        Send the first message.
      </div>
    );
  }

  function startEditing(message) {
    setConfirmingDeleteId(null);
    setEditingMessageId(message.id);
    setEditContent(message.content || "");
  }

  function cancelEditing() {
    setEditingMessageId(null);
    setEditContent("");
  }

  async function saveEditing(message) {
    const normalizedContent = editContent.trim();

    if (!normalizedContent) {
      return;
    }

    setSavingMessageId(message.id);

    const saved = await onEdit(
      message,
      normalizedContent
    );

    setSavingMessageId(null);

    if (saved) {
      cancelEditing();
    }
  }

  function handleEditKeyDown(event, message) {
    if (event.key === "Escape") {
      cancelEditing();
      return;
    }

    if (
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey)
    ) {
      event.preventDefault();
      saveEditing(message);
    }
  }

  function startDeleteConfirmation(messageId) {
    setEditingMessageId(null);
    setEditContent("");
    setConfirmingDeleteId(messageId);
  }

  function cancelDeleteConfirmation() {
    setConfirmingDeleteId(null);
  }

  async function confirmDelete(messageId) {
    setDeletingMessageId(messageId);

    const deleted = await onDelete(messageId);

    setDeletingMessageId(null);

    if (deleted) {
      setConfirmingDeleteId(null);
    }
  }

  return (
    <div className="message-list">
      {messages.map((message) => {
        const mine =
          message.mine ??
          message.senderId === currentUserId;

        const editing =
          editingMessageId === message.id;

        const saving =
          savingMessageId === message.id;

        const confirmingDelete =
          confirmingDeleteId === message.id;

        const deleting =
          deletingMessageId === message.id;

        return (
          <article
            key={message.id}
            className={`message-bubble ${
              mine ? "mine" : ""
            }`}
          >
            {!mine && message.senderName && (
              <strong className="message-sender">
                {message.senderName}
              </strong>
            )}

            {message.isDeleted ? (
              <em className="deleted-message">
                Message deleted
              </em>
            ) : editing ? (
              <div className="message-edit-form">
                <textarea
                  value={editContent}
                  onChange={(event) =>
                    setEditContent(event.target.value)
                  }
                  onKeyDown={(event) =>
                    handleEditKeyDown(
                      event,
                      message
                    )
                  }
                  maxLength={4000}
                  disabled={saving}
                  autoFocus
                  aria-label="Edit message"
                />

                <div className="message-edit-actions">
                  <button
                    type="button"
                    className="message-cancel-button"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="message-save-button"
                    onClick={() =>
                      saveEditing(message)
                    }
                    disabled={
                      saving ||
                      !editContent.trim()
                    }
                  >
                    {saving
                      ? "Saving..."
                      : "Save"}
                  </button>
                </div>

                <small className="edit-shortcut">
                  Press Ctrl+Enter or
                  Command+Enter to save
                </small>
              </div>
            ) : (
              <>
                {message.content && (
                  <p>{message.content}</p>
                )}

                {message.attachment && (
                  <div className="attachment">
                    {message.attachment.mimeType.startsWith(
                      "image/"
                    ) && (
                      <img
                        src={attachmentUrl(
                          message.attachment.id
                        )}
                        alt={
                          message.attachment.name
                        }
                        loading="lazy"
                      />
                    )}

                    <a
                      href={attachmentUrl(
                        message.attachment.id
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {message.attachment.name}
                    </a>
                  </div>
                )}
              </>
            )}

            {confirmingDelete &&
              !message.isDeleted && (
                <div className="message-delete-confirmation">
                  <span>
                    Delete this message?
                  </span>

                  <div className="message-edit-actions">
                    <button
                      type="button"
                      className="message-cancel-button"
                      onClick={
                        cancelDeleteConfirmation
                      }
                      disabled={deleting}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="danger-button"
                      onClick={() =>
                        confirmDelete(message.id)
                      }
                      disabled={deleting}
                    >
                      {deleting
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              )}

            <footer className="message-meta">
              <span>
                {new Date(
                  message.createdAt
                ).toLocaleString()}
              </span>

              {message.isEdited &&
                !message.isDeleted && (
                  <span>edited</span>
                )}

              {mine &&
                !message.isDeleted &&
                !editing &&
                !confirmingDelete && (
                  <span className="message-actions">
                    {message.content && (
                      <button
                        type="button"
                        onClick={() =>
                          startEditing(message)
                        }
                      >
                        Edit
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        startDeleteConfirmation(
                          message.id
                        )
                      }
                    >
                      Delete
                    </button>
                  </span>
                )}
            </footer>
          </article>
        );
      })}
    </div>
  );
}