import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Input, Select, TextArea, statusTone } from "@/components/UI";
import { useAuth } from "@/context/AuthProvider";
import { useSchool } from "@/context/SchoolProvider";
import { prettyDate } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { LeaveRequest } from "@/lib/types";

export const Route = createFileRoute("/staff/leave")({
  head: () => ({
    meta: [
      { title: "Apply for leave — KidRight Academy" },
      { name: "description", content: "Staff apply for leave and follow the approval status." },
      { property: "og:title", content: "Apply for leave — KidRight Academy" },
      { property: "og:description", content: "Staff apply for leave and follow the approval status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StaffLeave,
});

const TYPES: LeaveRequest["type"][] = ["Annual", "Sick", "Compassionate", "Study"];

function daysBetween(from: string, to: string) {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 0;
  return Math.round((b - a) / 86400000) + 1;
}

function StaffLeave() {
  const { user } = useAuth();
  const { db, refresh } = useSchool();
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState<LeaveRequest["type"]>("Annual");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const staffId = user?.staffId ?? "";
  const mine = useMemo(() => db.leave.filter((l) => l.staffId === staffId), [db.leave, staffId]);
  const usedAnnual = mine
    .filter((l) => l.type === "Annual" && l.status === "Approved")
    .reduce((n, l) => n + l.days, 0);
  const days = daysBetween(from, to);

  async function submit() {
    if (!staffId) {
      toast.error("Your account isn't linked to a staff record. Ask the registrar.");
      return;
    }
    if (days <= 0) {
      toast.error("The end date must be on or after the start date");
      return;
    }
    if (!reason.trim()) {
      toast.error("Give a short reason");
      return;
    }
    setSaving(true);
    try {
      const sb = getSupabase();
      const { error } = await sb.from("leave_requests").insert({
        staff_id: staffId,
        type,
        date_from: from,
        date_to: to,
        days,
        reason: reason.trim(),
      });
      if (error) throw new Error(error.message);
      toast.success("Leave request sent to the administrator");
      setReason("");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send the request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell portal="staff" title="Leave" subtitle="Apply for leave. The administrator approves or declines.">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold">New request</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Annual leave used: {usedAnnual} of {db.settings.annualLeaveDays} days
          </p>
          <div className="mt-4 space-y-3">
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Leave type</span>
              <Select value={type} onChange={(e) => setType(e.target.value as LeaveRequest["type"])}>
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">From</span>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">To</span>
                <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
              </label>
            </div>
            <p className="text-sm">Days requested: <strong>{days}</strong></p>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Reason</span>
              <TextArea value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>
            <Button loading={saving} onClick={() => void submit()}>
              Send request
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <h2 className="border-b border-border px-5 py-3 font-display font-bold">My requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3">Days</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((l) => (
                  <tr key={l.id} className="border-b border-border/70">
                    <td className="px-5 py-3">{l.type}</td>
                    <td className="px-5 py-3">{prettyDate(l.from)} – {prettyDate(l.to)}</td>
                    <td className="px-5 py-3">{l.days}</td>
                    <td className="px-5 py-3"><Badge tone={statusTone(l.status)}>{l.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mine.length === 0 && <p className="p-10 text-center text-muted-foreground">No requests yet.</p>}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
