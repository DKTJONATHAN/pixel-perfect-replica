import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Mail, School } from "lucide-react";
import { Button, Input } from "@/components/UI";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPasswordPage });

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured.");
      return;
    }
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await getSupabase().auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (resetError) throw resetError;
      setMessage("If an account uses this email address, a password reset link has been sent. Check your inbox and spam folder.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset email.");
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
          <h1 className="mt-4 font-display text-2xl font-medium">Reset your password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the email address registered on your KidRight account.
          </p>
        </div>

        <div className="surface-card p-8">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email address</label>
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-primary">{message}</p>}
            <Button className="w-full" type="submit" loading={loading}>
              <Mail className="size-4" /> Send reset email
            </Button>
          </form>

          <p className="mt-6 text-center text-sm">
            <a href="/login" className="inline-flex items-center gap-2 text-primary hover:underline">
              <ArrowLeft className="size-4" /> Back to sign in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
