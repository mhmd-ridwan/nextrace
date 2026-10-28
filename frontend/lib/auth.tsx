"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type UserRole = "admin" | "analyst" | "viewer";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "nextrace_access_token";
const USER_KEY = "nextrace_user";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Rehydrate session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      try {
        const user: AuthUser = JSON.parse(storedUser);
        setState({ user, token: storedToken, isLoading: false, isAuthenticated: true });
        return;
      } catch {
        // corrupt storage — fall through to unauthenticated
      }
    }
    setState((s) => ({ ...s, isLoading: false }));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail ?? "Login gagal. Periksa kembali kredensial Anda.");
    }

    const data = await res.json();
    const user: AuthUser = data.user;
    const token: string = data.access_token;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ user, token, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useAuthToken(): string | null {
  return useAuth().token;
}

const ROLE_BADGE: Record<UserRole, { label: string; color: string }> = {
  admin: { label: "ADMIN", color: "#df7167" },
  analyst: { label: "ANALYST", color: "#86a8d0" },
  viewer: { label: "VIEWER", color: "#74ab92" },
};

export function getRoleBadge(role: UserRole) {
  return ROLE_BADGE[role] ?? { label: role.toUpperCase(), color: "#8b949b" };
}
