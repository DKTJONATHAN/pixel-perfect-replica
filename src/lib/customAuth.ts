import { getSupabase } from "@/lib/supabase";
import type { Profile } from "@/lib/database.types";
import type { Role } from "@/lib/types";

export type SessionProfile = Pick<
  Profile,
  "id" | "email" | "full_name" | "role" | "student_id" | "staff_id" | "login_id" | "parent_phone"
>;

const DOMAIN = "accounts.kidright.com";

function authEmail(loginId: string, email?: string | null) {
  const e = (email ?? "").trim().toLowerCase();
  return e.includes("@")
    ? e
    : `${loginId.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "-")}@${DOMAIN}`;
}

async function establish(profile: SessionProfile, secret: string) {
  const sb = getSupabase();
  const email = authEmail(profile.login_id ?? profile.email, profile.email);

  let result = await sb.auth.signInWithPassword({ email, password: secret });
  let user = result.data.user;

  if (!user) {
    const created = await sb.auth.signUp({
      email,
      password: secret,
      options: {
        data: {
          full_name: profile.full_name,
          role: profile.role,
          login_id: profile.login_id,
        },
      },
    });

    if (created.error) {
      return { ok: false as const, error: created.error.message };
    }

    user = created.data.user;
    if (!user) {
      return { ok: false as const, error: "Could not create the authentication account." };
    }
  }

  const { data, error } = await (sb.rpc as any)("link_auth_user", {
    p_login_id: profile.login_id ?? "",
    p_password: secret,
    p_auth_user_id: user.id,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return {
    ok: true as const,
    profile: data as SessionProfile,
  };
}

export async function loadCurrentProfile() {
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data } = await sb
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (data as SessionProfile | null) ?? null;
}

export async function registerAccount(input: {
  loginId: string;
  password: string;
  fullName: string;
  role: Role;
  parentPhone?: string;
  email?: string;
}) {
  const sb = getSupabase();
  const email = input.email?.trim().toLowerCase() || null;

  const { data, error } = await sb.rpc("register_account_with_email", {
    p_login_id: input.loginId.trim(),
    p_password: input.password,
    p_full_name: input.fullName.trim(),
    p_role: input.role,
    p_email: email,
    p_parent_phone: input.parentPhone ?? null,
  });

  if (error) return { ok: false as const, error: error.message };

  // Registration must never sign the administrator into the newly-created account.\n  // The new user will establish/link their Supabase Auth session on their first login.\n  return { ok: true as const, profile: data as SessionProfile };
}

export async function loginAccount(loginId: string, secret: string) {
  const sb = getSupabase();
  const identifier = loginId.trim();

  // Parents/admins may sign in with the real email address.
  // Staff/students/parents using their school ID continue through the
  // existing login_id RPC.
  if (identifier.includes("@")) {
    const { data, error } = await sb.auth.signInWithPassword({
      email: identifier.toLowerCase(),
      password: secret,
    });

    if (error || !data.user) {
      return {
        ok: false as const,
        error: error?.message ?? "Invalid login credentials",
      };
    }

    const { data: profile, error: profileError } = await sb
      .from("profiles")
      .select("*")
      .eq("auth_user_id", data.user.id)
      .maybeSingle();

    if (profileError) {
      await sb.auth.signOut();
      return { ok: false as const, error: profileError.message };
    }

    if (!profile) {
      await sb.auth.signOut();
      return { ok: false as const, error: "Authentication succeeded, but the school profile is not linked to this account." };
    }

    return { ok: true as const, profile: profile as SessionProfile };
  }

  const { data, error } = await sb.rpc("login_account", {
    p_login_id: identifier,
    p_password: secret,
  });

  if (error) return { ok: false as const, error: error.message };

  return establish(data as SessionProfile, secret);
}

export async function signOutAccount() {
  await getSupabase().auth.signOut();
}
