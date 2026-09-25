import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, School, Shield, Users } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginHub });

function LoginHub() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl gradient-hero text-primary-foreground">
            <School className="size-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Choose your portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with your school account</p>
        </div>
        <div className="grid gap-3">
          <HubLink to="/login/student" icon={GraduationCap} title="Student" />
          <HubLink to="/login/staff" icon={Users} title="Staff" />
          <HubLink to="/login/admin" icon={Shield} title="Administrator" />
        </div>
        <p className="mt-6 text-center text-sm">
          <Link to="/" className="text-primary hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}

function HubLink({
  to,
  icon: Icon,
  title,
}: {
  to: string;
  icon: typeof GraduationCap;
  title: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:bg-muted"
    >
      <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
        <Icon className="size-5" />
      </span>
      <span className="font-medium">{title} portal</span>
      <span className="ml-auto text-muted-foreground">→</span>
    </Link>
  );
}
