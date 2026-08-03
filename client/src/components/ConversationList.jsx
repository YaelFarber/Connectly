import { NavLink } from "react-router-dom";

function preview(conversation) {
  if (!conversation.lastMessageId) return "No messages yet";
  if (conversation.lastMessageDeleted) return "Message deleted";
  if (conversation.lastMessagePreview) return conversation.lastMessagePreview;
  return conversation.lastMessageType === "image" ? "Image" : "File";
}

export default function ConversationList({ conversations, loading }) {
  if (loading) return <div className="panel-state">Loading conversations...</div>;
  if (!conversations.length) return <div className="panel-state">No conversations yet.</div>;

  return (
    <div className="conversation-list">
      {conversations.map((conversation) => (
        <NavLink
          key={conversation.id}
          to={`/chats/${conversation.id}`}
          className={({ isActive }) => `conversation-item ${isActive ? "active" : ""}`}
        >
          <div className="conversation-avatar">
            {conversation.type === "group" ? "G" : conversation.name?.charAt(0)?.toUpperCase() || "C"}
          </div>
          <div className="conversation-copy">
            <strong>{conversation.name}</strong>
            <span>{preview(conversation)}</span>
          </div>
        </NavLink>
      ))}
    </div>
  );
}
