import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Input, Modal, Select } from "@/components/UI";
import { useSchool } from "@/context/SchoolProvider";
import { money } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { SchoolClass } from "@/lib/types";

export const Route = createFileRoute("/admin/classes")({
  head: () => ({
    meta: [
      { title: "Classes & streams — KidRight Academy" },
      {
        name: "description",
        content: "Create classes and streams, set term fees and assign class teachers.",
      },
      { property: "og:title", content: "Classes & streams — KidRight Academy" },
      {
        property: "og:description",
        content: "Create classes and streams, set term fees and assign class teachers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClassesPage,
});

function ClassesPage() {
  const { db, refresh } = useSchool();
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [creating, setCreating] = useState(false);

  const teachers = useMemo(
    () => db.staff.filter((s) => s.status === "Active" && !s.archived),
    [db.staff],
  );

  return (
    <AppShell
      portal="admin"
      title="Classes & streams"
      subtitle="Set up classes, term fees and class teachers."
      requires="classes.manage"
      actions={
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> New class
        </Button>
      }
    >
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Stream</th>
                <th className="px-5 py-3">Class teacher</th>
                <th className="px-5 py-3">Learners</th>
                <th className="px-5 py-3">Term fee</th>
                <th className="px-5 py-3">Edit</th>
              </tr>
            </thead>
            <tbody>
              {db.classes.map((c) => (
                <tr key={c.id} className="border-b border-border/70">
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3">{c.stream}</td>
                  <td className="px-5 py-3">
                    {db.staff.find((s) => s.id === c.teacherId)?.fullName ?? "Unassigned"}
                  </td>
                  <td className="px-5 py-3">
                    {db.students.filter((s) => s.classId === c.id && !s.archived).length}
                  </td>
                  <td className="px-5 py-3">{money(c.feePerTerm, db.settings.currency)}</td>
                  <td className="px-5 py-3">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(c)}>
                      <Pencil className="size-4" /> Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {db.classes.length === 0 && (
            <p className="p-10 text-center text-muted-foreground">
              No classes yet. Use “New class” to add the first one.
            </p>
          )}
        </div>
      </Card>

      <ClassModal
        key={editing?.id ?? (creating ? "new" : "closed")}
        open={creating || !!editing}
        record={editing}
        teachers={teachers}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={() => void refresh()}
      />
    </AppShell>
  );
}

function ClassModal({
  open,
  record,
  teachers,
  onClose,
  onSaved,
}: {
  open: boolean;
  record: SchoolClass | null;
  teachers: { id: string; fullName: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(record?.name ?? "");
  const [stream, setStream] = useState(record?.stream ?? "Blue");
  const [teacherId, setTeacherId] = useState(record?.teacherId ?? "");
  const [fee, setFee] = useState(String(record?.feePerTerm ?? ""));
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      toast.error("Give the class a name");
      return;
    }
    const feeValue = Number(fee || 0);
    if (!Number.isFinite(feeValue) || feeValue < 0) {
      toast.error("Enter a valid term fee");
      return;
    }
    setSaving(true);
    try {
      const sb = getSupabase();
      const payload = {
        name: name.trim(),
        stream: stream.trim() || "Blue",
        teacher_id: teacherId || null,
        fee_per_term: feeValue,
      };
      const { error } = record
        ? await sb.from("classes").update(payload).eq("id", record.id)
        : await sb.from("classes").insert(payload);
      if (error) throw new Error(error.message);

      await sb.from("activity_log").insert({
        actor: "Administrator",
        message: `${record ? "Updated" : "Created"} class ${payload.name} ${payload.stream}`,
      });

      toast.success(record ? "Class updated" : "Class created");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the class");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={record ? "Edit class" : "New class"}
      description="Streams let you split a year group into parallel classes."
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Class name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Grade 4" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Stream</span>
            <Input value={stream} onChange={(e) => setStream(e.target.value)} placeholder="Blue" />
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Class teacher</span>
          <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">Unassigned</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Fee per term</span>
          <Input
            type="number"
            min={0}
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            placeholder="0"
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={() => void save()}>
            Save class
          </Button>
        </div>
      </div>
    </Modal>
  );
}
