import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    displayName: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  if (user) return <Navigate to="/chats" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      setForm({ username: "", email: "", displayName: "", password: "" });
      navigate("/chats", { replace: true });
    } catch (requestError) {
      setForm((current) => ({ ...current, password: "" }));
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create an account</h1>
        <ErrorMessage message={error} />
        <label>Display name<input value={form.displayName} onChange={(e) => update("displayName", e.target.value)} required /></label>
        <label>
          Username
          <input
            value={form.username}
            onChange={(e) => update("username", e.target.value)}
            autoComplete="username"
            minLength={3}
            maxLength={30}
            pattern="[A-Za-z0-9._-]+"
            title="Use only English letters, numbers, dots, underscores, and hyphens"
            required
          />
          <small>3–30 characters. English letters, numbers, dots, underscores, and hyphens only.</small>
        </label>
        <label>Email<input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" required /></label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} autoComplete="new-password" required />
          <small>At least 10 characters with uppercase, lowercase and a number.</small>
        </label>
        <button className="primary-button" disabled={submitting}>
          {submitting ? "Creating..." : "Create account"}
        </button>
        <p>Already registered? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
