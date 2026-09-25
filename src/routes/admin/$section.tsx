import { createFileRoute } from "@tanstack/react-router";
import { Download, Search } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Input } from "@/components/UI";
import { useSchool } from "@/context/SchoolProvider";
import { className, downloadCsv, fullName, money, prettyDate } from "@/lib/format";
import type { SchoolData } from "@/lib/types";

export const Route = createFileRoute("/admin/$section")({ component: AdminSection });

const META: Record<string, [string, string | undefined]> = {
  students: ["Students", "students.view"],
  classes: ["Classes", "classes.manage"],
  attendance: ["Attendance", "attendance.mark"],
  grades: ["Grades", "grades.edit"],
  fees: ["Fees", "fees.manage"],
  staff: ["Staff", "staff.view"],
  leave: ["Leave", "staff.view"],
  payroll: ["Payroll", "payroll.view"],
  settings: ["Settings", "settings.manage"],
};

function AdminSection() {
  const { section } = Route.useParams();
  const { db } = useSchool();
  const [q, setQ] = useState("");
  const m = META[section] ?? ["Workspace", undefined];

  const exportRows = () => {
    if (section === "students")
      downloadCsv(
        "students.csv",
        ["Admission", "Name", "Class", "Status"],
        db.students.map((s) => [s.admissionNo, fullName(s), className(db as never, s.classId), s.status]),
      );
    if (section === "staff")
      downloadCsv(
        "staff.csv",
        ["Staff No", "Name", "Role", "Status"],
        db.staff.map((s) => [s.staffNo, s.fullName, s.role, s.status]),
      );
  };

  return (
    <AppShell portal="admin" title={m[0]} subtitle="Manage academy records." requires={m[1] as never}>
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="relative sm:w-96">
            <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${m[0].toLowerCase()}...`}
            />
          </div>
          <Button variant="outline" onClick={exportRows}>
            <Download className="size-4" /> Export
          </Button>
        </div>
      </Card>
      <Card className="mt-6 overflow-hidden p-0">
        <Table section={section} db={db} q={q} />
      </Card>
    </AppShell>
  );
}

function Table({ section, db, q }: { section: string; db: SchoolData; q: string }) {
  const ql = q.trim().toLowerCase();
  let headers: string[] = [];
  let rows: (string | number | React.ReactNode)[][] = [];

  if (section === "students") {
    headers = ["Student", "Admission", "Class", "Guardian", "Status"];
    rows = db.students
      .filter(
        (x) =>
          !ql ||
          fullName(x).toLowerCase().includes(ql) ||
          x.admissionNo.toLowerCase().includes(ql),
      )
      .map((x) => [
        fullName(x),
        x.admissionNo,
        className(db as never, x.classId),
        x.guardianName,
        <Badge key={x.id} tone={x.status === "Active" ? "success" : "neutral"}>
          {x.status}
        </Badge>,
      ]);
  } else if (section === "classes") {
    headers = ["Class", "Teacher", "Students", "Term fee"];
    rows = db.classes.map((x) => [
      `${x.name} · ${x.stream}`,
      db.staff.find((z) => z.id === x.teacherId)?.fullName ?? "Unassigned",
      db.students.filter((z) => z.classId === x.id).length,
      money(x.feePerTerm, db.settings.currency),
    ]);
  } else if (section === "attendance") {
    headers = ["Date", "Student", "Class", "Status"];
    rows = db.attendance.slice(0, 100).map((x) => {
      const st = db.students.find((z) => z.id === x.studentId);
      return [
        prettyDate(x.date),
        st ? fullName(st) : "—",
        className(db as never, x.classId),
        x.status,
      ];
    });
  } else if (section === "grades") {
    headers = ["Student", "Term", "Subject", "Score"];
    rows = db.grades.slice(0, 100).map((x) => {
      const st = db.students.find((z) => z.id === x.studentId);
      return [st ? fullName(st) : "—", x.term, x.subject, x.score];
    });
  } else if (section === "fees") {
    headers = ["Receipt", "Amount", "Method", "Date"];
    rows = db.payments.map((x) => [
      x.receiptNo,
      money(x.amount, db.settings.currency),
      x.method,
      prettyDate(x.date),
    ]);
  } else if (section === "staff") {
    headers = ["Staff", "Staff No", "Role", "Department", "Status"];
    rows = db.staff
      .filter((x) => !ql || x.fullName.toLowerCase().includes(ql))
      .map((x) => [x.fullName, x.staffNo, x.role, x.department, x.status]);
  } else if (section === "leave") {
    headers = ["Staff", "Type", "Dates", "Days", "Status"];
    rows = db.leave.map((x) => [
      db.staff.find((z) => z.id === x.staffId)?.fullName ?? "Staff",
      x.type,
      `${prettyDate(x.from)} – ${prettyDate(x.to)}`,
      x.days,
      x.status,
    ]);
  } else if (section === "payroll") {
    headers = ["Staff", "Role", "Salary", "Status"];
    rows = db.staff.map((x) => [
      x.fullName,
      x.role,
      money(x.salary, db.settings.currency),
      x.status,
    ]);
  } else {
    headers = ["Setting", "Value"];
    rows = Object.entries(db.settings).map(([k, v]) => [k, String(v)]);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            {headers.map((h) => (
              <th className="px-5 py-3" key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/70">
              {r.map((v, j) => (
                <td className="px-5 py-3" key={j}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="p-10 text-center text-muted-foreground">No matching records.</p>
      )}
    </div>
  );
}
