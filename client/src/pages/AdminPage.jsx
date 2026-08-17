import { useCallback, useEffect, useState } from "react";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStats() {
      try {
        const result = await apiRequest("/admin/stats");
        if (active) setStats(result);
      } catch (requestError) {
        if (active) setError(requestError.message);
      }
    }

    loadStats();
    return () => {
      active = false;
    };
  }, []);

  const loadUsers = useCallback(async () => {
    const term = search.trim();
    if (term.length < 2) {
      setUsers([]);
      return;
    }

    setError("");
    try {
      const result = await apiRequest(
        `/admin/users?limit=30&search=${encodeURIComponent(term)}`
      );
      setUsers(result.items);
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(loadUsers, 350);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  async function toggleBlocked(target) {
    try {
      await apiRequest(`/admin/users/${target.id}/block`, {
        method: "PATCH",
        body: { blocked: !target.isBlocked },
      });
      setUsers((current) =>
        current.map((item) =>
          item.id === target.id ? { ...item, isBlocked: !item.isBlocked } : item
        )
      );
      setStats((current) =>
        current
          ? {
              ...current,
              blockedUsers: current.blockedUsers + (target.isBlocked ? -1 : 1),
            }
          : current
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="standard-page">
      <h1>Administration</h1>
      <ErrorMessage message={error} />
      {stats && (
        <div className="stats-grid">
          <div><strong>{stats.totalUsers}</strong><span>Users</span></div>
          <div><strong>{stats.totalConversations}</strong><span>Conversations</span></div>
          <div><strong>{stats.totalMessages}</strong><span>Messages</span></div>
          <div><strong>{stats.blockedUsers}</strong><span>Blocked</span></div>
        </div>
      )}
      <div className="page-heading">
        <h2>User management</h2>
        <input
          className="search-input compact"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, username or email"
        />
      </div>
      {search.trim().length < 2 ? (
        <p>Type at least 2 characters to find an account.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {users.map((target) => (
                <tr key={target.id}>
                  <td>{target.displayName}</td>
                  <td>{target.role}</td>
                  <td>{target.isBlocked ? "Blocked" : "Active"}</td>
                  <td>
                    <button
                      className={target.isBlocked ? "primary-button" : "danger-button"}
                      onClick={() => toggleBlocked(target)}
                      disabled={target.id === user.id || target.role === "admin"}
                    >
                      {target.isBlocked ? "Unblock" : "Block"}
                    </button>
                  </td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan="4">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
