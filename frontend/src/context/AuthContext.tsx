import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
import { AdminUser } from "../types";

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("pf_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<{ user: { userId: number; email: string } }>("/api/auth/me")
      .then((data) => setUser({ id: data.user.userId, email: data.user.email }))
      .catch(() => {
        localStorage.removeItem("pf_token");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const data = await api.post<{ token: string; user: AdminUser }>("/api/auth/login", {
      email,
      password,
    });
    localStorage.setItem("pf_token", data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("pf_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
