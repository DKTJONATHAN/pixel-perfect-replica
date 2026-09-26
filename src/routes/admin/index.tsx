import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  GraduationCap,
  Users,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Card } from "@/components/UI";
import { useSchool } from "@/context/SchoolProvider";
import { className, fullName, money, prettyDate, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/admin/")({ component: AdminPortal });

function AdminPortal() {
  const { db } = useSchool();
  const students = db.students.filter((s) => s.status === "Active").length;
  const staff = db.staff.filter((s) => s.status === "Active").length;
  const present = db.attendance.filter((a) => a.status === "Present").length;
  const total = db.attendance.length;
  const collected = db.payments.reduce((a, p) => a + p.amount, 0);

  return (
    <AppShell portal="admin" title="Admin dashboard" subtitle={`Welcome to ${db.settings.schoolName}.`}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={GraduationCap} label="Active students" value={students} />
        <Metric icon={Users} label="Active staff" value={staff} />
        <Metric
          icon={CalendarCheck}
          label="Attendance"
          value={total ? `${Math.round((present / total) * 100)}%` : "—"}
        />
        <Metric
          icon={Wallet}
          label="Fees collected"
          value={money(collected, db.settings.currency)}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          { to: "/admin/students", label: "Students" },
          { to: "/admin/staff", label: "Staff" },
          { to: "/admin/fees", label: "Fees" },
          { to: "/admin/settings", label: "Settings" },
        ].map((x) => (
          <Link key={x.to} to={x.to} className="surface-card p-4 text-center font-medium hover:shadow-pop">
            {x.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-medium">Recent activity</h2>
          </div>
          <div className="divide-y divide-border">
            {db.activity.slice(0, 8).map((a) => (
              <div key={a.id} className="px-5 py-4">
                <p className="text-sm">
                  <b>{a.actor}</b> {a.message}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{timeAgo(a.at)}</p>
              </div>
            ))}
            {db.activity.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
            )}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-warning" />
            <h2 className="font-display text-lg font-medium">Needs attention</h2>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex justify-between rounded-lg bg-muted p-3 text-sm">
              <span>Pending leave</span>
              <b>{db.leave.filter((l) => l.status === "Pending").length}</b>
            </div>
            <div className="flex justify-between rounded-lg bg-muted p-3 text-sm">
              <span>Active students</span>
              <b>{students}</b>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium">Latest students</h2>
          <Badge tone="primary">{db.students.length} total</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                <th className="px-3 py-3">Student</th>
                <th className="px-3 py-3">Admission</th>
                <th className="px-3 py-3">Class</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Admitted</th>
              </tr>
            </thead>
            <tbody>
              {db.students.slice(0, 8).map((s) => (
                <tr key={s.id} className="border-b border-border/70">
                  <td className="px-3 py-3 font-medium">{fullName(s)}</td>
                  <td className="px-3 py-3">{s.admissionNo}</td>
                  <td className="px-3 py-3 text-muted-foreground">{className(db as never, s.classId)}</td>
                  <td className="px-3 py-3">
                    <Badge tone={s.status === "Active" ? "success" : "neutral"}>{s.status}</Badge>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{prettyDate(s.admissionDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <div className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-medium">{value}</p>
    </Card>
  );
}
