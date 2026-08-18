import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import {
  apiCreatedResource,
  apiRequest,
} from "../services/api";

export default function NewGroupPage() {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selected, setSelected] = useState(new Set());

  const [contactsLoading, setContactsLoading] =
    useState(true);
  const [searchLoading, setSearchLoading] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  function toggle(userId) {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }

      return next;
    });
  }

  async function createGroup(event) {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      const created = await apiCreatedResource(
        "/conversations/groups",
        {
          method: "POST",
          body: {
            name,
            participantIds: [...selected],
          },
        }
      );

      navigate(`/chats/${created.id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  const searching = search.trim().length >= 2;
  const displayedUsers = searching
    ? searchResults
    : contacts;

  return (
    <section className="standard-page narrow-page">
      <h1>Create a group</h1>

      <ErrorMessage message={error} />

      <form
        onSubmit={createGroup}
        className="stack-form"
      >
        <label>
          Group name

          <input
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            minLength={2}
            maxLength={80}
            required
          />
        </label>

        <label>
          Find members

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by name or username"
          />
        </label>

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
          <div className="selection-list">
            {displayedUsers.map((person) => (
              <label
                key={person.id}
                className="selection-row"
              >
                <input
                  type="checkbox"
                  checked={selected.has(person.id)}
                  onChange={() => toggle(person.id)}
                />

                <span>
                  <strong>{person.displayName}</strong>
                </span>
              </label>
            ))}

            {!displayedUsers.length &&
              !searching &&
              !contactsLoading && (
                <p>
                  No recent contacts yet. Search for users
                  to add to the group.
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
          <small>
            Recent contacts are shown automatically. Type
            at least 2 characters to find other users.
          </small>
        )}

        <button
          className="primary-button"
          disabled={
            submitting ||
            selected.size < 1 ||
            name.trim().length < 2
          }
        >
          {submitting
            ? "Creating..."
            : `Create group (${selected.size} selected)`}
        </button>
      </form>
    </section>
  );
}