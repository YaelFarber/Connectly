import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ConversationList from "../components/ConversationList";
import ErrorMessage from "../components/ErrorMessage";
import MessageComposer from "../components/MessageComposer";
import MessageList from "../components/MessageList";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

export default function ChatsPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] =
    useState(true);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async () => {
    try {
      const result = await apiRequest(
        "/conversations?limit=50"
      );

      setConversations(result.items);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      return;
    }

    setChatLoading(true);
    setError("");

    try {
      const result = await apiRequest(
        `/conversations/${conversationId}/messages?limit=50`
      );

      setConversation(result.conversation);
      setMessages(result.items);
    } catch (requestError) {
      setError(requestError.message);
      setConversation(null);
      setMessages([]);
    } finally {
      setChatLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  async function sendMessage({ content, file }) {
    setSending(true);
    setError("");

    try {
      const formData = new FormData();

      if (content) {
        formData.append("content", content);
      }

      if (file) {
        formData.append("attachment", file);
      }

      await apiRequest(
        `/conversations/${conversationId}/messages`,
        {
          method: "POST",
          body: formData,
        }
      );

      await loadConversation();
      await loadConversations();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  }

  async function editMessage(message, content) {
    const normalizedContent = content.trim();

    if (!normalizedContent) {
      setError("Message content cannot be empty.");
      return false;
    }

    if (normalizedContent === message.content) {
      return true;
    }

    setError("");

    try {
      await apiRequest(`/messages/${message.id}`, {
        method: "PATCH",
        body: {
          content: normalizedContent,
        },
      });

      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? {
                ...item,
                content: normalizedContent,
                isEdited: true,
              }
            : item
        )
      );

      setConversations((current) =>
        current.map((item) =>
          item.lastMessageId === message.id
            ? {
                ...item,
                lastMessagePreview: normalizedContent,
              }
            : item
        )
      );

      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }

  async function deleteMessage(messageId) {
    setError("");

    try {
      await apiRequest(`/messages/${messageId}`, {
        method: "DELETE",
      });

      setMessages((current) =>
        current.map((item) =>
          item.id === messageId
            ? {
                ...item,
                content: null,
                attachment: null,
                isDeleted: true,
              }
            : item
        )
      );

      setConversations((current) =>
        current.map((item) =>
          item.lastMessageId === messageId
            ? {
                ...item,
                lastMessagePreview: null,
                lastMessageDeleted: true,
              }
            : item
        )
      );

      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }

  return (
    <section className="chat-page">
      <aside
        className={`chat-sidebar ${
          conversationId ? "mobile-hidden" : ""
        }`}
      >
        <div className="sidebar-heading">
          <h1>Chats</h1>

          <Link className="small-button" to="/users">
            New chat
          </Link>
        </div>

        <ConversationList
          conversations={conversations}
          loading={conversationsLoading}
        />
      </aside>

      <div
        className={`chat-panel ${
          !conversationId ? "mobile-hidden" : ""
        }`}
      >
        <ErrorMessage message={error} />

        {!conversationId && (
          <div className="empty-chat">
            Select a conversation or{" "}
            <Link to="/users">start a new one</Link>.
          </div>
        )}

        {conversationId && chatLoading && (
          <div className="empty-chat">
            Loading chat...
          </div>
        )}

        {conversationId &&
          !chatLoading &&
          conversation && (
            <>
              <header className="chat-header">
                <Link
                  className="mobile-back"
                  to="/chats"
                >
                  ←
                </Link>

                <div>
                  <h2>{conversation.name}</h2>

                  <span>
                    {conversation.participantCount}{" "}
                    participant(s)
                  </span>
                </div>
              </header>

              <MessageList
                messages={messages}
                currentUserId={user.id}
                onEdit={editMessage}
                onDelete={deleteMessage}
              />

              <MessageComposer
                onSend={sendMessage}
                disabled={sending}
              />
            </>
          )}
      </div>
    </section>
  );
}