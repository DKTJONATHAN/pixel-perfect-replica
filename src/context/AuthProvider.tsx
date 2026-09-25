import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Profile } from "@/lib/database.types";
import type { Role, User } from "@/lib/types";
import { staffAuthEmail, studentAuthEmail, parentAuthEmail } from "@/services/registration";

interface AuthContextValue {
  ready: boolean;
  configured: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** Email or staff number / admission number / parent phone */
  signIn: (loginId: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  portalPath: (role?: Role) => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function profileToUser(p: Profile): User {
  return {
    id: p.id,
    name: p.full_name || p.email,
    email: p.email,
    role: p.role as Role,
    studentId: p.student_id,
    staffId: p.staff_id,
    loginId: (p as Profile & { login_id?: string }).login_id ?? null,
  };
}

async function resolveEmail(loginId: string): Promise<string> {
  const raw = loginId.trim();
  if (raw.includes("@")) return raw.toLowerCase();

  const sb = getSupabase();

  // RPC if available
  try {
    const { data } = await sb.rpc("resolve_login_email", { p_login_id: raw });
    if (data && typeof data === "string") return data;
  } catch {
    /* fall through */
  }

  // Profile login_id
  const { data: prof } = await sb.from("profiles").select("email").eq("login_id", raw).maybeSingle();
  if (prof?.email) return prof.email;

  // 10-digit staff number
  if (/^\d{10}$/.test(raw)) {
    const { data: staff } = await sb
      .from("staff")
      .select("login_email, email")
      .eq("staff_no", raw)
      .maybeSingle();
    if (staff?.login_email) return staff.login_email;
    if (staff?.email) return staff.email;
    return staffAuthEmail(raw);
  }

  // Admission number pattern
  if (/^[A-Za-z0-9/\-]+$/.test(raw) && raw.length >= 4) {
    const { data: st } = await sb
      .from("students")
      .select("admission_no")
      .eq("admission_no", raw)
      .maybeSingle();
    if (st) return studentAuthEmail(raw);
  }

  // Parent phone digits
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 9) {
    const { data: p } = await sb
      .from("profiles")
      .select("email")
      .eq("login_id", digits)
      .maybeSingle();
    if (p?.email) return p.email;
    return parentAuthEmail(digits);
  }

  return raw;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [ready, setReady] = useState(!configured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    const sb = getSupabase();
    const { data, error } = await sb.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) {
      console.error("Failed to load profile", error);
      setProfile(null);
      return;
    }
    setProfile(data as Profile | null);
  }, []);

  useEffect(() => {
    if (!configured) {
      setReady(true);
      return;
    }
    const sb = getSupabase();
    let cancelled = false;

    sb.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => {
          if (!cancelled) setReady(true);
        });
      } else {
        setReady(true);
      }
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user) void loadProfile(next.user.id);
      else setProfile(null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured, loadProfile]);

  const signIn = useCallback(
    async (loginId: string, password: string) => {
      if (!isSupabaseConfigured()) {
        return {
          ok: false,
          error: "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
        };
      }
      try {
        const email = await resolveEmail(loginId);
        const sb = getSupabase();
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) return { ok: false, error: error.message };
        if (data.user) await loadProfile(data.user.id);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Sign in failed" };
      }
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    await getSupabase().auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const portalPath = useCallback(
    (role?: Role) => {
      const r = role ?? (profile?.role as Role | undefined);
      if (r === "admin" || r === "registrar") return "/admin";
      if (r === "teacher") return "/staff";
      if (r === "staff") return "/staff";
      if (r === "student") return "/student";
      if (r === "parent") return "/parent";
      return "/";
    },
    [profile?.role],
  );

  const user = profile ? profileToUser(profile) : null;

  const value = useMemo(
    () => ({ ready, configured, session, user, profile, signIn, signOut, portalPath }),
    [ready, configured, session, user, profile, signIn, signOut, portalPath],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
