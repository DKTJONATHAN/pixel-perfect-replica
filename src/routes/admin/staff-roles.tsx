import { createFileRoute } from "@tanstack/react-router";
import { Plus, Save, Trash2, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Field, Select, TextInput } from "@/components/UI";
import { useSchool } from "@/context/SchoolProvider";
import { money } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { Staff, SupportDepartment, TeacherEmployment } from "@/lib/types";
import { logActivity } from "@/services/school";

export const Route = createFileRoute("/admin/staff-roles")({
  component: StaffRoles,
});

type StaffPatch = {
  department: string;
  teacherEmployment: TeacherEmployment | null;
  supportDepartment: SupportDepartment | null;
  salary: number;
};

const PAY_GROUPS: TeacherEmployment[] = ["TSC", "BOM", "PTA", "Casual"];
const SUPPORT_DEPARTMENTS: SupportDepartment[] = [
  "Administration",
  "Accounts",
  "Library",
  "Kitchen",
  "Cleaning",
  "Transport",
  "Security",
  "Grounds",
  "Clinic",
  "Other",
];

function currentWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // back to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function StaffRoles() {
  const { db, refresh } = useSchool();
  const [savingId, setSavingId] = useState<string | null>(null);

  async function saveStaff(s: Staff, patch: StaffPatch) {
    setSavingId(s.id);
    try {
      const sb = getSupabase();
      const { error } = await sb
        .from("staff")
        .update({
          department: patch.department,
          teacher_employment: patch.teacherEmployment,
          support_department: patch.supportDepartment,
          salary: patch.salary,
        })
        .eq("id", s.id);
      if (error) throw error;
      await logActivity("Registrar", `Updated staffing details for ${s.fullName}`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AppShell
      portal="admin"
      title="Roles & duty"
      subtitle="Departments, pay groups, class assignments and the duty roster"
      requires="staff.edit"
    >
      <Card>
        <div className="flex items-center gap-2">
          <UserCog className="size-5 text-primary" />
          <h2 className="font-display text-lg font-medium">Department & pay group</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign each staff member's department, funding source (TSC, BOM, PTA or Casual), and
          salary allocation.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Support area</th>
                <th className="px-4 py-3">Pay group</th>
                <th className="px-4 py-3">Salary</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {db.staff.map((s) => (
                <StaffRow
                  key={s.id}
                  staff={s}
                  saving={savingId === s.id}
                  currency={db.settings.currency}
                  onSave={(patch) => saveStaff(s, patch)}
                />
              ))}
              {db.staff.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No staff yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ClassAssignments />
        <DutyRoster />
      </div>
    </AppShell>
  );
}

function StaffRow({
  staff,
  saving,
  currency,
  onSave,
}: {
  staff: Staff;
  saving: boolean;
  currency: string;
  onSave: (patch: StaffPatch) => void;
}) {
  const [department, setDepartment] = useState(staff.department);
  const [supportDepartment, setSupportDepartment] = useState(staff.supportDepartment ?? "");
  const [payGroup, setPayGroup] = useState<TeacherEmployment | "">(staff.teacherEmployment ?? "");
  const [salary, setSalary] = useState(String(staff.salary));

  const dirty =
    department !== staff.department ||
    supportDepartment !== (staff.supportDepartment ?? "") ||
    payGroup !== (staff.teacherEmployment ?? "") ||
    Number(salary) !== staff.salary;

  return (
    <tr className="border-b border-border/70">
      <td className="px-4 py-3">
        <p className="font-medium">{staff.fullName}</p>
        <p className="text-xs text-muted-foreground">
          {staff.staffNo} · {staff.role}
        </p>
      </td>
      <td className="px-4 py-3">
        <TextInput
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-36"
        />
      </td>
      <td className="px-4 py-3">
        <Select
          value={supportDepartment}
          onChange={(e) => setSupportDepartment(e.target.value)}
          className="w-36"
        >
          <option value="">—</option>
          {SUPPORT_DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
      </td>
      <td className="px-4 py-3">
        <Select
          value={payGroup}
          onChange={(e) => setPayGroup(e.target.value as TeacherEmployment)}
          className="w-28"
        >
          <option value="">—</option>
          {PAY_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>
      </td>
      <td className="px-4 py-3">
        <TextInput
          type="number"
          min={0}
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          className="w-32"
        />
        <p className="mt-1 text-xs text-muted-foreground">{money(Number(salary) || 0, currency)}</p>
      </td>
      <td className="px-4 py-3">
        <Button
          size="sm"
          variant="outline"
          disabled={!dirty}
          loading={saving}
          onClick={() =>
            onSave({
              department,
              supportDepartment: (supportDepartment || null) as SupportDepartment | null,
              teacherEmployment: (payGroup || null) as TeacherEmployment | null,
              salary: Number(salary) || 0,
            })
          }
        >
          <Save className="size-4" /> Save
        </Button>
      </td>
    </tr>
  );
}

function ClassAssignments() {
  const { db, refresh } = useSchool();
  const [classId, setClassId] = useState(db.classes[0]?.id ?? "");
  const [staffId, setStaffId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const links = db.classTeachers.filter((c) => c.classId === classId);
  const teachers = db.staff.filter((s) => s.staffCategory === "Teacher");

  async function add() {
    if (!classId || !staffId) return;
    setSaving(true);
    try {
      const sb = getSupabase();
      const { error } = await sb
        .from("class_teachers")
        .insert({ class_id: classId, staff_id: staffId, note: note.trim() || null });
      if (error) throw error;
      const cls = db.classes.find((c) => c.id === classId);
      const staff = db.staff.find((s) => s.id === staffId);
      await logActivity(
        "Registrar",
        `Assigned ${staff?.fullName ?? "a teacher"} to ${cls?.name ?? "a class"} ${cls?.stream ?? ""}`,
      );
      setNote("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save this assignment.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const sb = getSupabase();
    const { error } = await sb.from("class_teachers").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-medium">Class assignments (optional)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add teachers to a class beyond its single class teacher — for subject or co-teaching
        support. Entirely optional.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Class">
          {(id) => (
            <Select id={id} value={classId} onChange={(e) => setClassId(e.target.value)}>
              {db.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.stream}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Teacher">
          {(id) => (
            <Select id={id} value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              <option value="">Select a teacher</option>
              {teachers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field label="Note (optional)" className="mt-3">
        {(id) => (
          <TextInput
            id={id}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Mathematics"
          />
        )}
      </Field>
      <Button className="mt-3" size="sm" onClick={add} loading={saving} disabled={!staffId}>
        <Plus className="size-4" /> Add assignment
      </Button>

      <ul className="mt-5 divide-y divide-border">
        {links.map((l) => {
          const staff = db.staff.find((s) => s.id === l.staffId);
          return (
            <li key={l.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {staff?.fullName ?? "Staff"}
                {l.note && <span className="text-muted-foreground"> · {l.note}</span>}
              </span>
              <Button variant="ghost" size="sm" onClick={() => remove(l.id)}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          );
        })}
        {links.length === 0 && (
          <li className="py-4 text-center text-sm text-muted-foreground">
            No additional teachers assigned to this class.
          </li>
        )}
      </ul>
    </Card>
  );
}

function DutyRoster() {
  const { db, refresh } = useSchool();
  const [staffId, setStaffId] = useState("");
  const [roleName, setRoleName] = useState("Teacher on duty");
  const [weekStart, setWeekStart] = useState(currentWeekStart());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const upcoming = [...db.dutyRoles].sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));

  async function assign() {
    if (!staffId || !roleName.trim()) return;
    setSaving(true);
    try {
      const sb = getSupabase();
      const { error } = await sb.from("duty_roles").insert({
        staff_id: staffId,
        role_name: roleName.trim(),
        week_start: weekStart,
        notes: notes.trim() || null,
      });
      if (error) throw error;
      const staff = db.staff.find((s) => s.id === staffId);
      await logActivity(
        "Registrar",
        `Assigned ${staff?.fullName ?? "a staff member"} as ${roleName} for week of ${weekStart}`,
      );
      setNotes("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save this assignment.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const sb = getSupabase();
    const { error } = await sb.from("duty_roles").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
  }

  return (
    <Card>
      <h2 className="font-display text-lg font-medium">Duty roster</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Assign rotating roles — e.g. Teacher on duty for the week — to any staff member.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Staff member">
          {(id) => (
            <Select id={id} value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              <option value="">Select staff</option>
              {db.staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Role">
          {(id) => (
            <TextInput id={id} value={roleName} onChange={(e) => setRoleName(e.target.value)} />
          )}
        </Field>
        <Field label="Week starting">
          {(id) => (
            <input
              id={id}
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
            />
          )}
        </Field>
        <Field label="Notes (optional)">
          {(id) => <TextInput id={id} value={notes} onChange={(e) => setNotes(e.target.value)} />}
        </Field>
      </div>
      <Button className="mt-3" size="sm" onClick={assign} loading={saving} disabled={!staffId}>
        <Plus className="size-4" /> Assign
      </Button>

      <ul className="mt-5 divide-y divide-border">
        {upcoming.map((d) => {
          const staff = db.staff.find((s) => s.id === d.staffId);
          return (
            <li key={d.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                <b>{d.roleName}</b> · {staff?.fullName ?? "Staff"}
                <span className="block text-xs text-muted-foreground">
                  Week of {d.weekStart}
                  {d.notes ? ` · ${d.notes}` : ""}
                </span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => remove(d.id)}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          );
        })}
        {upcoming.length === 0 && (
          <li className="py-4 text-center text-sm text-muted-foreground">
            No duty assignments yet.
          </li>
        )}
      </ul>
    </Card>
  );
}
