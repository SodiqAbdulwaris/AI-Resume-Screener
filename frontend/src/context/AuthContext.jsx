import { createContext, useContext, useState, useEffect } from "react";
import { getJobs } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("hs_token"));
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("hs_user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      const storedToken = localStorage.getItem("hs_token");
      if (storedToken) {
        const r = await getJobs(storedToken);
        if (r && r.status === 401) {
          localStorage.removeItem("hs_token");
          localStorage.removeItem("hs_user");
          setToken(null);
          setUser(null);
        }
      } else {
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    }
    verifySession();
  }, []);

  const login = (t, u) => {
    localStorage.setItem("hs_token", t);
    localStorage.setItem("hs_user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const updateUser = (updates) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...updates };
      localStorage.setItem("hs_user", JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem("hs_token");
    localStorage.removeItem("hs_user");
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
