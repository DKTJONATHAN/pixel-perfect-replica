import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole, School } from "lucide-react";
import { Button, Input } from "@/components/UI";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function checkSession() {
      if (!isSupabaseConfigured()) {
        if (mounted) setError("Supabase is not configured.");
        return;
      }
      const { data, error: sessionError } = await getSupabase().auth.getSession();
      if (!mounted) return;
      if (sessionError || !data.session) {
        setError("This password reset link is invalid or has expired. Request a new one.");
        return;
      }
      setReady(true);
    }
    void checkSession();
    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await getSupabase().auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword("");
      setConfirm("");
      setMessage("Your password has been updated. You can now sign in with your new password.");
      await getSupabase().auth.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl gradient-hero text-primary-foreground">
            <School className="size-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Choose a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Set a new password for your KidRight account.</p>
        </div>

        <div className="surface-card p-8">
          {!ready && !message ? (
            <p className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
              {error || "Checking your reset link…"}
            </p>
          ) : message ? (
            <div className="space-y-4">
              <p className="text-sm text-primary">{message}</p>
              <a href="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                Continue to sign in <ArrowRight className="size-4" />
              </a>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="mb-1.5 block text-sm font-medium">New password</label>
                <Input
                  required
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Confirm new password</label>
                <Input
                  required
                  minLength={6}
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" type="submit" loading={loading}>
                Update password
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
