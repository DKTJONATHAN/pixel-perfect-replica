import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlus } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Field, Select, TextArea } from "@/components/UI";
import { useAuth } from "@/context/AuthProvider";
import { useSchool } from "@/context/SchoolProvider";
import { prettyDate } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import { logActivity } from "@/services/school";

export const Route = createFileRoute("/staff/leave")({ component: StaffLeave });

const LEAVE_TYPES = ["Annual", "Sick", "Compassionate", "Study"] as const;

function daysBetween(from: string, to: string) {
  if (!from || !to) return 0;
  const a = new Date(from);
  const b = new Date(to);
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
  return Math.max(0, diff);
}

function StaffLeave() {
  const { user } = useAuth();
  const { db, refresh } = useSchool();
  const me = db.staff.find((s) => s.id === user?.staffId);

  const [type, setType] = useState<(typeof LEAVE_TYPES)[number]>("Annual");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const myLeave = me ? db.leave.filter((l) => l.staffId === me.id) : [];
  const days = daysBetween(from, to);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!me) {
      setError("Your account is not linked to a staff record yet.");
      return;
    }
    if (!from || !to || days <= 0) {
      setError("Pick a valid date range.");
      return;
    }
    if (!reason.trim()) {
      setError("Please give a reason for the leave request.");
      return;
    }

    setSubmitting(true);
    try {
      const sb = getSupabase();
      const { error: insertError } = await sb.from("leave_requests").insert({
        staff_id: me.id,
        type,
        date_from: from,
        date_to: to,
        days,
        reason: reason.trim(),
      });
      if (insertError) throw insertError;

      await logActivity(me.fullName, `Applied for ${type} leave (${days} day${days === 1 ? "" : "s"})`);
      setFrom("");
      setTo("");
      setReason("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your leave request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell portal="staff" title="Leave" subtitle="Apply for leave and track your requests">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg font-medium">Apply for leave</h2>
          <form className="mt-4 space-y-4" onSubmit={submit}>
            <Field label="Leave type">
              {(id) => (
                <Select id={id} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                  {LEAVE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From">
                {(id) => (
                  <input
                    id={id}
                    type="date"
                    required
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                  />
                )}
              </Field>
              <Field label="To">
                {(id) => (
                  <input
                    id={id}
                    type="date"
                    required
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                  />
                )}
              </Field>
            </div>
            {days > 0 && (
              <p className="text-sm text-muted-foreground">
                {days} day{days === 1 ? "" : "s"} requested.
              </p>
            )}
            <Field label="Reason">
              {(id) => (
                <TextArea
                  id={id}
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Briefly explain the reason for this leave"
                />
              )}
            </Field>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" loading={submitting}>
              <CalendarPlus className="size-4" /> Submit request
            </Button>
          </form>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-medium">My requests</h2>
          </div>
          <div className="divide-y divide-border">
            {myLeave.map((l) => (
              <div key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {l.type} · {l.days} day{l.days === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {prettyDate(l.from)} – {prettyDate(l.to)}
                  </p>
                </div>
                <Badge
                  tone={
                    l.status === "Approved" ? "success" : l.status === "Rejected" ? "danger" : "neutral"
                  }
                >
                  {l.status}
                </Badge>
              </div>
            ))}
            {myLeave.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No leave requests yet.
              </p>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
