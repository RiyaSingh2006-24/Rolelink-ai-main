import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  onAuthChange,
  StoredUser,
  updateStoredUser
} from "@/services/auth";

type AuthContextValue = {
  user: StoredUser | null;
  isAuthenticated: boolean;
  role: StoredUser["role"] | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  setUser: (user: StoredUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<StoredUser | null>(() => (getStoredToken() ? getStoredUser() : null));
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((nextUser: StoredUser | null) => {
    setUserState(nextUser);
    if (nextUser) {
      updateStoredUser(nextUser);
    } else {
      clearAuthSession();
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getStoredToken()) {
      setUserState(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch<{ user: StoredUser }>("/api/auth/me");
      setUserState(data.user);
      updateStoredUser(data.user);
    } catch (error) {
      clearAuthSession();
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sync = () => {
      setUserState(getStoredToken() ? getStoredUser() : null);
    };
    const unsubscribe = onAuthChange(sync);
    refreshUser();
    return unsubscribe;
  }, [refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      role: user?.role ?? null,
      loading,
      refreshUser,
      setUser
    }),
    [user, loading, refreshUser, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
