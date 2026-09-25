import { createFileRoute, Link } from "@tanstack/react-router";
import { School } from "lucide-react";

/**
 * Public self-signup is disabled. Accounts are created by the registrar
 * after employment or admission (staff number / admission number).
 */
export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl gradient-hero text-primary-foreground">
          <School className="size-6" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">Registration is by the school</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Student, teacher, and staff accounts are created by the registrar after admission or
          employment. You will receive a staff number or admission number and a temporary password.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/login"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Go to sign in
          </Link>
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
