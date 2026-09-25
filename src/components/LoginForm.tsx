import { useEffect, useState } from "react";
import { ArrowRight, LockKeyhole, School } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import type { Role } from "@/lib/types";
import { Button, Input } from "@/components/UI";

const ALLOWED: Record<string, Role[]> = {
  student: ["student"],
  staff: ["staff", "teacher"],
  admin: ["admin", "registrar"],
  parent: ["parent"],
};

export function LoginForm({
  role,
  title,
}: {
  role: "student" | "staff" | "admin" | "parent";
  title: string;
}) {
  const { ready, user, configured, signIn, portalPath } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const hint =
    role === "staff"
      ? "10-digit staff number"
      : role === "student"
        ? "Admission number"
        : role === "parent"
          ? "Phone number or email"
          : "Email address";

  useEffect(() => {
    if (ready && user) {
      const okRoles = ALLOWED[role] ?? [role];
      if (!okRoles.includes(user.role)) {
        setError(`This account is registered as ${user.role}, not for this portal.`);
        return;
      }
      window.location.assign(portalPath(user.role));
    }
  }, [ready, user, role, portalPath]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn(loginId, password, role);
      if (!result.ok) setError(result.error ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl gradient-hero">
                <School />
              </div>
              <div>
                <b className="font-display text-xl">KidRight</b>
                <p className="text-xs uppercase tracking-widest opacity-60">Academy</p>
              </div>
            </div>
            <div className="mt-28 max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">{title}</p>
              <h1 className="mt-4 font-display text-4xl font-bold">Sign in with your school ID.</h1>
              <p className="mt-5 text-sidebar-foreground/65">
                Staff use their 10-digit staff number. Students use admission number. Parents use phone
                or email. Admins use email.
              </p>
            </div>
          </div>
          <a href="/" className="text-sm opacity-70 hover:opacity-100">
            ← Back to public site
          </a>
        </section>

        <section className="flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="surface-card p-8">
              <div className="mb-7">
                <div className="mb-3 grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                  <LockKeyhole />
                </div>
                <h2 className="font-display text-2xl font-bold">{title}</h2>
                <p className="text-sm text-muted-foreground">Use the credentials for this portal.</p>
              </div>

              {!configured && (
                <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                  Supabase is not configured.
                </div>
              )}

              <form className="space-y-4" onSubmit={onSubmit}>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{hint}</label>
                  <Input
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder={hint}
                    autoComplete="username"
                  />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-sm font-medium">Password</label>
                    <a href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                      Forgot password?
                    </a>
                  </div>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button className="w-full" loading={loading} type="submit">
                  Sign in <ArrowRight className="size-4" />
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                No account?{" "}
                <a href={`/signup?role=${role}`} className="text-primary hover:underline">
                  Sign up
                </a>
                {" · "}
                <a href="/login" className="text-primary hover:underline">
                  Other portals
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
