import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Input, Select } from "@/components/UI";
import { useAuth } from "@/context/AuthProvider";
import { useSchool } from "@/context/SchoolProvider";
import { computeTermResult } from "@/lib/grades";
import { fullName, letterGrade } from "@/lib/format";
import { SUBJECTS, TERMS } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/staff/marks")({ component: MarksEntry });

function MarksEntry() {
  const { user } = useAuth();
  const { db, refresh } = useSchool();
  const staffId = user?.staffId ?? "";

  const myAssignments = useMemo(
    () => db.assignments.filter((a) => a.staffId === staffId),
    [db.assignments, staffId],
  );

  const assignedClasses = useMemo(() => {
    const ids = new Set(myAssignments.map((a) => a.classId));
    if (ids.size) return db.classes.filter((c) => ids.has(c.id));
    return db.classes.filter((c) => c.teacherId === staffId);
  }, [db.classes, myAssignments, staffId]);

  const [classId, setClassId] = useState("");
  const [term, setTerm] = useState(db.settings.currentTerm || TERMS[0]!);
  const [subject, setSubject] = useState(SUBJECTS[0]!);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!classId && assignedClasses[0]?.id) setClassId(assignedClasses[0].id);
  }, [assignedClasses, classId]);

  const subjects = useMemo(() => {
    const assigned = myAssignments
      .filter((a) => a.classId === classId)
      .map((a) => a.subject);
    if (assigned.length) return [...new Set(assigned)];
    const teacher = db.staff.find((s) => s.id === staffId);
    return teacher?.subjects?.length ? teacher.subjects : SUBJECTS;
  }, [db.staff, myAssignments, classId, staffId]);

  useEffect(() => {
    if (!subjects.includes(subject)) setSubject(subjects[0] ?? SUBJECTS[0]!);
  }, [subjects, subject]);

  const learners = useMemo(
    () => db.students.filter((s) => s.classId === classId && s.status === "Active"),
    [db.students, classId],
  );

  useEffect(() => {
    const next: Record<string, string> = {};
    learners.forEach((s) => {
      const g = db.grades.find(
        (x) => x.studentId === s.id && x.term === term && x.subject === subject,
      );
      if (g) next[s.id] = String(g.score);
    });
    setScores(next);
    setSelectedIds(new Set(learners.map((s) => s.id)));
  }, [db.grades, learners, term, subject]);

  function toggleStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) =>
      prev.size === learners.length ? new Set() : new Set(learners.map((s) => s.id)),
    );
  }

  async function saveAll() {
    const chosen = learners.filter((s) => selectedIds.has(s.id));
    if (!chosen.length) {
      toast.error("Select at least one student");
      return;
    }

    setSaving(true);
    try {
      const sb = getSupabase();
      const rows = chosen
        .map((s) => {
          const raw = scores[s.id];
          if (raw === undefined || raw === "") return null;
          const score = Number(raw);
          if (!Number.isFinite(score) || score < 0 || score > 100) return null;
          return { student_id: s.id, term, subject, score };
        })
        .filter(Boolean) as { student_id: string; term: string; subject: string; score: number }[];

      if (!rows.length) {
        toast.error("Enter a valid score for at least one selected student");
        return;
      }

      const { error } = await sb.from("grades").upsert(rows, {
        onConflict: "student_id,term,subject",
      });
      if (error) throw new Error(error.message);

      await sb.from("activity_log").insert({
        actor: user?.name ?? "Teacher",
        message: "Saved " + subject + " marks for " + term + " (" + rows.length + " learners)",
      });

      toast.success("Marks saved — student and parent portals update live");
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
      subtitle="Select a class, subject and learners, enter scores, then save them together."
    >
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Class</span>
            <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select class…</option>
              {assignedClasses.map((c) => (
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
              {subjects.map((s) => (
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
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={learners.length > 0 && selectedIds.size === learners.length}
                    onChange={toggleAll}
                    aria-label="Select all students"
                  />
                </th>
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
                const merged = db.grades.filter(
                  (g) => !(g.studentId === s.id && g.term === term && g.subject === subject),
                );
                if (scoreNum !== null && Number.isFinite(scoreNum)) {
                  merged.push({
                    id: "draft-" + s.id,
                    studentId: s.id,
                    term,
                    subject,
                    score: scoreNum,
                  });
                }
                const result = computeTermResult(s.id, term, merged);
                return (
                  <tr key={s.id} className="border-b border-border/70">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleStudent(s.id)}
                        aria-label={"Select " + fullName(s)}
                      />
                    </td>
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
                      {scoreNum !== null && Number.isFinite(scoreNum) ? (
                        <Badge tone="primary">{letterGrade(scoreNum)}</Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">{result.subjects.length ? result.total : "—"}</td>
                    <td className="px-4 py-2">{result.subjects.length ? result.average : "—"}</td>
                    <td className="px-4 py-2">
                      {result.subjects.length ? <Badge tone="success">{result.overallGrade}</Badge> : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {learners.length === 0 && (
            <p className="p-8 text-center text-muted-foreground">
              No active learners are assigned to this class.
            </p>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border p-4">
          <p className="text-sm text-muted-foreground">{selectedIds.size} student(s) selected</p>
          <Button loading={saving} onClick={() => void saveAll()}>
            Save selected marks
          </Button>
        </div>
      </Card>
    </AppShell>
  );
}
