import { createFileRoute, redirect } from "@tanstack/react-router";
import { Download, Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Input } from "@/components/UI";
import { useSchool } from "@/context/SchoolProvider";
import { className, downloadCsv, fullName, money, prettyDate } from "@/lib/format";
import type { SchoolData } from "@/lib/types";

export const Route = createFileRoute("/staff/$section")({
  beforeLoad: ({ params }) => {
    const allowed = ["students", "attendance", "grades", "classes"];
    if (!allowed.includes(params.section)) {
      throw redirect({ to: "/staff" });
    }
  },
  component: StaffSection,
});

const TITLES: Record<string, string> = {
  students: "Students",
  attendance: "Attendance",
  grades: "Grades",
  classes: "Classes",
};

function StaffSection() {
  const { section } = Route.useParams();
  const { db } = useSchool();
  const [q, setQ] = useState("");
  const title = TITLES[section] ?? "Workspace";

  return (
    <AppShell portal="staff" title={title} subtitle="Teaching workspace">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="relative sm:w-96">
            <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
            />
          </div>
          {section === "students" && (
            <Button
              variant="outline"
              onClick={() =>
                downloadCsv(
                  "students.csv",
                  ["Admission", "Name", "Class", "Status"],
                  db.students.map((s) => [
                    s.admissionNo,
                    fullName(s),
                    className(db, s.classId),
                    s.status,
                  ]),
                )
              }
            >
              <Download className="size-4" /> Export
            </Button>
          )}
        </div>
      </Card>
      <Card className="mt-6 overflow-hidden p-0">
        <DataTable section={section} db={db} q={q} />
      </Card>
    </AppShell>
  );
}

function DataTable({ section, db, q }: { section: string; db: SchoolData; q: string }) {
  const ql = q.trim().toLowerCase();
  let headers: string[] = [];
  let rows: (string | number | ReactNode)[][] = [];

  if (section === "students") {
    headers = ["Student", "Admission", "Class", "Status"];
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
        className(db, x.classId),
        <Badge key={x.id} tone={x.status === "Active" ? "success" : "neutral"}>
          {x.status}
        </Badge>,
      ]);
  } else if (section === "classes") {
    headers = ["Class", "Students", "Term fee"];
    rows = db.classes.map((x) => [
      `${x.name} · ${x.stream}`,
      db.students.filter((z) => z.classId === x.id).length,
      money(x.feePerTerm, db.settings.currency),
    ]);
  } else if (section === "attendance") {
    headers = ["Date", "Student", "Status"];
    rows = db.attendance.slice(0, 100).map((x) => {
      const st = db.students.find((z) => z.id === x.studentId);
      return [prettyDate(x.date), st ? fullName(st) : "—", x.status];
    });
  } else {
    headers = ["Student", "Term", "Subject", "Score"];
    rows = db.grades.slice(0, 100).map((x) => {
      const st = db.students.find((z) => z.id === x.studentId);
      return [st ? fullName(st) : "—", x.term, x.subject, x.score];
    });
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
