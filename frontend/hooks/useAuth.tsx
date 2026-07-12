import { useState, useEffect, createContext, useContext } from "react";
import { authAPI } from "@/lib/axios";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("mindcare_token");
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
        } catch (err) {
          localStorage.removeItem("mindcare_token");
          localStorage.removeItem("mindcare_user");
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authAPI.login(email, password);
      localStorage.setItem("mindcare_token", res.data.access_token);
      localStorage.setItem("mindcare_user", JSON.stringify(res.data.user));
      setUser(res.data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await authAPI.signup(data);
      localStorage.setItem("mindcare_token", res.data.access_token);
      localStorage.setItem("mindcare_user", JSON.stringify(res.data.user));
      setUser(res.data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("mindcare_token");
    localStorage.removeItem("mindcare_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
