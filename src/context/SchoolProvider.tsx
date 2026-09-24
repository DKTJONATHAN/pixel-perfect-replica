/**
 * Single source of truth for the app: session, theme and the whole school
 * database. Data is read/written through src/services/db.ts.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { Activity, Database, Role, User } from "@/lib/types";
import { loadDb, newId, resetDb, saveDb } from "@/services/db";

const SESSION_KEY = "kidright.session.v1";
const THEME_KEY = "kidright.theme.v1";

interface SchoolContextValue {
  ready: boolean;
  db: Database;
  user: User | null;
  theme: "light" | "dark";
  toggleTheme: () => void;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  loginAs: (role: Role) => void;
  logout: () => void;
  /** Mutate the database immutably; optionally log an activity entry. */
  update: (fn: (db: Database) => Database, activity?: string) => void;
  reseed: () => void;
  can: (permission: Permission) => boolean;
}

export type Permission =
  | "students.view"
  | "students.edit"
  | "staff.view"
  | "staff.edit"
  | "attendance.mark"
  | "grades.edit"
  | "fees.manage"
  | "classes.manage"
  | "leave.approve"
  | "payroll.view"
  | "settings.manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "students.view", "students.edit", "staff.view", "staff.edit", "attendance.mark",
    "grades.edit", "fees.manage", "classes.manage", "leave.approve", "payroll.view",
    "settings.manage",
  ],
  teacher: ["students.view", "attendance.mark", "grades.edit", "staff.view"],
  registrar: ["students.view", "students.edit", "fees.manage", "classes.manage", "staff.view"],
};

const SchoolContext = createContext<SchoolContextValue | null>(null);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(() => loadDb());
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [ready, setReady] = useState(false);

  // Hydrate from storage after mount so server and client markup match.
  useEffect(() => {
    const fresh = loadDb();
    setDb(fresh);
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as User);
      const savedTheme = window.localStorage.getItem(THEME_KEY);
      if (savedTheme === "dark") setTheme("dark");
    } catch {
      // Ignore unreadable storage.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light";
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const update = useCallback((fn: (current: Database) => Database, activity?: string) => {
    setDb((current) => {
      let next = fn(current);
      if (activity) {
        const entry: Activity = {
          id: newId("a"),
          at: new Date().toISOString(),
          actor: user?.name ?? "System",
          message: activity,
        };
        next = { ...next, activity: [entry, ...next.activity].slice(0, 60) };
      }
      saveDb(next);
      return next;
    });
  }, [user?.name]);

  const login = useCallback<SchoolContextValue["login"]>((email, password) => {
    const found = loadDb().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) return { ok: false, error: "No account found with that email address." };
    if (password.length < 4) return { ok: false, error: "Password must be at least 4 characters." };
    setUser(found);
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(found));
    } catch {
      /* ignore */
    }
    return { ok: true };
  }, []);

  const loginAs = useCallback((role: Role) => {
    const found = loadDb().users.find((u) => u.role === role);
    if (!found) return;
    setUser(found);
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(found));
    } catch {
      /* ignore */
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const reseed = useCallback(() => {
    setDb(resetDb());
    toast.success("Sample data restored");
  }, []);

  const can = useCallback(
    (permission: Permission) => (user ? ROLE_PERMISSIONS[user.role].includes(permission) : false),
    [user],
  );

  const value = useMemo(
    () => ({ ready, db, user, theme, toggleTheme, login, loginAs, logout, update, reseed, can }),
    [ready, db, user, theme, toggleTheme, login, loginAs, logout, update, reseed, can],
  );

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error("useSchool must be used inside SchoolProvider");
  return ctx;
}
