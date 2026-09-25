import { getSupabase } from "@/lib/supabase";
import type { Profile } from "@/lib/database.types";
import type { Role } from "@/lib/types";

const SESSION_KEY = "kidright_session_v1";

export type SessionProfile = Pick<
  Profile,
  | "id"
  | "email"
  | "full_name"
  | "role"
  | "student_id"
  | "staff_id"
  | "login_id"
  | "parent_phone"
>;

export function loadStoredSession(): SessionProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionProfile;
  } catch {
    return null;
  }
}

export function saveSession(profile: SessionProfile) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function registerAccount(input: {
  loginId: string;
  password: string;
  fullName: string;
  role: Role;
  parentPhone?: string;
}): Promise<{ ok: true; profile: SessionProfile } | { ok: false; error: string }> {
  const sb = getSupabase();
  const { data, error } = await sb.rpc("register_account", {
    p_login_id: input.loginId.trim(),
    p_password: input.password,
    p_full_name: input.fullName.trim(),
    p_role: input.role,
    p_parent_phone: input.parentPhone ?? null,
  });

  if (error) return { ok: false, error: error.message };
  const profile = data as SessionProfile;
  saveSession(profile);
  return { ok: true, profile };
}

export async function loginAccount(
  loginId: string,
  password: string,
): Promise<{ ok: true; profile: SessionProfile } | { ok: false; error: string }> {
  const sb = getSupabase();
  const { data, error } = await sb.rpc("login_account", {
    p_login_id: loginId.trim(),
    p_password: password,
  });

  if (error) return { ok: false, error: error.message };
  const profile = data as SessionProfile;
  saveSession(profile);
  return { ok: true, profile };
}
