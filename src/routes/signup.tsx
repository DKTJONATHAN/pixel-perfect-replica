import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, School } from "lucide-react";
import { Button, Input, Select } from "@/components/UI";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  parentAuthEmail,
  staffAuthEmail,
  studentAuthEmail,
  allocateStaffNumber,
} from "@/services/registration";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/signup")({ component: SignupPage });

type SignupKind = "parent" | "student" | "staff" | "teacher" | "registrar";

function SignupPage() {
  const [kind, setKind] = useState<SignupKind>("parent");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [admissionNo, setAdmissionNo] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdLogin, setCreatedLogin] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setCreatedLogin(null);

    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Set VITE_SUPABASE_* build variables and redeploy.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!fullName.trim()) {
      setError("Enter your full name.");
      return;
    }

    setLoading(true);
    try {
      const sb = getSupabase();
      let authEmail = "";
      let loginId = "";
      let role: Role = "parent";

      if (kind === "parent") {
        const id = (email.trim() || phone.trim()).toLowerCase();
        if (!id) throw new Error("Enter email or phone.");
        authEmail = parentAuthEmail(email.trim() || phone.trim());
        loginId = phone.replace(/\D/g, "") || email.trim().toLowerCase();
        role = "parent";
      } else if (kind === "student") {
        if (!admissionNo.trim()) throw new Error("Enter admission number.");
        authEmail = studentAuthEmail(admissionNo.trim());
        loginId = admissionNo.trim();
        role = "student";
      } else if (kind === "staff" || kind === "teacher") {
        const staffNo = await allocateStaffNumber();
        authEmail = staffAuthEmail(staffNo);
        loginId = staffNo;
        role = kind === "teacher" ? "teacher" : "staff";
      } else {
        // registrar / school admin — real email
        if (!email.trim().includes("@")) throw new Error("Registrar needs a real email address.");
        authEmail = email.trim().toLowerCase();
        loginId = authEmail;
        role = "registrar";
      }

      const { data, error: signErr } = await sb.auth.signUp({
        email: authEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
            login_id: loginId,
          },
        },
      });

      if (signErr) throw new Error(signErr.message);
      if (!data.user) throw new Error("Account was not created.");

      // Profile row (trigger may also create it; upsert is safe)
      const { error: profErr } = await sb.from("profiles").upsert({
        id: data.user.id,
        email: authEmail,
        full_name: fullName.trim(),
        role,
        login_id: loginId,
        parent_phone: kind === "parent" ? phone || null : null,
      });

      if (profErr) {
        // Auth user exists; profile may need SQL fix — still tell user how to sign in
        console.error(profErr);
        setMessage(
          `Account created in Auth, but profile save failed (${profErr.message}). You can still try signing in; if role is wrong, fix profiles in SQL.`,
        );
      } else {
        setMessage(
          data.session
            ? "Account created. You can sign in now."
            : "Account created. Confirm your email if required, then sign in.",
        );
      }

      setCreatedLogin(
        kind === "staff" || kind === "teacher"
          ? `Staff number: ${loginId} (use this to sign in)`
          : kind === "student"
            ? `Admission number: ${loginId}`
            : kind === "parent"
              ? `Sign in with phone/email: ${email || phone}`
              : `Sign in with email: ${authEmail}`,
      );

      setPassword("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
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
          <h1 className="mt-4 font-display text-2xl font-bold">Create an account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Writes to Supabase Auth and your profile. Staff get a 10-digit staff number.
          </p>
        </div>

        <div className="surface-card p-8">
          {!isSupabaseConfigured() && (
            <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
              Supabase is not configured on this deploy.
            </div>
          )}

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium">I am signing up as</label>
              <Select
                value={kind}
                onChange={(e) => setKind(e.target.value as SignupKind)}
              >
                <option value="parent">Parent / guardian</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="staff">Support staff</option>
                <option value="registrar">School admin / registrar</option>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Full name</label>
              <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            {(kind === "parent" || kind === "registrar") && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {kind === "registrar" ? "Email" : "Email (or use phone below)"}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required={kind === "registrar"}
                  autoComplete="email"
                />
              </div>
            )}

            {kind === "parent" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07…" />
              </div>
            )}

            {kind === "student" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Admission number</label>
                <Input
                  required
                  value={admissionNo}
                  onChange={(e) => setAdmissionNo(e.target.value)}
                  placeholder="e.g. KRA/2026/0001"
                />
              </div>
            )}

            {(kind === "staff" || kind === "teacher") && (
              <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                A unique <strong>10-digit staff number</strong> will be assigned. Use that number + this
                password to sign in on the Staff portal.
              </p>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Confirm password</label>
              <Input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-primary">{message}</p>}
            {createdLogin && (
              <p className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm font-medium">
                {createdLogin}
              </p>
            )}

            <Button className="w-full" type="submit" loading={loading}>
              Create account <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
          <p className="mt-2 text-center text-sm">
            <a href="/" className="text-primary hover:underline">
              ← Back to home
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
