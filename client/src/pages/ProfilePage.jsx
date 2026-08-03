import { useEffect, useState } from "react";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState({ displayName: "", email: "", bio: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setProfile({ displayName: user.displayName, email: user.email, bio: user.bio || "" });
  }, [user]);

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiRequest("/users/me", { method: "PATCH", body: profile });
      await refresh();
      setMessage("Profile updated.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiRequest("/users/me/password", { method: "PATCH", body: passwords });
      setPasswords({ currentPassword: "", newPassword: "" });
      setMessage("Password updated.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="standard-page narrow-page">
      <h1>Profile</h1>
      <ErrorMessage message={error} />
      {message && <div className="success-message">{message}</div>}
      <form className="stack-form card" onSubmit={saveProfile}>
        <h2>Account details</h2>
        <label>Username<input value={user.username} disabled /></label>
        <label>Display name<input value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} required /></label>
        <label>Email<input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required /></label>
        <label>Bio<textarea rows={4} maxLength={300} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></label>
        <button className="primary-button">Save profile</button>
      </form>
      <form className="stack-form card" onSubmit={changePassword}>
        <h2>Change password</h2>
        <label>Current password<input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required /></label>
        <label>New password<input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required /></label>
        <button className="primary-button">Change password</button>
      </form>
    </section>
  );
}
