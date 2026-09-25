import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Vite inlines only vars that exist at *build* time.
 * On Cloudflare Workers Builds, set these under:
 *   Settings → Build → Variables and secrets
 * (not only runtime Worker vars)
 */
function readEnv(name: string): string | undefined {
  // Vite client / SSR
  try {
    const v = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[name];
    if (typeof v === "string" && v.trim()) return v.trim();
  } catch {
    /* ignore */
  }
  // Node / build tooling
  if (typeof process !== "undefined" && process.env?.[name]?.trim()) {
    return process.env[name]!.trim();
  }
  return undefined;
}

// Public project URL (safe to ship). Override with VITE_SUPABASE_URL if needed.
const DEFAULT_URL = "https://trrcoknzdwidjbejcmcu.supabase.co";

const url =
  readEnv("VITE_SUPABASE_URL") ||
  readEnv("SUPABASE_URL") ||
  DEFAULT_URL;

const anonKey =
  readEnv("VITE_SUPABASE_ANON_KEY") ||
  readEnv("SUPABASE_ANON_KEY") ||
  readEnv("VITE_SUPABASE_PUBLISHABLE_KEY");

export function isSupabaseConfigured() {
  return Boolean(
    url &&
      anonKey &&
      !url.includes("YOUR_PROJECT") &&
      anonKey.length > 10 &&
      !anonKey.includes("your-") &&
      !anonKey.includes("YOUR_"),
  );
}

let client: SupabaseClient<Database> | null = null;

/** Browser / SSR-safe singleton. */
export function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as Cloudflare *Build* variables, then redeploy.",
    );
  }
  if (!client) {
    client = createClient<Database>(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

export function createIsolatedSupabaseClient() {\n  return createClient<Database>(url!, anonKey!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });\n}\n\nexport function getSupabaseConfigStatus() {
  return {
    hasUrl: Boolean(url),
    hasKey: Boolean(anonKey),
    urlHost: url ? (() => {
      try {
        return new URL(url).host;
      } catch {
        return "(invalid url)";
      }
    })() : null,
  };
}
