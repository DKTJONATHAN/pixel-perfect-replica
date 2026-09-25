import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, Heart, School, Shield, Users } from "lucide-react";

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
          <p className="mt-1 text-sm text-muted-foreground">Sign in with your school credentials</p>
        </div>
        <div className="grid gap-3">
          <HubLink href="/login/student" icon={GraduationCap} title="Student" hint="Admission number" />
          <HubLink href="/login/staff" icon={Users} title="Staff / Teacher" hint="10-digit staff number" />
          <HubLink href="/login/parent" icon={Heart} title="Parent / Guardian" hint="Phone or email" />
          <HubLink href="/login/admin" icon={Shield} title="Admin / Registrar" hint="Email" />
        </div>
        <p className="mt-6 text-center text-sm">
          <a href="/" className="text-primary hover:underline">
            ← Back to home
          </a>
        </p>
      </div>
    </main>
  );
}

function HubLink({
  href,
  icon: Icon,
  title,
  hint,
}: {
  href: string;
  icon: typeof GraduationCap;
  title: string;
  hint: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 no-underline transition hover:bg-muted"
    >
      <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block font-medium text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <span className="ml-auto text-muted-foreground">→</span>
    </a>
  );
}
