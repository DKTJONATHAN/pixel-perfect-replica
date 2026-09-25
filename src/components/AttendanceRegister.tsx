/**
 * Interactive daily attendance register shared by the staff and admin portals.
 */
import { useEffect, useMemo, useState } from "react";
import { CheckCheck, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, Input, Select } from "@/components/UI";
import { useSchool } from "@/context/SchoolProvider";
import { fullName, prettyDate } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { AttendanceStatus } from "@/lib/types";

const STATUSES: AttendanceStatus[] = ["Present", "Absent", "Late"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function AttendanceRegister() {
  const { db, refresh } = useSchool();
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(today());
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!classId && db.classes[0]) setClassId(db.classes[0].id);
  }, [db.classes, classId]);

  const learners = useMemo(
    () =>
      db.students
        .filter((s) => s.classId === classId && s.status === "Active" && !s.archived)
        .sort((a, b) => fullName(a).localeCompare(fullName(b))),
    [db.students, classId],
  );

  // Load whatever is already recorded for this class + date.
  useEffect(() => {
    const next: Record<string, AttendanceStatus> = {};
    db.attendance
      .filter((a) => a.date === date)
      .forEach((a) => {
        next[a.studentId] = a.status;
      });
    setMarks(next);
  }, [date, classId, db.attendance]);

  const counts = useMemo(() => {
    const c = { Present: 0, Absent: 0, Late: 0, Unmarked: 0 };
    learners.forEach((s) => {
      const m = marks[s.id];
      if (m) c[m] += 1;
      else c.Unmarked += 1;
    });
    return c;
  }, [learners, marks]);

  function markAll(status: AttendanceStatus) {
    const next: Record<string, AttendanceStatus> = { ...marks };
    learners.forEach((s) => {
      next[s.id] = status;
    });
    setMarks(next);
  }

  async function save() {
    const rows = learners
      .filter((s) => marks[s.id])
      .map((s) => ({
        date,
        student_id: s.id,
        class_id: classId || null,
        status: marks[s.id]!,
      }));

    if (!rows.length) {
      toast.error("Mark at least one learner first");
      return;
    }

    setSaving(true);
    try {
      const sb = getSupabase();
      const { error } = await sb
        .from("attendance")
        .upsert(rows, { onConflict: "date,student_id" });
      if (error) throw new Error(error.message);

      await sb.from("activity_log").insert({
        actor: "Staff",
        message: `Attendance saved for ${prettyDate(date)} (${rows.length} learners)`,
      });

      toast.success(`Attendance saved for ${prettyDate(date)}`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save attendance");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
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
            <span className="font-medium">Date</span>
            <Input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Quick action</span>
            <Button variant="outline" className="w-full" onClick={() => markAll("Present")}>
              <CheckCheck className="size-4" /> Mark all present
            </Button>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Badge tone="success">Present {counts.Present}</Badge>
          <Badge tone="danger">Absent {counts.Absent}</Badge>
          <Badge tone="warning">Late {counts.Late}</Badge>
          <Badge tone="neutral">Unmarked {counts.Unmarked}</Badge>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <th className="px-5 py-3">Learner</th>
                <th className="px-5 py-3">Admission</th>
                <th className="px-5 py-3">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {learners.map((s) => (
                <tr key={s.id} className="border-b border-border/70">
                  <td className="px-5 py-3 font-medium">{fullName(s)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{s.admissionNo}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5">
                      {STATUSES.map((st) => (
                        <button
                          key={st}
                          type="button"
                          aria-pressed={marks[s.id] === st}
                          onClick={() => setMarks((prev) => ({ ...prev, [s.id]: st }))}
                          className={
                            marks[s.id] === st
                              ? "rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                              : "rounded-lg border border-input px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-ring"
                          }
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {learners.length === 0 && (
            <p className="p-10 text-center text-muted-foreground">
              No active learners in this class yet.
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border p-4">
          <p className="text-xs text-muted-foreground">
            Saving again for the same date updates the existing register.
          </p>
          <Button loading={saving} onClick={() => void save()}>
            <Save className="size-4" /> Save register
          </Button>
        </div>
      </Card>
    </>
  );
}
