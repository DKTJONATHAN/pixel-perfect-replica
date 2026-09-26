import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Input, Select } from "@/components/UI";
import { useSchool } from "@/context/SchoolProvider";
import { className, prettyDate } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import { DUTY_TYPES, SUBJECTS } from "@/lib/types";

export const Route = createFileRoute("/admin/duties")({
  head: () => ({
    meta: [
      { title: "Duties & teaching assignments — KidRight Academy" },
      { name: "description", content: "Set the weekly teacher on duty and assign teachers to classes and subjects." },
      { property: "og:title", content: "Duties & teaching assignments — KidRight Academy" },
      { property: "og:description", content: "Set the weekly teacher on duty and assign teachers to classes and subjects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DutiesPage,
});

function mondayOf(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x.toISOString().slice(0, 10);
}

function tableMissing(msg: string) {
  return /duty_roster|teaching_assignments|does not exist|schema cache/i.test(msg)
    ? "This feature needs the latest database update (script 006) to be run first."
    : msg;
}

function DutiesPage() {
  const { db, refresh } = useSchool();
  const active = useMemo(() => db.staff.filter((s) => s.status === "Active" && !s.archived), [db.staff]);
  const teachers = useMemo(() => active.filter((s) => s.role === "Teacher" || s.staffCategory === "Teacher"), [active]);
  const name = (id: string) => db.staff.find((s) => s.id === id)?.fullName ?? "—";

  // Duty form
  const [week, setWeek] = useState(mondayOf(new Date()));
  const [dutyStaff, setDutyStaff] = useState("");
  const [duty, setDuty] = useState(DUTY_TYPES[0]!);
  // Assignment form
  const [aStaff, setAStaff] = useState("");
  const [aClass, setAClass] = useState("");
  const [aSubject, setASubject] = useState(SUBJECTS[0]!);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) {
    setBusy(true);
    try {
      const { error } = await fn();
      if (error) throw new Error(error.message);
      toast.success(ok);
      await refresh();
    } catch (e) {
      toast.error(tableMissing(e instanceof Error ? e.message : "Something went wrong"));
    } finally {
      setBusy(false);
    }
  }

  const addDuty = () => {
    if (!dutyStaff) return toast.error("Choose a staff member");
    void run(
      () => getSupabase().from("duty_roster").insert({ week_start: mondayOf(new Date(week)), staff_id: dutyStaff, duty }),
      `${name(dutyStaff)} set as ${duty.toLowerCase()}`,
    );
  };

  const addAssignment = () => {
    if (!aStaff || !aClass) return toast.error("Choose a teacher and a class");
    void run(
      () =>
        getSupabase()
          .from("teaching_assignments")
          .upsert({ staff_id: aStaff, class_id: aClass, subject: aSubject }, { onConflict: "class_id,subject" }),
      `${name(aStaff)} now teaches ${aSubject} in ${className(db, aClass)}`,
    );
  };

  const thisWeek = mondayOf(new Date());

  return (
    <AppShell portal="admin" title="Duties & teaching" subtitle="Weekly duty rota and who teaches what." requires="classes.manage">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold">Duty rota</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Week starting</span>
              <Input type="date" value={week} onChange={(e) => setWeek(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Duty</span>
              <Select value={duty} onChange={(e) => setDuty(e.target.value)}>
                {DUTY_TYPES.map((d) => <option key={d}>{d}</option>)}
              </Select>
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">Staff member</span>
              <Select value={dutyStaff} onChange={(e) => setDutyStaff(e.target.value)}>
                <option value="">Select…</option>
                {active.map((s) => <option key={s.id} value={s.id}>{s.fullName} · {s.role}</option>)}
              </Select>
            </label>
          </div>
          <Button className="mt-4" loading={busy} onClick={addDuty}><Plus className="size-4" /> Assign duty</Button>

          <ul className="mt-6 divide-y divide-border text-sm">
            {db.duty.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="font-medium">{name(d.staffId)} — {d.duty}</p>
                  <p className="text-xs text-muted-foreground">
                    Week of {prettyDate(d.weekStart)}{d.weekStart === thisWeek ? " · this week" : ""}
                  </p>
                </div>
                <Button size="icon" variant="ghost" aria-label="Remove duty" onClick={() => void run(() => getSupabase().from("duty_roster").delete().eq("id", d.id), "Duty removed")}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
            {db.duty.length === 0 && <li className="py-6 text-center text-muted-foreground">No duties assigned yet.</li>}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-bold">Teaching assignments</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Class</span>
              <Select value={aClass} onChange={(e) => setAClass(e.target.value)}>
                <option value="">Select…</option>
                {db.classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.stream}</option>)}
              </Select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Subject</span>
              <Select value={aSubject} onChange={(e) => setASubject(e.target.value)}>
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">Teacher</span>
              <Select value={aStaff} onChange={(e) => setAStaff(e.target.value)}>
                <option value="">Select…</option>
                {(teachers.length ? teachers : active).map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
              </Select>
            </label>
          </div>
          <Button className="mt-4" loading={busy} onClick={addAssignment}><Plus className="size-4" /> Assign</Button>

          <ul className="mt-6 divide-y divide-border text-sm">
            {db.assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="font-medium">{className(db, a.classId)} · {a.subject}</p>
                  <p className="text-xs text-muted-foreground">{name(a.staffId)}</p>
                </div>
                <Button size="icon" variant="ghost" aria-label="Remove assignment" onClick={() => void run(() => getSupabase().from("teaching_assignments").delete().eq("id", a.id), "Assignment removed")}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
            {db.assignments.length === 0 && <li className="py-6 text-center text-muted-foreground">No assignments yet.</li>}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
