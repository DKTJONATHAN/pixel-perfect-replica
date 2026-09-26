import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Select } from "@/components/UI";
import { useAuth } from "@/context/AuthProvider";
import { useSchool } from "@/context/SchoolProvider";
import { computeTermResult } from "@/lib/grades";
import { className, downloadCsv, fullName, money, prettyDate } from "@/lib/format";
import { studentFeeSummary } from "@/lib/feeStatement";
import { TERMS } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/parent/")({ component: ParentPortal });

function ParentPortal() {
  const { user } = useAuth();
  const { db, refresh } = useSchool();
  const [linkedIds, setLinkedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [term, setTerm] = useState(db.settings.currentTerm || TERMS[0]!);

  useEffect(() => {
    if (!user) return;
    const sb = getSupabase();
    void sb
      .from("parent_students")
      .select("student_id")
      .eq("parent_profile_id", user.id)
      .then(({ data }) => {
        const ids = (data ?? []).map((r) => r.student_id as string);
        setLinkedIds(ids);
        if (ids[0]) setSelectedId(ids[0]);
      });
  }, [user]);

  const children = db.students.filter((s) => linkedIds.includes(s.id));
  const student = children.find((s) => s.id === selectedId) ?? children[0];

  const result = useMemo(() => {
    if (!student) return null;
    return computeTermResult(student.id, term, db.grades);
  }, [student, term, db.grades]);

  const classPeers = useMemo(() => {
    if (!student) return [];
    const peers = db.students.filter((s) => s.classId === student.classId && s.status === "Active");
    return peers
      .map((s) => computeTermResult(s.id, term, db.grades))
      .sort((a, b) => b.average - a.average);
  }, [student, term, db.grades, db.students]);

  const myRank = student
    ? classPeers.findIndex((r) => r.studentId === student.id) + 1
    : 0;

  const payments = student ? db.payments.filter((p) => p.studentId === student.id) : [];
  const feeSummary = student ? studentFeeSummary(db, student) : null;

  useEffect(() => {
    if (!student) return;
    const sb = getSupabase();
    const channel = sb
      .channel("parent-live-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "grades" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => void refresh())
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [student?.id, refresh]);

  function exportPerformance() {
    if (!student || !result) return;
    downloadCsv(
      `${student.admissionNo}-${term}-report.csv`,
      ["Subject", "Score", "Grade"],
      [
        ...result.subjects.map((s) => [s.subject, s.score, s.grade]),
        ["TOTAL", result.total, ""],
        ["AVERAGE", result.average, result.overallGrade],
        ["CLASS POSITION", myRank || "—", `of ${classPeers.length}`],
      ],
    );
  }

  function exportFees() {
    if (!student) return;
    downloadCsv(
      `${student.admissionNo}-fees.csv`,
      ["Receipt", "Term", "Amount", "Method", "Date"],
      payments.map((p) => [p.receiptNo, p.term, p.amount, p.method, p.date]),
    );
  }

  return (
    <AppShell portal="parent" title="Parent portal" subtitle="Your children's performance and fees">
      {children.length === 0 && (
        <Card className="border-warning/40 bg-warning/10">
          <p className="text-sm">
            No students are linked to this parent account yet. Ask the registrar to link your
            children.
          </p>
        </Card>
      )}

      {children.length > 0 && (
        <>
          <Card className="p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Child</span>
                <Select value={student?.id ?? ""} onChange={(e) => setSelectedId(e.target.value)}>
                  {children.map((s) => (
                    <option key={s.id} value={s.id}>
                      {fullName(s)} · {s.admissionNo}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Term</span>
                <Select value={term} onChange={(e) => setTerm(e.target.value)}>
                  {TERMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          </Card>

          {student && result && (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-medium">Performance · {term}</h2>
                    <p className="text-sm text-muted-foreground">
                      {fullName(student)} · {className(db, student.classId)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportPerformance}>
                    <Download className="size-4" /> Excel
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-display text-xl font-medium">{result.total}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Average</p>
                    <p className="font-display text-xl font-medium">{result.average}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Position</p>
                    <p className="font-display text-xl font-medium">
                      {myRank || "—"}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{classPeers.length}
                      </span>
                    </p>
                  </div>
                </div>
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2">Subject</th>
                      <th className="py-2">Score</th>
                      <th className="py-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.subjects.map((s) => (
                      <tr key={s.subject} className="border-b border-border/60">
                        <td className="py-2">{s.subject}</td>
                        <td className="py-2">{s.score}</td>
                        <td className="py-2">
                          <Badge tone="primary">{s.grade}</Badge>
                        </td>
                      </tr>
                    ))}
                    {result.subjects.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-muted-foreground">
                          No marks entered for this term yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <p className="mt-3 text-sm">
                  Overall grade:{" "}
                  <Badge tone="success">{result.overallGrade}</Badge>
                </p>
              </Card>

              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="size-5 text-primary" />
                    <h2 className="font-display text-lg font-medium">Fees & arrears</h2>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportFees}>
                    <Download className="size-4" /> Excel
                  </Button>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between rounded-lg bg-muted p-3">
                    <span>Annual fee</span>
                    <b>{money(feeSummary?.annualBilled ?? 0, db.settings.currency)}</b>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted p-3">
                    <span>Total paid</span>
                    <b>{money(feeSummary?.totalPaid ?? 0, db.settings.currency)}</b>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted p-3">
                    <span>Arrears / credit</span>
                    <b className={feeSummary?.annualCredit ? "text-success" : feeSummary?.totalArrears ? "text-destructive" : "text-success"}>
                      {feeSummary?.annualCredit
                        ? "Credit " + money(feeSummary.annualCredit, db.settings.currency)
                        : money(feeSummary?.totalArrears ?? 0, db.settings.currency)}
                    </b>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Term allocation</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      {(feeSummary?.terms ?? []).map((t) => (
                        <div key={t.term} className="rounded-md bg-muted p-2">
                          <p className="text-xs font-medium">{t.term}</p>
                          <p className="text-sm">Allocated {money(t.allocatedPaid, db.settings.currency)}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.balance > 0 ? "Arrears " + money(t.balance, db.settings.currency) : t.creditAfterTerm > 0 ? "Carry " + money(t.creditAfterTerm, db.settings.currency) : "Cleared"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <h3 className="mt-6 text-sm font-semibold">Payment history</h3>
                <ul className="mt-2 divide-y divide-border">
                  {payments.map((p) => (
                    <li key={p.id} className="flex justify-between py-2 text-sm">
                      <span>
                        {p.receiptNo} · {p.method}
                        <span className="block text-xs text-muted-foreground">
                          {prettyDate(p.date)}
                        </span>
                      </span>
                      <span className="font-medium">{money(p.amount, db.settings.currency)}</span>
                    </li>
                  ))}
                  {payments.length === 0 && (
                    <li className="py-4 text-center text-sm text-muted-foreground">No payments recorded.</li>
                  )}
                </ul>
              </Card>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
