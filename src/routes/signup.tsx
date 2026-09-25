import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole, School } from "lucide-react";
import { Button, Input } from "@/components/UI";
import { useAuth } from "@/context/AuthProvider";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const { configured, signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    const result = await signUp(email, password, fullName);
    setLoading(false);
    if (!result.ok) return setError(result.error ?? "Sign up failed.");
    if (result.needsConfirmation) {
      setMessage("Account created. Check your email to confirm your account, then sign in.");
      return;
    }
    await navigate({ to: "/login/student" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl gradient-hero text-primary-foreground"><School className="size-6" /></div>
          <h1 className="mt-4 font-display text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Student accounts use secure Supabase authentication.</p>
        </div>
        <div className="surface-card p-8">
          {!configured && <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">Supabase is not configured. Add your environment variables first.</div>}
          <form className="space-y-4" onSubmit={submit}>
            <div><label className="mb-1.5 block text-sm font-medium">Full name</label><Input required value={fullName} onChange={e=>setFullName(e.target.value)} /></div>
            <div><label className="mb-1.5 block text-sm font-medium">Email</label><Input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
            <div><label className="mb-1.5 block text-sm font-medium">Password</label><Input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} /></div>
            <div><label className="mb-1.5 block text-sm font-medium">Confirm password</label><Input type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} /></div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-primary">{message}</p>}
            <Button className="w-full" loading={loading} type="submit">Create account <ArrowRight className="size-4" /></Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link to="/login/student" className="text-primary hover:underline">Sign in</Link></p>
          <p className="mt-3 text-center text-sm"><Link to="/" className="text-primary hover:underline">← Back to home</Link></p>
        </div>
      </div>
    </main>
  );
}
