import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, ClipboardList, Download, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card } from "@/components/UI";
import { useAuth } from "@/context/AuthProvider";
import { useSchool } from "@/context/SchoolProvider";
import { className, exportStudentRecord, fullName, money, prettyDate } from "@/lib/format";

export const Route = createFileRoute("/student/")({ component: StudentPortal });

function StudentPortal() {
  const { user } = useAuth();
  const { db } = useSchool();
  const me = db.students.find((s) => s.id === user?.studentId);

  const myGrades = me ? db.grades.filter((g) => g.studentId === me.id) : [];
  const myAttendance = me ? db.attendance.filter((a) => a.studentId === me.id) : [];
  const present = myAttendance.filter((a) => a.status === "Present").length;
  const myPayments = me ? db.payments.filter((p) => p.studentId === me.id) : [];
  const paid = myPayments.reduce((a, p) => a + p.amount, 0);
  const cls = me ? db.classes.find((c) => c.id === me.classId) : null;
  const balance = (cls?.feePerTerm ?? 0) - paid;

  return (
    <AppShell
      portal="student"
      title="My portal"
      subtitle={me ? `Welcome, ${fullName(me)}` : "Student dashboard"}
    >
      {!me && (
        <Card className="mb-6 border-warning/40 bg-warning/10">
          <p className="text-sm">
            Your account is not linked to a student record yet. Ask the school office to link your
            profile.
          </p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          icon={CalendarCheck}
          label="Attendance"
          value={myAttendance.length ? `${Math.round((present / myAttendance.length) * 100)}%` : "—"}
        />
        <Metric icon={ClipboardList} label="Subjects graded" value={myGrades.length} />
        <Metric
          icon={Wallet}
          label="Fee balance"
          value={money(Math.max(0, balance), db.settings.currency)}
        />
      </div>

      {me && (
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => exportStudentRecord(db, me)}>
            <Download className="size-4" /> Export my record
          </Button>
        </div>
      )}

      {me && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="font-display text-lg font-medium">Profile</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Admission" value={me.admissionNo} />
              <Row label="Class" value={className(db as never, me.classId)} />
              <Row label="Status" value={me.status} />
              <Row label="Guardian" value={me.guardianName} />
              <Row label="Admitted" value={prettyDate(me.admissionDate)} />
            </dl>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-lg font-medium">Recent grades</h2>
            </div>
            <div className="divide-y divide-border">
              {myGrades.slice(0, 8).map((g) => (
                <div key={g.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span>
                    {g.subject} · {g.term}
                  </span>
                  <Badge tone={g.score >= 50 ? "success" : "danger"}>{g.score}</Badge>
                </div>
              ))}
              {myGrades.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">No grades yet.</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarCheck;
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
