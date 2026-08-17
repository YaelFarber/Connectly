import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import { apiCreatedResource, apiRequest } from "../services/api";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setUsers([]);
      setLoading(false);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const result = await apiRequest(`/users?limit=20&search=${encodeURIComponent(term)}`);
        setUsers(result.items);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  async function startChat(userId) {
    setError("");
    try {
      const created = await apiCreatedResource("/conversations/private", {
        method: "POST",
        body: { userId },
      });
      navigate(`/chats/${created.id}`);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function blockUser(userId) {
    setError("");
    try {
      await apiRequest(`/users/${userId}/block`, { method: "POST" });
      setUsers((current) => current.filter((person) => person.id !== userId));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

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
      {search.trim().length < 2 ? (
        <p>Type at least 2 characters to search.</p>
      ) : loading ? (
        <p>Loading...</p>
      ) : (
        <div className="user-list">
          {users.map((person) => (
            <article key={person.id} className="user-row">
              <div><strong>{person.displayName}</strong></div>
              <div className="row-actions">
                <button className="primary-button" onClick={() => startChat(person.id)}>Message</button>
                <button className="danger-button" onClick={() => blockUser(person.id)}>Block</button>
              </div>
            </article>
          ))}
          {!users.length && <p>No users found.</p>}
        </div>
      )}
    </section>
  );
}
