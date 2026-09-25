import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, School } from "lucide-react";
import { Button, Input, Select } from "@/components/UI";
import { isSupabaseConfigured } from "@/lib/supabase";
import { registerAccount } from "@/lib/customAuth";
import { allocateStaffNumber } from "@/services/registration";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/signup")({ component: SignupPage });

type SignupKind = "parent" | "student" | "staff" | "teacher" | "registrar";

function SignupPage() {
  const [kind, setKind] = useState<SignupKind>("parent");
  const [fullName, setFullName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [assignedStaffNo, setAssignedStaffNo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setAssignedStaffNo(null);

    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured.");
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
      let id = loginId.trim();
      let role: Role = "parent";
      let parentPhone: string | undefined;

      if (kind === "parent") {
        if (!id) throw new Error("Enter phone number (this is your login ID).");
        role = "parent";
        parentPhone = id;
        id = id.replace(/\D/g, "") || id;
      } else if (kind === "student") {
        if (!id) throw new Error("Enter admission number.");
        role = "student";
      } else if (kind === "staff" || kind === "teacher") {
        id = await allocateStaffNumber();
        role = kind === "teacher" ? "teacher" : "staff";
        setAssignedStaffNo(id);
      } else {
        if (!id || !id.includes("@")) {
          throw new Error("Registrar: use an email as login ID (for identification only — not Auth email).");
        }
        role = "registrar";
        id = id.toLowerCase();
      }

      const result = await registerAccount({
        loginId: id,
        password,
        fullName: fullName.trim(),
        role,
        parentPhone,
      });

      if (!result.ok) throw new Error(result.error);

      setMessage("Account created. You can sign in with your login ID and password.");
      setPassword("");
      setConfirm("");
      if (kind === "staff" || kind === "teacher") {
        setAssignedStaffNo(id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  const loginLabel =
    kind === "student"
      ? "Admission number"
      : kind === "parent"
        ? "Phone number"
        : kind === "registrar"
          ? "Email (as login ID only)"
          : "Staff number (auto-assigned)";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl gradient-hero text-primary-foreground">
            <School className="size-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Create an account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            No email required. Sign in with staff number, admission number, or phone + password.
          </p>
        </div>

        <div className="surface-card p-8">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium">I am signing up as</label>
              <Select value={kind} onChange={(e) => setKind(e.target.value as SignupKind)}>
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

            {kind !== "staff" && kind !== "teacher" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">{loginLabel}</label>
                <Input
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder={loginLabel}
                  autoComplete="username"
                />
              </div>
            )}

            {(kind === "staff" || kind === "teacher") && (
              <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                A unique <strong>10-digit staff number</strong> is assigned on submit. That number is your
                login ID.
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
            {assignedStaffNo && (
              <p className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm font-medium">
                Your staff number: <strong>{assignedStaffNo}</strong>
                <br />
                Use this + your password on the Staff portal.
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
        </div>
      </div>
    </main>
  );
}
