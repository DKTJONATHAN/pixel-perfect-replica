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

interface AuthContextValue {
  ready: boolean;
  configured: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signIn: (loginId: string, password: string, role?: Role) => Promise<{ ok: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  portalPath: (role?: Role) => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function profileToUser(p: Profile): User {
  return {
    id: p.id,
    name: p.full_name || p.email,
    email: p.email,
    role: p.role,
    studentId: p.student_id,
    staffId: p.staff_id,
  };
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
      if (next?.user) {
        void loadProfile(next.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured, loadProfile]);

  const signIn = useCallback(async (loginId: string, password: string, role?: Role) => {
    if (!isSupabaseConfigured()) {
      return {
        ok: false,
        error: "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      };
    }

    const raw = loginId.trim();
    if (!raw || !password) {
      return { ok: false, error: "Enter your login ID and password." };
    }

    // Staff, students, and parents are issued school login IDs rather than
    // real email addresses. Registration maps those IDs to synthetic auth
    // emails, so resolve the same mapping before calling Supabase Auth.
    let email = raw.toLowerCase();
    if (role === "student") {
      const safe = raw.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
      email = `${safe}@student.kidright.internal`;
    } else if (role === "staff" || role === "teacher") {
      email = `${raw}@staff.kidright.internal`;
    } else if (role === "parent" && !raw.includes("@")) {
      const digits = raw.replace(/\\D/g, "");
      if (!digits) return { ok: false, error: "Enter a valid parent phone number or email." };
      email = `${digits}@parent.kidright.internal`;
    }

    try {
      const sb = getSupabase();
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };
      if (data.user) await loadProfile(data.user.id);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Unable to sign in. Please try again.",
      };
    }
  }, [loadProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured()) {
      return { ok: false, error: "Supabase is not configured." };
    }
    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    if (error) return { ok: false, error: error.message };
    if (data.user && data.session) await loadProfile(data.user.id);
    return { ok: true, needsConfirmation: !data.session };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    await getSupabase().auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const portalPath = useCallback((role?: Role) => {
    const r = role ?? profile?.role;
    if (r === "admin" || r === "registrar") return "/admin";
    if (r === "staff" || r === "teacher") return "/staff";
    if (r === "student") return "/student";
    if (r === "parent") return "/parent";
    return "/";
  }, [profile?.role]);

  const user = profile ? profileToUser(profile) : null;

  const value = useMemo(
    () => ({ ready, configured, session, user, profile, signIn, signUp, signOut, portalPath }),
    [ready, configured, session, user, profile, signIn, signUp, signOut, portalPath],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
