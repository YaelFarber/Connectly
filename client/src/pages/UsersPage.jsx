import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import {
  apiCreatedResource,
  apiRequest,
} from "../services/api";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadContacts() {
      setContactsLoading(true);
      setError("");

      try {
        const result = await apiRequest(
          "/users/contacts?limit=30"
        );

        if (!cancelled) {
          setContacts(result.items || []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setContactsLoading(false);
        }
      }
    }

    loadContacts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const term = search.trim();

    if (term.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setError("");

      try {
        const result = await apiRequest(
          `/users?limit=20&search=${encodeURIComponent(term)}`
        );

        setSearchResults(result.items || []);
      } catch (requestError) {
        setError(requestError.message);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  async function startChat(userId) {
    setError("");

    try {
      const created = await apiCreatedResource(
        "/conversations/private",
        {
          method: "POST",
          body: { userId },
        }
      );

      navigate(`/chats/${created.id}`);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function blockUser(userId) {
    setError("");

    try {
      await apiRequest(`/users/${userId}/block`, {
        method: "POST",
      });

      setContacts((current) =>
        current.filter((person) => person.id !== userId)
      );

      setSearchResults((current) =>
        current.filter((person) => person.id !== userId)
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const searching = search.trim().length >= 2;
  const displayedUsers = searching
    ? searchResults
    : contacts;

  return (
    <section className="standard-page narrow-page">
      <h1>People</h1>

      <ErrorMessage message={error} />

      <input
        className="search-input"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by name or username"
      />

      {!searching && (
        <h2>Recent contacts</h2>
      )}

      {searching && (
        <h2>Search results</h2>
      )}

      {!searching && contactsLoading ? (
        <p>Loading contacts...</p>
      ) : searching && searchLoading ? (
        <p>Searching...</p>
      ) : (
        <div className="user-list">
          {displayedUsers.map((person) => (
            <article
              key={person.id}
              className="user-row"
            >
              <div>
                <strong>{person.displayName}</strong>
              </div>

              <div className="row-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => startChat(person.id)}
                >
                  Message
                </button>

                <button
                  type="button"
                  className="danger-button"
                  onClick={() => blockUser(person.id)}
                >
                  Block
                </button>
              </div>
            </article>
          ))}

          {!displayedUsers.length &&
            !searching &&
            !contactsLoading && (
              <p>
                No recent contacts yet. Search for someone
                to start a conversation.
              </p>
            )}

          {!displayedUsers.length &&
            searching &&
            !searchLoading && (
              <p>No users found.</p>
            )}
        </div>
      )}

      {!searching && (
        <p>
          Type at least 2 characters above to search for
          other users.
        </p>
      )}
    </section>
  );
}