import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Input, Select } from "@/components/UI";
import { useSchool } from "@/context/SchoolProvider";
import { computeTermResult } from "@/lib/grades";
import { fullName, letterGrade } from "@/lib/format";
import { SUBJECTS, TERMS } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/staff/marks")({ component: MarksEntry });

function MarksEntry() {
  const { db, refresh } = useSchool();
  const [classId, setClassId] = useState(db.classes[0]?.id ?? "");
  const [term, setTerm] = useState(db.settings.currentTerm || TERMS[0]!);
  const [subject, setSubject] = useState(SUBJECTS[0]!);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const learners = useMemo(
    () => db.students.filter((s) => s.classId === classId && s.status === "Active"),
    [db.students, classId],
  );

  // Prefill from existing grades
  useMemo(() => {
    const next: Record<string, string> = {};
    learners.forEach((s) => {
      const g = db.grades.find(
        (x) => x.studentId === s.id && x.term === term && x.subject === subject,
      );
      if (g) next[s.id] = String(g.score);
    });
    setScores((prev) => ({ ...next, ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, term, subject, learners.length]);

  async function saveAll() {
    setSaving(true);
    try {
      const sb = getSupabase();
      const rows = learners
        .map((s) => {
          const raw = scores[s.id];
          if (raw === undefined || raw === "") return null;
          const score = Number(raw);
          if (Number.isNaN(score) || score < 0 || score > 100) return null;
          return { student_id: s.id, term, subject, score };
        })
        .filter(Boolean) as { student_id: string; term: string; subject: string; score: number }[];

      if (!rows.length) {
        toast.error("Enter at least one score");
        return;
      }

      const { error } = await sb.from("grades").upsert(rows, {
        onConflict: "student_id,term,subject",
      });
      if (error) throw new Error(error.message);

      await sb.from("activity_log").insert({
        actor: "Teacher",
        message: `Saved ${subject} marks for ${term} (${rows.length} learners)`,
      });

      toast.success("Marks saved — totals updated for students and parents");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save marks");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      portal="staff"
      title="Enter marks"
      subtitle="Scores save per subject. Totals and averages update automatically for students and parents."
    >
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Class</span>
            <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
              {db.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.stream}
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
          <label className="space-y-1 text-sm">
            <span className="font-medium">Subject</span>
            <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">{subject} score</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Term total</th>
                <th className="px-4 py-3">Term avg</th>
                <th className="px-4 py-3">Overall</th>
              </tr>
            </thead>
            <tbody>
              {learners.map((s) => {
                const draft = scores[s.id];
                const scoreNum = draft === undefined || draft === "" ? null : Number(draft);
                // Merge draft into grades for live total
                const merged = db.grades.filter(
                  (g) => !(g.studentId === s.id && g.term === term && g.subject === subject),
                );
                if (scoreNum !== null && !Number.isNaN(scoreNum)) {
                  merged.push({
                    id: "draft",
                    studentId: s.id,
                    term,
                    subject,
                    score: scoreNum,
                  });
                }
                const result = computeTermResult(s.id, term, merged);
                return (
                  <tr key={s.id} className="border-b border-border/70">
                    <td className="px-4 py-2 font-medium">{fullName(s)}</td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="w-24"
                        value={scores[s.id] ?? ""}
                        onChange={(e) =>
                          setScores((prev) => ({ ...prev, [s.id]: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      {scoreNum !== null && !Number.isNaN(scoreNum) ? (
                        <Badge tone="primary">{letterGrade(scoreNum)}</Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">{result.subjects.length ? result.total : "—"}</td>
                    <td className="px-4 py-2">{result.subjects.length ? result.average : "—"}</td>
                    <td className="px-4 py-2">
                      {result.subjects.length ? (
                        <Badge tone="success">{result.overallGrade}</Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {learners.length === 0 && (
            <p className="p-8 text-center text-muted-foreground">No active learners in this class.</p>
          )}
        </div>
        <div className="border-t border-border p-4">
          <Button loading={saving} onClick={() => void saveAll()}>
            Save marks
          </Button>
        </div>
      </Card>
    </AppShell>
  );
}
