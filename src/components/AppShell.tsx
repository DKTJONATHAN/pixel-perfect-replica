/**
 * Authenticated layout for student / staff / admin / parent portals.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BadgeDollarSign,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PenLine,
  Plane,
  School,
  Settings as SettingsIcon,
  Sun,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthProvider";
import { useSchool, type Permission } from "@/context/SchoolProvider";
import type { Role } from "@/lib/types";
import { Avatar, Button, Spinner } from "@/components/UI";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: Permission;
};

const NAV_BY_PORTAL: Record<string, { group: string; items: NavItem[] }[]> = {
  student: [
    {
      group: "My learning",
      items: [{ to: "/student", label: "Dashboard", icon: LayoutDashboard }],
    },
  ],
  parent: [
    {
      group: "Family",
      items: [{ to: "/parent", label: "Children", icon: LayoutDashboard }],
    },
  ],
  staff: [
    {
      group: "Overview",
      items: [{ to: "/staff", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      group: "Teaching",
      items: [
        { to: "/staff/students", label: "Students", icon: GraduationCap, permission: "students.view" },
        { to: "/staff/classes", label: "Classes", icon: School, permission: "students.view" },
        {
          to: "/staff/attendance",
          label: "Attendance",
          icon: CalendarCheck,
          permission: "attendance.mark",
        },
        { to: "/staff/marks", label: "Enter marks", icon: PenLine, permission: "grades.edit" },
        { to: "/staff/grades", label: "Grades list", icon: ClipboardList, permission: "grades.edit" },
      ],
    },
  ],
  admin: [
    {
      group: "Overview",
      items: [
        { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { to: "/admin/register", label: "Registration", icon: UserPlus, permission: "register.manage" },
      ],
    },
    {
      group: "Students",
      items: [
        { to: "/admin/students", label: "Students", icon: GraduationCap, permission: "students.view" },
        { to: "/admin/classes", label: "Classes", icon: School, permission: "students.view" },
        {
          to: "/admin/attendance",
          label: "Attendance",
          icon: CalendarCheck,
          permission: "attendance.mark",
        },
        { to: "/admin/grades", label: "Grades", icon: ClipboardList, permission: "grades.edit" },
        { to: "/admin/fees", label: "Fees", icon: BadgeDollarSign, permission: "fees.manage" },
      ],
    },
    {
      group: "Staff",
      items: [
        { to: "/admin/staff", label: "Staff", icon: Users, permission: "staff.view" },
        { to: "/admin/leave", label: "Leave", icon: Plane, permission: "staff.view" },
        { to: "/admin/payroll", label: "Payroll", icon: Wallet, permission: "payroll.view" },
      ],
    },
    {
      group: "School",
      items: [
        { to: "/admin/settings", label: "Settings", icon: SettingsIcon, permission: "settings.manage" },
      ],
    },
  ],
};

function portalHome(role: Role): string {
  if (role === "admin" || role === "registrar") return "/admin";
  if (role === "teacher" || role === "staff") return "/staff";
  if (role === "parent") return "/parent";
  return "/student";
}

function canAccessPortal(userRole: Role, portal: Role): boolean {
  if (portal === "admin") return userRole === "admin" || userRole === "registrar";
  if (portal === "staff") return userRole === "staff" || userRole === "teacher" || userRole === "admin";
  if (portal === "student") return userRole === "student";
  if (portal === "parent") return userRole === "parent";
  return userRole === portal;
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl gradient-hero text-primary-foreground shadow-sm">
        <School className="size-5" aria-hidden />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate font-display text-base leading-tight font-medium">KidRight</span>
          <span className="block truncate text-[11px] tracking-wide text-muted-foreground uppercase">
            Academy
          </span>
        </span>
      )}
    </span>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  actions,
  requires,
  portal,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  requires?: Permission;
  portal: Role;
}) {
  const { ready: authReady, user, signOut } = useAuth();
  const { ready, can, theme, toggleTheme } = useSchool();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const shellKey = portal === "parent" ? "parent" : portal === "student" ? "student" : portal === "admin" ? "admin" : "staff";

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      const login =
        portal === "parent"
          ? "/login/parent"
          : portal === "student"
            ? "/login/student"
            : portal === "admin"
              ? "/login/admin"
              : "/login/staff";
      navigate({ to: login });
      return;
    }
    if (!canAccessPortal(user.role, portal === "staff" ? "staff" : portal)) {
      navigate({ to: portalHome(user.role) });
    }
  }, [authReady, user, portal, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!authReady || !ready) return <Spinner label="Loading" />;
  if (!user) return <Spinner label="Redirecting to sign in" />;

  if (requires && !can(requires)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="surface-card max-w-md p-8 text-center">
          <h1 className="font-display text-xl font-medium">You don't have access to this page</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is signed in as {roleLabel(user.role)}.
          </p>
          <Button className="mt-5" onClick={() => navigate({ to: portalHome(user.role) })}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const navGroups = NAV_BY_PORTAL[shellKey] ?? [];
  const nav = navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !i.permission || can(i.permission)),
    }))
    .filter((g) => g.items.length);

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 lg:static lg:translate-x-0",
          collapsed ? "lg:w-20" : "lg:w-64",
          mobileOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-sidebar-border px-4">
          <span className="min-w-0 text-sidebar-foreground">
            <Logo compact={collapsed} />
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {nav.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-sidebar-foreground/50 uppercase">
                  {group.group}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    pathname === item.to ||
                    (item.to !== portalHome(portal) && pathname.startsWith(item.to));
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        title={item.label}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-foreground"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                        )}
                      >
                        <item.icon className="size-4.5 shrink-0" aria-hidden />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent lg:flex"
          >
            <PanelLeftClose className={cn("size-4.5 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>

          <div className="relative ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              onClick={toggleTheme}
            >
              {theme === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
            </Button>

            <div className="ml-1 flex items-center gap-2 border-l border-border pl-3">
              <Avatar name={user.name} size="sm" />
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-sm font-medium">{user.name}</span>
                <span className="block text-xs text-muted-foreground">{roleLabel(user.role)}</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                onClick={() => void signOut().then(() => navigate({ to: "/" }))}
              >
                <LogOut className="size-4.5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="no-print mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function roleLabel(role: string) {
  if (role === "admin") return "Administrator";
  if (role === "registrar") return "Registrar";
  if (role === "teacher") return "Teacher";
  if (role === "staff") return "Staff";
  if (role === "parent") return "Parent";
  return "Student";
}
