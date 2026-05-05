"use client";

/*
 * OLKASIS ADMIN — Auth Context
 * Adapted for Next.js App Router (client component).
 * Swap the mock login for a real API call when backend is ready.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { AdminUser, AdminRole } from "../../types/index";

/* ── Demo credentials ─────────────────────────────────────── */
const DEMO_USERS: Record<string, { password: string; user: AdminUser }> = {
  "nick.juma@olkasis.com": {
    password: "admin123",
    user: { id: "ADM001", name: "Nick Juma",  email: "nick.juma@olkasis.com",  role: "super_admin",    status: "active", lastLogin: new Date().toISOString(), ip: "196.201.12.45" },
  },
  "collins.murichu@olkasis.com": {
    password: "admin123",
    user: { id: "ADM002", name: "Collins Murichu",   email: "collins.murichu@olkasis.com",   role: "super_admin",     status: "active", lastLogin: new Date().toISOString(), ip: "196.201.12.46" },
  },
  "john.mwenda@olkasis.com": {
    password: "admin123",
    user: { id: "ADM002", name: "John Mwenda",   email: "john.mwenda@olkasis.com",   role: "compliance",     status: "active", lastLogin: new Date().toISOString(), ip: "196.201.12.46" },
  },
  "alice.njoroge@olkasis.com": {
    password: "admin123",
    user: { id: "ADM003", name: "Alice Njoroge", email: "alice.njoroge@olkasis.com", role: "customer_support",status: "active", lastLogin: new Date().toISOString(), ip: "196.201.12.47" },
  },
  "michael.ouma@olkasis.com": {
    password: "admin123",
    user: { id: "ADM004", name: "Michael Ouma",  email: "michael.ouma@olkasis.com",  role: "operations",     status: "active", lastLogin: new Date().toISOString(), ip: "196.201.12.48" },
  },
  "priya.patel@olkasis.com": {
    password: "admin123",
    user: { id: "ADM005", name: "Priya Patel",   email: "priya.patel@olkasis.com",   role: "data_analyst",   status: "inactive",lastLogin: new Date().toISOString(), ip: "196.201.12.49" },
  },
};

const SESSION_KEY = "olkasis_admin_session";

/* ── Context types ────────────────────────────────────────── */
interface AuthContextValue {
  user:         AdminUser | null;
  isLoading:    boolean;
  isAuthed:     boolean;
  login:        (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout:       () => void;
  hasRole:      (role: AdminRole | AdminRole[]) => boolean;
  canAccess:    (path: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* ── Provider ─────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restore session from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AdminUser;
        setUser(parsed);
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      // Simulate network delay
      await new Promise((r) => setTimeout(r, 600));

      const found = DEMO_USERS[email.toLowerCase()];
      if (!found || found.password !== password) {
        return { success: false, error: "Invalid email or password." };
      }
      if (found.user.status === "inactive") {
        return { success: false, error: "Your account is inactive. Contact your administrator." };
      }

      const authedUser = { ...found.user, lastLogin: new Date().toISOString() };
      setUser(authedUser);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(authedUser));
      // Set cookie for middleware auth guard
      document.cookie = "olk_session=1; path=/; SameSite=Strict";
      return { success: true };
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
    // Clear middleware cookie
    document.cookie = "olk_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  }, [router]);

  const hasRole = useCallback(
    (role: AdminRole | AdminRole[]): boolean => {
      if (!user) return false;
      return Array.isArray(role) ? role.includes(user.role) : user.role === role;
    },
    [user]
  );

  const canAccess = useCallback(
    (path: string): boolean => {
      if (!user) return false;
      if (user.role === "super_admin") return true;
      // Import inline to avoid circular deps
      const { canAccessPage } = require("@/lib/permissions");
      return canAccessPage(user.role, path);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthed: !!user,
        login,
        logout,
        hasRole,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ── Hook ─────────────────────────────────────────────────── */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}