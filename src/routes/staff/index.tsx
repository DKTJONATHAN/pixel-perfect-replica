import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, ClipboardList, GraduationCap, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/UI";
import { useAuth } from "@/context/AuthProvider";
import { useSchool } from "@/context/SchoolProvider";

export const Route = createFileRoute("/staff/")({ component: StaffPortal });

function StaffPortal() {
  const { user } = useAuth();
  const { db } = useSchool();
  const me = db.staff.find((s) => s.id === user?.staffId);
  const myClasses = me ? db.classes.filter((c) => c.teacherId === me.id) : db.classes;
  const activeStudents = db.students.filter((s) => s.status === "Active").length;

  return (
    <AppShell portal="staff" title="Staff portal" subtitle={me ? `Welcome, ${me.fullName}` : undefined}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={GraduationCap} label="Active students" value={activeStudents} />
        <Metric icon={Users} label="My classes" value={myClasses.length} />
        <Metric icon={CalendarCheck} label="Attendance records" value={db.attendance.length} />
        <Metric icon={ClipboardList} label="Grade entries" value={db.grades.length} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <QuickLink to="/staff/students" title="Students" body="View and update learner records" />
        <QuickLink to="/staff/attendance" title="Attendance" body="Mark daily class attendance" />
        <QuickLink to="/staff/grades" title="Grades" body="Enter and review assessment scores" />
      </div>

      <Card className="mt-6">
        <h2 className="font-display text-lg font-medium">My classes</h2>
        <ul className="mt-4 divide-y divide-border">
          {myClasses.map((c) => (
            <li key={c.id} className="flex justify-between py-3 text-sm">
              <span className="font-medium">
                {c.name} · {c.stream}
              </span>
              <span className="text-muted-foreground">
                {db.students.filter((s) => s.classId === c.id).length} learners
              </span>
            </li>
          ))}
          {myClasses.length === 0 && (
            <li className="py-6 text-center text-sm text-muted-foreground">No classes assigned.</li>
          )}
        </ul>
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
  value: number;
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

function QuickLink({ to, title, body }: { to: string; title: string; body: string }) {
  return (
    <Link to={to} className="surface-card block p-5 transition hover:shadow-pop">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </Link>
  );
}
