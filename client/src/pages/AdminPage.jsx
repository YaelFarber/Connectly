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

  const load = useCallback(async () => {
    setError("");
    try {
      const [statsResult, usersResult] = await Promise.all([
        apiRequest("/admin/stats"),
        apiRequest(`/admin/users?limit=50&search=${encodeURIComponent(search)}`),
      ]);
      setStats(statsResult);
      setUsers(usersResult.items);
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function toggleBlocked(target) {
    try {
      await apiRequest(`/admin/users/${target.id}/block`, {
        method: "PATCH",
        body: { blocked: !target.isBlocked },
      });
      setUsers((current) => current.map((item) => item.id === target.id ? { ...item, isBlocked: !item.isBlocked } : item));
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
        <input className="search-input compact" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users" />
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {users.map((target) => (
              <tr key={target.id}>
                <td>{target.displayName}</td>
                <td>@{target.username}</td>
                <td>{target.email}</td>
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
          </tbody>
        </table>
      </div>
    </section>
  );
}
