import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Input, Modal, Select, TextArea, statusTone } from "@/components/UI";
import { useAuth } from "@/context/AuthProvider";
import { useSchool } from "@/context/SchoolProvider";
import { exportStudentFeeStatement, studentFeeSummary } from "@/lib/feeStatement";
import { className, downloadCsv, fullName, money } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { Student, StudentStatus } from "@/lib/types";

export const Route = createFileRoute("/admin/students")({
  head: () => ({
    meta: [
      { title: "Learners — KidRight Academy" },
      { name: "description", content: "Manage learner status, guardian details and individual fee statements." },
      { property: "og:title", content: "Learners — KidRight Academy" },
      { property: "og:description", content: "Manage learner status, guardian details and individual fee statements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentsPage,
});

const STATUSES: StudentStatus[] = ["Active", "Suspended", "Expelled", "Transferred", "Graduated"];

function StudentsPage() {
  const { db, refresh } = useSchool();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return db.students.filter(
      (s) =>
        !s.archived &&
        (!classFilter || s.classId === classFilter) &&
        (!statusFilter || s.status === statusFilter) &&
        (!ql || fullName(s).toLowerCase().includes(ql) || s.admissionNo.toLowerCase().includes(ql)),
    );
  }, [db.students, q, classFilter, statusFilter]);

  return (
    <AppShell portal="admin" title="Learners" subtitle="Status changes are approved by the administrator only." requires="students.view">
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
            <Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or admission number" />
          </div>
          <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All classes</option>
            {db.classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} · {c.stream}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(
                "learners.csv",
                ["Admission", "Name", "Class", "Guardian", "Phone", "Status"],
                rows.map((s) => [s.admissionNo, fullName(s), className(db, s.classId), s.guardianName, s.guardianPhone, s.status]),
              )
            }
          >
            <Download className="size-4" /> Export list
          </Button>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <th className="px-5 py-3">Learner</th>
                <th className="px-5 py-3">Admission</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Guardian</th>
                <th className="px-5 py-3">Arrears</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const fees = studentFeeSummary(db, s);
                return (
                  <tr key={s.id} className="border-b border-border/70">
                    <td className="px-5 py-3 font-medium">{fullName(s)}</td>
                    <td className="px-5 py-3">{s.admissionNo}</td>
                    <td className="px-5 py-3">{className(db, s.classId)}</td>
                    <td className="px-5 py-3">{s.guardianName || "—"}<div className="text-xs text-muted-foreground">{s.guardianPhone}</div></td>
                    <td className="px-5 py-3">{money(fees.totalArrears, db.settings.currency)}</td>
                    <td className="px-5 py-3"><Badge tone={statusTone(s.status)}>{s.status}</Badge></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setSelected(s)}>
                          <ShieldCheck className="size-4" /> Manage
                        </Button>
                        <Button size="sm" variant="ghost" aria-label="Export fee statement" onClick={() => exportStudentFeeStatement(db, s)}>
                          <FileSpreadsheet className="size-4" /> Fees
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-10 text-center text-muted-foreground">No matching learners.</p>}
        </div>
      </Card>

      {selected && (
        <ManageModal
          key={selected.id}
          student={selected}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onSaved={() => void refresh()}
        />
      )}
    </AppShell>
  );
}

function ManageModal({ student, isAdmin, onClose, onSaved }: { student: Student; isAdmin: boolean; onClose: () => void; onSaved: () => void }) {
  const { db } = useSchool();
  const [status, setStatus] = useState<StudentStatus>(student.status);
  const [reason, setReason] = useState("");
  const [guardianName, setGuardianName] = useState(student.guardianName);
  const [guardianPhone, setGuardianPhone] = useState(student.guardianPhone);
  const [guardianEmail, setGuardianEmail] = useState(student.guardianEmail);
  const [saving, setSaving] = useState(false);
  const fees = studentFeeSummary(db, student);

  async function save() {
    const statusChanged = status !== student.status;
    if (statusChanged && !isAdmin) {
      toast.error("Only the administrator can change a learner's status");
      return;
    }
    if (statusChanged && status !== "Active" && !reason.trim()) {
      toast.error("Give a reason for this status change");
      return;
    }
    setSaving(true);
    try {
      const sb = getSupabase();
      const { error } = await sb
        .from("students")
        .update({ status, guardian_name: guardianName, guardian_phone: guardianPhone, guardian_email: guardianEmail })
        .eq("id", student.id);
      if (error) throw new Error(error.message);
      if (statusChanged) {
        await sb.from("activity_log").insert({
          actor: "Administrator",
          message: `${fullName(student)} marked ${status}${reason.trim() ? ` — ${reason.trim()}` : ""}`,
        });
      }
      toast.success("Learner updated");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the learner");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={fullName(student)} description={`${student.admissionNo} · ${fees.className} · Class teacher: ${fees.classTeacher}`}>
      <div className="space-y-4">
        <div className="rounded-lg bg-muted p-3 text-sm">
          Fees paid: <strong>{money(fees.totalPaid, db.settings.currency)}</strong> · Arrears:{" "}
          <strong>{money(fees.totalArrears, db.settings.currency)}</strong>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Status {isAdmin ? "" : "(administrator only)"}</span>
          <Select value={status} disabled={!isAdmin} onChange={(e) => setStatus(e.target.value as StudentStatus)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </label>
        {status !== student.status && (
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Reason</span>
            <TextArea value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Guardian name</span>
            <Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Guardian phone</span>
            <Input value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Guardian email</span>
          <Input type="email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} />
        </label>
        <div className="flex flex-wrap justify-between gap-2">
          <Button variant="outline" onClick={() => exportStudentFeeStatement(db, student)}>
            <FileSpreadsheet className="size-4" /> Fee statement
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button loading={saving} onClick={() => void save()}>Save</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
