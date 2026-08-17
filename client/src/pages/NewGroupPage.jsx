import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import { apiCreatedResource, apiRequest } from "../services/api";

export default function NewGroupPage() {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setUsers([]);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      try {
        const result = await apiRequest(`/users?limit=20&search=${encodeURIComponent(term)}`);
        setUsers(result.items);
      } catch (requestError) {
        setError(requestError.message);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  function toggle(userId) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function createGroup(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const created = await apiCreatedResource("/conversations/groups", {
        method: "POST",
        body: { name, participantIds: [...selected] },
      });
      navigate(`/chats/${created.id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="standard-page narrow-page">
      <h1>Create a group</h1>
      <ErrorMessage message={error} />
      <form onSubmit={createGroup} className="stack-form">
        <label>Group name<input value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={80} required /></label>
        <label>Find members<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type at least 2 characters" /></label>
        <div className="selection-list">
          {users.map((person) => (
            <label key={person.id} className="selection-row">
              <input type="checkbox" checked={selected.has(person.id)} onChange={() => toggle(person.id)} />
              <span><strong>{person.displayName}</strong></span>
            </label>
          ))}
        </div>
        <button className="primary-button" disabled={submitting || selected.size < 1}>
          {submitting ? "Creating..." : `Create group (${selected.size} selected)`}
        </button>
      </form>
    </section>
  );
}
