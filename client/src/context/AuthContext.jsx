import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiRequest } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const currentUser = await apiRequest("/auth/me");
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (error.status !== 401 && error.status !== 403) {
        console.error(error);
      }
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function login(credentials) {
    await apiRequest("/auth/login", { method: "POST", body: credentials });
    return refresh();
  }

  async function register(details) {
    await apiRequest("/auth/register", { method: "POST", body: details });
    return refresh();
  }

  async function logout() {
    await apiRequest("/auth/logout", { method: "POST" });
    setUser(null);
  }

  const value = { user, loading, login, register, logout, refresh };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
