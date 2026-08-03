import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/chats">Connectly</NavLink>
        <nav>
          <NavLink to="/chats">Chats</NavLink>
          <NavLink to="/users">People</NavLink>
          <NavLink to="/groups/new">New group</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          {user.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
          <button type="button" className="link-button" onClick={handleLogout}>Logout</button>
        </nav>
      </header>
      <main className="page-content"><Outlet /></main>
    </div>
  );
}
