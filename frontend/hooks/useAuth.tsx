import { useState, useEffect, createContext, useContext } from "react";
import { authAPI } from "@/lib/axios";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  roles: string[];
  permissions: string[];
  isAdmin: boolean;
  isOwner: boolean;
  isProfessional: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  getDefaultDashboardRoute: () => string;
  login: (email: string, password: string, mfa_code?: string) => Promise<User>;
  signup: (data: any) => Promise<User>;
  loginWithGoogle: (data: {
    credential?: string;
    access_token?: string;
    email?: string;
    name?: string;
    picture?: string;
    sub?: string;
  }) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const roles = user?.roles || (user?.is_admin ? ["admin", "user"] : ["user"]);
  const permissions = user?.permissions || [];
  const isOwner = roles.includes("owner");
  const isAdmin = roles.includes("admin") || isOwner || !!user?.is_admin;
  const isProfessional = roles.includes("professional");

  const hasRole = (role: string) => {
    if (role === "admin" && (isOwner || user?.is_admin)) return true;
    return roles.includes(role);
  };

  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  const getDefaultDashboardRoute = () => {
    if (isOwner) return "/owner/system-settings";
    if (isAdmin) return "/admin/dashboard";
    if (isProfessional) return "/professional/dashboard";
    return "/dashboard";
  };

  const refreshProfile = async () => {
    try {
      const res = await authAPI.getMe();
      setUser(res.data);
      localStorage.setItem("mindcare_user", JSON.stringify(res.data));
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("mindcare_token");
      const cachedUserStr = localStorage.getItem("mindcare_user");

      if (cachedUserStr) {
        try {
          setUser(JSON.parse(cachedUserStr));
          setIsLoading(false);
        } catch {
          // Ignore JSON parse error
        }
      }

      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
          localStorage.setItem("mindcare_user", JSON.stringify(res.data));
        } catch (err) {
          localStorage.removeItem("mindcare_token");
          localStorage.removeItem("mindcare_refresh_token");
          localStorage.removeItem("mindcare_user");
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string, mfa_code?: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authAPI.login(email, password);
      localStorage.setItem("mindcare_token", res.data.access_token);
      if (res.data.refresh_token) {
        localStorage.setItem("mindcare_refresh_token", res.data.refresh_token);
      }
      localStorage.setItem("mindcare_user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: any): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authAPI.signup(data);
      localStorage.setItem("mindcare_token", res.data.access_token);
      if (res.data.refresh_token) {
        localStorage.setItem("mindcare_refresh_token", res.data.refresh_token);
      }
      localStorage.setItem("mindcare_user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (googleData: {
    credential?: string;
    access_token?: string;
    email?: string;
    name?: string;
    picture?: string;
    sub?: string;
  }): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authAPI.googleAuth(googleData);
      localStorage.setItem("mindcare_token", res.data.access_token);
      if (res.data.refresh_token) {
        localStorage.setItem("mindcare_refresh_token", res.data.refresh_token);
      }
      localStorage.setItem("mindcare_user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      authAPI.deleteAccount(); // calls logout
    } catch {}
    localStorage.removeItem("mindcare_token");
    localStorage.removeItem("mindcare_refresh_token");
    localStorage.removeItem("mindcare_user");
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        roles,
        permissions,
        isAdmin,
        isOwner,
        isProfessional,
        hasRole,
        hasPermission,
        getDefaultDashboardRoute,
        login,
        signup,
        loginWithGoogle,
        logout,
        refreshProfile,
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
