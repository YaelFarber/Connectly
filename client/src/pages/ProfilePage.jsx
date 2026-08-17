import { useEffect, useState } from "react";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

export default function ProfilePage() {
  const { updateSessionUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const result = await apiRequest("/users/me");
        if (active) setProfile(result);
      } catch (requestError) {
        if (active) setError(requestError.message);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiRequest("/users/me", { method: "PATCH", body: {
        displayName: profile.displayName,
        email: profile.email,
        bio: profile.bio || "",
      } });
      updateSessionUser({ displayName: profile.displayName });
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
      setPasswords({ currentPassword: "", newPassword: "" });
      setError(requestError.message);
    }
  }

  if (!profile) {
    return (
      <section className="standard-page narrow-page">
        <h1>Profile</h1>
        <ErrorMessage message={error} />
        {!error && <p>Loading...</p>}
      </section>
    );
  }

  return (
    <section className="standard-page narrow-page">
      <h1>Profile</h1>
      <ErrorMessage message={error} />
      {message && <div className="success-message">{message}</div>}
      <form className="stack-form card" onSubmit={saveProfile}>
        <h2>Account details</h2>
        <label>Username<input value={profile.username} disabled /></label>
        <label>Display name<input value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} required /></label>
        <label>Email<input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required /></label>
        <label>Bio<textarea rows={4} maxLength={300} value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></label>
        <button className="primary-button">Save profile</button>
      </form>
      <form className="stack-form card" onSubmit={changePassword}>
        <h2>Change password</h2>
        <label>Current password<input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} autoComplete="current-password" required /></label>
        <label>New password<input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} autoComplete="new-password" required /></label>
        <button className="primary-button">Change password</button>
      </form>
    </section>
  );
}
