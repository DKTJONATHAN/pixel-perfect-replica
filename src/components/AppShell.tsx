/**
 * Authenticated layout: collapsible sidebar, top navbar with global search,
 * notifications and dark-mode toggle, plus role-based route protection.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BadgeDollarSign,
  Bell,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  Plane,
  School,
  Search,
  Settings as SettingsIcon,
  Sun,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSchool, type Permission } from "@/context/SchoolProvider";
import { Avatar, Badge, Button, Spinner } from "@/components/UI";
import { fullName, money, prettyDate } from "@/lib/format";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: Permission;
};

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Overview",
    items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    group: "Students",
    items: [
      { to: "/students", label: "Students", icon: GraduationCap, permission: "students.view" },
      { to: "/classes", label: "Classes", icon: School, permission: "students.view" },
      { to: "/attendance", label: "Attendance", icon: CalendarCheck, permission: "attendance.mark" },
      { to: "/grades", label: "Grades", icon: ClipboardList, permission: "grades.edit" },
      { to: "/fees", label: "Fees", icon: BadgeDollarSign, permission: "fees.manage" },
    ],
  },
  {
    group: "Staff",
    items: [
      { to: "/staff", label: "Staff", icon: Users, permission: "staff.view" },
      { to: "/leave", label: "Leave", icon: Plane, permission: "staff.view" },
      { to: "/payroll", label: "Payroll", icon: Wallet, permission: "payroll.view" },
    ],
  },
  {
    group: "School",
    items: [{ to: "/settings", label: "Settings", icon: SettingsIcon, permission: "settings.manage" }],
  },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl gradient-hero text-primary-foreground shadow-sm">
        <School className="size-5" aria-hidden />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate font-display text-base leading-tight font-bold">
            KidRight
          </span>
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
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  requires?: Permission;
}) {
  const { ready, user, can, logout, theme, toggleTheme, db } = useSchool();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/" });
  }, [ready, user, navigate]);

  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  const notifications = useMemo(() => {
    const pendingLeave = db.leave.filter((l) => l.status === "Pending");
    const items = pendingLeave.map((l) => ({
      id: l.id,
      title: "Leave request awaiting review",
      body: `${db.staff.find((s) => s.id === l.staffId)?.fullName ?? "Staff"} · ${l.type} · ${l.days} days`,
    }));
    const balances = db.students
      .filter((s) => s.status === "Active")
      .map((s) => {
        const cls = db.classes.find((c) => c.id === s.classId);
        const paid = db.payments
          .filter((p) => p.studentId === s.id)
          .reduce((a, p) => a + p.amount, 0);
        return { student: s, balance: (cls?.feePerTerm ?? 0) - paid };
      })
      .filter((x) => x.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 4);
    balances.forEach((b) =>
      items.push({
        id: `fee-${b.student.id}`,
        title: "Fee balance outstanding",
        body: `${fullName(b.student)} owes ${money(b.balance, db.settings.currency)}`,
      }),
    );
    return items;
  }, [db]);

  if (!ready) return <Spinner label="Opening KidRight Academy" />;
  if (!user) return <Spinner label="Redirecting to sign in" />;

  if (requires && !can(requires)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="surface-card max-w-md p-8 text-center">
          <h1 className="font-display text-xl font-bold">You don't have access to this page</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is signed in as {roleLabel(user.role)}. Ask an administrator if you need
            access.
          </p>
          <Button className="mt-5" onClick={() => navigate({ to: "/dashboard" })}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const visibleNav = NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.permission || can(i.permission)),
  })).filter((g) => g.items.length);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 lg:static lg:translate-x-0",
          collapsed ? "lg:w-20" : "lg:w-64",
          mobileOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-sidebar-border px-4">
          <span className="min-w-0 text-sidebar-foreground [&_span]:text-sidebar-foreground">
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
          {visibleNav.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-sidebar-foreground/50 uppercase">
                  {group.group}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
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

      {/* Main column */}
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

          <GlobalSearch />

          <div className="relative ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              onClick={toggleTheme}
            >
              {theme === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              onClick={() => setNotifOpen((o) => !o)}
              className="relative"
            >
              <Bell className="size-5" />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {notifications.length}
                </span>
              )}
            </Button>

            {notifOpen && (
              <div className="surface-card absolute top-14 right-0 z-30 w-80 p-4 shadow-pop">
                <h3 className="text-sm font-semibold">Notifications</h3>
                <ul className="mt-3 space-y-3">
                  {notifications.length === 0 && (
                    <li className="text-sm text-muted-foreground">You're all caught up.</li>
                  )}
                  {notifications.slice(0, 6).map((n) => (
                    <li key={n.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="ml-1 flex items-center gap-2 border-l border-border pl-3">
              <Avatar name={user.name} size="sm" />
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-sm font-medium">{user.name}</span>
                <span className="block text-xs text-muted-foreground">{roleLabel(user.role)}</span>
              </span>
              <Button variant="ghost" size="icon" aria-label="Sign out" onClick={logout}>
                <LogOut className="size-4.5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="no-print mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
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
  if (role === "teacher") return "Teacher";
  return "Registrar";
}

/** Search across students and staff from the navbar. */
function GlobalSearch() {
  const { db } = useSchool();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (q.length < 2) return { students: [], staff: [] };
    return {
      students: db.students
        .filter(
          (s) =>
            fullName(s).toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q),
        )
        .slice(0, 5),
      staff: db.staff
        .filter((s) => s.fullName.toLowerCase().includes(q) || s.staffNo.toLowerCase().includes(q))
        .slice(0, 5),
    };
  }, [term, db]);

  const hasResults = results.students.length + results.staff.length > 0;

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <label htmlFor="global-search" className="sr-only">
        Search students and staff
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        id="global-search"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder="Search students or staff…"
        className="w-full rounded-lg border border-input bg-background py-2.5 pr-3 pl-9 text-sm placeholder:text-muted-foreground"
      />
      {open && term.trim().length >= 2 && (
        <div className="surface-card absolute top-12 left-0 z-30 w-full p-2 shadow-pop">
          {!hasResults && (
            <p className="px-2 py-3 text-sm text-muted-foreground">No matches for “{term}”.</p>
          )}
          {results.students.map((s) => (
            <Link
              key={s.id}
              to="/students/$studentId"
              params={{ studentId: s.id }}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted"
            >
              <Avatar name={fullName(s)} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{fullName(s)}</span>
                <span className="block text-xs text-muted-foreground">{s.admissionNo}</span>
              </span>
              <Badge tone="primary" className="ml-auto">
                Student
              </Badge>
            </Link>
          ))}
          {results.staff.map((s) => (
            <Link
              key={s.id}
              to="/staff/$staffId"
              params={{ staffId: s.id }}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted"
            >
              <Avatar name={s.fullName} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{s.fullName}</span>
                <span className="block text-xs text-muted-foreground">
                  {s.role} · joined {prettyDate(s.dateJoined)}
                </span>
              </span>
              <Badge tone="accent" className="ml-auto">
                Staff
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
