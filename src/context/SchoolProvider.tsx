/**
 * School data from Supabase. Requires authenticated session for most tables.
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
import { useAuth } from "@/context/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Role, SchoolData } from "@/lib/types";
import { fetchSchoolData, fetchSchoolSettings } from "@/services/school";

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
  | "settings.manage"
  | "register.manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "students.view",
    "students.edit",
    "staff.view",
    "staff.edit",
    "attendance.mark",
    "grades.edit",
    "fees.manage",
    "classes.manage",
    "leave.approve",
    "payroll.view",
    "settings.manage",
    "register.manage",
  ],
  registrar: [
    "students.view",
    "students.edit",
    "staff.view",
    "staff.edit",
    "classes.manage",
    "register.manage",
    "fees.manage",
  ],
  teacher: [
    "students.view",
    "attendance.mark",
    "grades.edit",
    "staff.view",
    "classes.manage",
  ],
  staff: ["students.view", "staff.view"],
  student: ["students.view"],
  parent: ["students.view"],
};

const EMPTY: SchoolData = {
  classes: [],
  students: [],
  staff: [],
  attendance: [],
  staffAttendance: [],
  grades: [],
  payments: [],
  leave: [],
  activity: [],
  settings: {
    schoolName: "KidRight Academy",
    motto: "Learn. Grow. Shine.",
    address: "12 Riverside Lane, Nairobi",
    phone: "+254 700 123 456",
    email: "office@kidright.ac.ke",
    academicYear: "2026",
    currentTerm: "Term 3",
    currency: "KES",
    annualLeaveDays: 21,
    about: "",
    vision: "",
    mission: "",
  },
};

interface SchoolContextValue {
  ready: boolean;
  db: SchoolData;
  refresh: () => Promise<void>;
  can: (permission: Permission) => boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const SchoolContext = createContext<SchoolContextValue | null>(null);
const THEME_KEY = "kidright.theme.v1";

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { ready: authReady, user, session } = useAuth();
  const [db, setDb] = useState<SchoolData>(EMPTY);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(THEME_KEY);
      if (saved === "dark") setTheme("dark");
    } catch {
      /* ignore */
    }
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

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setDb(EMPTY);
      setReady(true);
      return;
    }
    try {
      if (session) {
        const data = await fetchSchoolData();
        setDb(data);
      } else {
        const settings = await fetchSchoolSettings();
        setDb({ ...EMPTY, settings });
      }
    } catch (e) {
      console.error(e);
      toast.error("Could not load school data from Supabase");
    } finally {
      setReady(true);
    }
  }, [session]);

  useEffect(() => {
    if (!authReady) return;
    setReady(false);
    void refresh();
  }, [authReady, session?.user?.id, refresh]);

  const can = useCallback(
    (permission: Permission) => (user ? ROLE_PERMISSIONS[user.role]?.includes(permission) : false),
    [user],
  );

  const value = useMemo(
    () => ({ ready, db, refresh, can, theme, toggleTheme }),
    [ready, db, refresh, can, theme, toggleTheme],
  );

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error("useSchool must be used inside SchoolProvider");
  return ctx;
}
