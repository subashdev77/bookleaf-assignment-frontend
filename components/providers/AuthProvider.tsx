"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, SESSION_EXPIRED_EVENT } from "@/lib/api";
import type { User } from "@/lib/types";

type SignOutReason = "expired" | "inactive" | null;

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOutReason: SignOutReason;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signOutReason, setSignOutReason] = useState<SignOutReason>(null);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setUserState(res.data.data.user))
      .catch(() => setUserState(null))
      .finally(() => setLoading(false));

    const onExpired = (e: Event) => {
      setUserState(null);
      setSignOutReason((e as CustomEvent<string>).detail === "ACCOUNT_INACTIVE" ? "inactive" : "expired");
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const setUser = useCallback((u: User) => {
    setSignOutReason(null);
    setUserState(u);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post("/auth/login", { email, password });
      setUser(res.data.data.user);
      return res.data.data.user as User;
    },
    [setUser],
  );

  const logout = useCallback(async () => {
    await api.post("/auth/logout").catch(() => undefined);
    setUserState(null);
  }, []);

  const value = useMemo(() => ({ user, loading, signOutReason, login, logout, setUser }), [user, loading, signOutReason, login, logout, setUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const homeFor = (user: User) => (user.role === "admin" ? "/admin" : "/dashboard");
