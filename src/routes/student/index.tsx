import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, ClipboardList, Download, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card } from "@/components/UI";
import { useAuth } from "@/context/AuthProvider";
import { useSchool } from "@/context/SchoolProvider";
import { className, downloadCsv, exportStudentRecord, fullName, money, prettyDate } from "@/lib/format";
import { studentFeeSummary } from "@/lib/feeStatement";
import { TERMS } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/student/")({ component: StudentPortal });

function StudentPortal() {
  const { user } = useAuth();
  const { db, refresh } = useSchool();
  const me = db.students.find((s) => s.id === user?.studentId);

  const [term, setTerm] = useState(db.settings.currentTerm || TERMS[0]!);
  const myGrades = me ? db.grades.filter((g) => g.studentId === me.id) : [];
  const myAttendance = me ? db.attendance.filter((a) => a.studentId === me.id) : [];
  const present = myAttendance.filter((a) => a.status === "Present").length;
  const feeSummary = me ? studentFeeSummary(db, me) : null;

  useEffect(() => {
    if (!me) return;
    const sb = getSupabase();
    const channel = sb
      .channel("student-live-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "grades" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => void refresh())
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [me?.id, refresh]);

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
          value={feeSummary ? feeSummary.totalArrears > 0 ? money(feeSummary.totalArrears, db.settings.currency) : feeSummary.annualCredit > 0 ? "Credit " + money(feeSummary.annualCredit, db.settings.currency) : "Cleared" : "—"}
        />
      </div>

      {me && (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => exportStudentRecord(db, me)}>
            <Download className="size-4" /> Download my record
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const rows = db.grades
              .filter((g) => g.studentId === me.id && g.term === term)
              .map((g) => [g.subject, g.score]);
            downloadCsv(
              me.admissionNo + "-" + term.replace(/\s+/g, "-").toLowerCase() + "-report.csv",
              ["Subject", "Score", "Grade"],
              rows.map(([subject, score]) => [subject, score, Number(score) >= 80 ? "A" : Number(score) >= 70 ? "B" : Number(score) >= 60 ? "C" : Number(score) >= 50 ? "D" : "E"]),
            );
          }}>
            <Download className="size-4" /> Download report
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
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-medium">My report · {term}</h2>
                <Select value={term} onChange={(e) => setTerm(e.target.value)}>
                  {TERMS.map((t) => <option key={t}>{t}</option>)}
                </Select>
              </div>
            </div>
            <div className="divide-y divide-border">
              {myGrades.filter((g) => g.term === term).map((g) => (
                <div key={g.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span>{g.subject}</span>
                  <div className="flex items-center gap-3">
                    <span>{g.score}</span>
                    <Badge tone={g.score >= 50 ? "success" : "danger"}>{g.score >= 80 ? "A" : g.score >= 70 ? "B" : g.score >= 60 ? "C" : g.score >= 50 ? "D" : "E"}</Badge>
                  </div>
                </div>
              ))}
              {myGrades.filter((g) => g.term === term).length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">No grades entered for this term yet.</p>
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
