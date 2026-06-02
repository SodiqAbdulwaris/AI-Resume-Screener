import { createContext, useContext, useState, useEffect } from "react";
import { silentRefresh, apiCall, setAuthTokenTracker } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync token tracker so the apiCall interceptor can read/update it
  useEffect(() => {
    setAuthTokenTracker(token, setToken, logout);
  }, [token]);

  useEffect(() => {
    async function restoreSession() {
      // Remove legacy localStorage items if present
      localStorage.removeItem("hs_token");
      localStorage.removeItem("hs_user");

      const r = await silentRefresh();
      if (r && r.success) {
        setToken(r.data.token);
        setUser(r.data.user);
      }
      setLoading(false);
    }
    restoreSession();
  }, []);

  const login = (t, u) => {
    localStorage.removeItem("hs_token");
    localStorage.removeItem("hs_user");
    setToken(t);
    setUser(u);
  };

  const updateUser = (updates) => {
    setUser((current) => {
      if (!current) return current;
      return { ...current, ...updates };
    });
  };

  const logout = async () => {
    await apiCall("POST", "/auth/logout");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
