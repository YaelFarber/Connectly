import { attachmentUrl } from "../services/api";

export default function MessageList({ messages, currentUserId, onEdit, onDelete }) {
  if (!messages.length) return <div className="empty-chat">Send the first message.</div>;

  return (
    <div className="message-list">
      {messages.map((message) => {
        const mine = message.senderId === currentUserId;
        return (
          <article key={message.id} className={`message-bubble ${mine ? "mine" : ""}`}>
            {!mine && <strong className="message-sender">{message.senderName}</strong>}
            {message.isDeleted ? (
              <em className="deleted-message">Message deleted</em>
            ) : (
              <>
                {message.content && <p>{message.content}</p>}
                {message.attachment && (
                  <div className="attachment">
                    {message.attachment.mimeType.startsWith("image/") && (
                      <img
                        src={attachmentUrl(message.attachment.id)}
                        alt={message.attachment.name}
                        loading="lazy"
                      />
                    )}
                    <a
                      href={attachmentUrl(message.attachment.id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {message.attachment.name}
                    </a>
                  </div>
                )}
              </>
            )}
            <footer className="message-meta">
              <span>{new Date(message.createdAt).toLocaleString()}</span>
              {message.isEdited && !message.isDeleted && <span>edited</span>}
              {mine && !message.isDeleted && (
                <span className="message-actions">
                  {message.content && <button type="button" onClick={() => onEdit(message)}>Edit</button>}
                  <button type="button" onClick={() => onDelete(message.id)}>Delete</button>
                </span>
              )}
            </footer>
          </article>
        );
      })}
    </div>
  );
}
