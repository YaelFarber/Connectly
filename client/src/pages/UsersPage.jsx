import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import { apiRequest } from "../services/api";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const result = await apiRequest(`/users?limit=30&search=${encodeURIComponent(search)}`);
        setUsers(result.items);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  async function startChat(userId) {
    try {
      const result = await apiRequest("/conversations/private", {
        method: "POST",
        body: { userId },
      });
      navigate(`/chats/${result.id}`);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function blockUser(userId) {
    if (!window.confirm("Block this user?")) return;
    try {
      await apiRequest(`/users/${userId}/block`, { method: "POST" });
      setUsers((current) => current.filter((user) => user.id !== userId));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="standard-page narrow-page">
      <div className="page-heading">
        <div><h1>People</h1><p>Find a user and open a private conversation.</p></div>
      </div>
      <ErrorMessage message={error} />
      <input
        className="search-input"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by name or username"
      />
      {loading ? <p>Loading...</p> : (
        <div className="user-list">
          {users.map((person) => (
            <article key={person.id} className="user-row">
              <div>
                <strong>{person.displayName}</strong>
                <span>@{person.username}</span>
              </div>
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
