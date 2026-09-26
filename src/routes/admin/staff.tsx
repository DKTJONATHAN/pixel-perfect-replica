import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Input, Modal, Select, statusTone } from "@/components/UI";
import { useSchool } from "@/context/SchoolProvider";
import { downloadCsv, money } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import {
  EMPLOYMENT_TERMS,
  SUPPORT_DEPARTMENTS,
  type Staff,
  type StaffRole,
  type StaffStatus,
  type TeacherEmployment,
} from "@/lib/types";

export const Route = createFileRoute("/admin/staff")({
  head: () => ({
    meta: [
      { title: "Staff control — KidRight Academy" },
      { name: "description", content: "Assign staff to departments and roles, and set TSC, BOM, PTA and casual salaries." },
      { property: "og:title", content: "Staff control — KidRight Academy" },
      { property: "og:description", content: "Assign staff to departments and roles, and set TSC, BOM, PTA and casual salaries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StaffPage,
});

const ROLES: StaffRole[] = ["Teacher", "Administrator", "Accountant", "Librarian", "Support Staff", "Cook", "Cleaner", "Driver", "Security", "Nurse"];
const STAFF_STATUSES: StaffStatus[] = ["Active", "On Leave", "Terminated"];

function StaffPage() {
  const { db, refresh } = useSchool();
  const [q, setQ] = useState("");
  const [termFilter, setTermFilter] = useState("");
  const [editing, setEditing] = useState<Staff | null>(null);
  const cur = db.settings.currency;

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return db.staff.filter(
      (s) =>
        !s.archived &&
        (!termFilter || (s.teacherEmployment ?? "") === termFilter) &&
        (!ql || s.fullName.toLowerCase().includes(ql) || s.staffNo.includes(ql)),
    );
  }, [db.staff, q, termFilter]);

  const payroll = useMemo(() => {
    const by: Record<string, { count: number; total: number }> = {};
    db.staff
      .filter((s) => s.status !== "Terminated" && !s.archived)
      .forEach((s) => {
        const k = s.teacherEmployment ?? "Unspecified";
        by[k] ??= { count: 0, total: 0 };
        by[k].count += 1;
        by[k].total += s.salary;
      });
    return by;
  }, [db.staff]);

  return (
    <AppShell portal="admin" title="Staff control" subtitle="Departments, roles, terms of employment and salaries." requires="staff.view">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[...EMPLOYMENT_TERMS, "Unspecified"].map((k) => (
          <Card key={k} className="p-4">
            <p className="text-xs text-muted-foreground uppercase">{k}</p>
            <p className="mt-1 font-display text-xl font-bold">{money(payroll[k]?.total ?? 0, cur)}</p>
            <p className="text-xs text-muted-foreground">{payroll[k]?.count ?? 0} staff · monthly</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
            <Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or staff number" />
          </div>
          <Select value={termFilter} onChange={(e) => setTermFilter(e.target.value)}>
            <option value="">All employment terms</option>
            {EMPLOYMENT_TERMS.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(
                "staff-payroll.csv",
                ["Staff No", "Name", "Role", "Department", "Terms", "Salary", "Status"],
                rows.map((s) => [s.staffNo, s.fullName, s.role, s.supportDepartment ?? s.department, s.teacherEmployment ?? "", s.salary, s.status]),
              )
            }
          >
            <Download className="size-4" /> Export payroll
          </Button>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <th className="px-5 py-3">Staff</th>
                <th className="px-5 py-3">Staff No</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Terms</th>
                <th className="px-5 py-3">Salary</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Edit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-border/70">
                  <td className="px-5 py-3 font-medium">{s.fullName}</td>
                  <td className="px-5 py-3">{s.staffNo}</td>
                  <td className="px-5 py-3">{s.role}</td>
                  <td className="px-5 py-3">{s.supportDepartment ?? s.department}</td>
                  <td className="px-5 py-3">{s.teacherEmployment ? <Badge tone="primary">{s.teacherEmployment}</Badge> : "—"}</td>
                  <td className="px-5 py-3">{money(s.salary, cur)}</td>
                  <td className="px-5 py-3"><Badge tone={statusTone(s.status)}>{s.status}</Badge></td>
                  <td className="px-5 py-3">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>
                      <Pencil className="size-4" /> Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-10 text-center text-muted-foreground">No matching staff.</p>}
        </div>
      </Card>

      {editing && <StaffModal key={editing.id} staff={editing} onClose={() => setEditing(null)} onSaved={() => void refresh()} />}
    </AppShell>
  );
}

function StaffModal({ staff, onClose, onSaved }: { staff: Staff; onClose: () => void; onSaved: () => void }) {
  const { can } = useSchool();
  const [role, setRole] = useState<StaffRole>(staff.role);
  const [department, setDepartment] = useState(staff.supportDepartment ?? "");
  const [deptText, setDeptText] = useState(staff.department);
  const [terms, setTerms] = useState<TeacherEmployment | "">(staff.teacherEmployment ?? "");
  const [salary, setSalary] = useState(String(staff.salary));
  const [status, setStatus] = useState<StaffStatus>(staff.status);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!can("staff.edit")) {
      toast.error("You don't have permission to edit staff");
      return;
    }
    const pay = Number(salary);
    if (!Number.isFinite(pay) || pay < 0) {
      toast.error("Enter a valid salary");
      return;
    }
    setSaving(true);
    try {
      const sb = getSupabase();
      const { error } = await sb
        .from("staff")
        .update({
          role,
          department: deptText.trim() || department || "General",
          support_department: department || null,
          teacher_employment: terms || null,
          salary: pay,
          status,
        })
        .eq("id", staff.id);
      if (error) throw new Error(error.message);
      await sb.from("activity_log").insert({
        actor: "Administrator",
        message: `Updated ${staff.fullName}: ${role}, ${terms || "no terms"}, salary ${pay}`,
      });
      toast.success("Staff record updated");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update staff");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={staff.fullName} description={`Staff No ${staff.staffNo}`}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Role</span>
            <Select value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </Select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Department</span>
            <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">Teaching / academic</option>
              {SUPPORT_DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </Select>
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Department label (e.g. Sciences, Languages)</span>
          <Input value={deptText} onChange={(e) => setDeptText(e.target.value)} />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Employed by</span>
            <Select value={terms} onChange={(e) => setTerms(e.target.value as TeacherEmployment | "")}>
              <option value="">Not set</option>
              {EMPLOYMENT_TERMS.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Monthly salary</span>
            <Input type="number" min={0} value={salary} onChange={(e) => setSalary(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Status</span>
            <Select value={status} onChange={(e) => setStatus(e.target.value as StaffStatus)}>
              {STAFF_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={() => void save()}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
