import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Select, statusTone } from "@/components/UI";
import { useSchool } from "@/context/SchoolProvider";
import { prettyDate } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { LeaveRequest } from "@/lib/types";

export const Route = createFileRoute("/admin/leave")({
  head: () => ({
    meta: [
      { title: "Leave approvals — KidRight Academy" },
      { name: "description", content: "Approve or decline staff leave requests." },
      { property: "og:title", content: "Leave approvals — KidRight Academy" },
      { property: "og:description", content: "Approve or decline staff leave requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LeaveApprovals,
});

function LeaveApprovals() {
  const { db, refresh, can } = useSchool();
  const [filter, setFilter] = useState<"All" | LeaveRequest["status"]>("Pending");
  const [busy, setBusy] = useState<string | null>(null);

  const rows = useMemo(
    () => db.leave.filter((l) => filter === "All" || l.status === filter),
    [db.leave, filter],
  );

  async function decide(l: LeaveRequest, status: "Approved" | "Rejected") {
    setBusy(l.id);
    try {
      const sb = getSupabase();
      const { error } = await sb.from("leave_requests").update({ status }).eq("id", l.id);
      if (error) throw new Error(error.message);
      const name = db.staff.find((s) => s.id === l.staffId)?.fullName ?? "Staff";
      await sb.from("activity_log").insert({
        actor: "Administrator",
        message: `${status} ${l.type.toLowerCase()} leave for ${name} (${l.days} days)`,
      });
      toast.success(`Leave ${status.toLowerCase()}`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the request");
    } finally {
      setBusy(null);
    }
  }

  const canDecide = can("leave.approve");

  return (
    <AppShell portal="admin" title="Leave approvals" subtitle="Review staff leave requests." requires="staff.view">
      <Card className="p-4">
        <label className="space-y-1 text-sm sm:w-56 block">
          <span className="font-medium">Show</span>
          <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            {["Pending", "Approved", "Rejected", "All"].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </Select>
        </label>
      </Card>
      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <th className="px-5 py-3">Staff</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Dates</th>
                <th className="px-5 py-3">Days</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Decision</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-b border-border/70">
                  <td className="px-5 py-3 font-medium">
                    {db.staff.find((s) => s.id === l.staffId)?.fullName ?? "Staff"}
                  </td>
                  <td className="px-5 py-3">{l.type}</td>
                  <td className="px-5 py-3">{prettyDate(l.from)} – {prettyDate(l.to)}</td>
                  <td className="px-5 py-3">{l.days}</td>
                  <td className="px-5 py-3 max-w-xs text-muted-foreground">{l.reason}</td>
                  <td className="px-5 py-3"><Badge tone={statusTone(l.status)}>{l.status}</Badge></td>
                  <td className="px-5 py-3">
                    {l.status === "Pending" && canDecide ? (
                      <div className="flex gap-1.5">
                        <Button size="sm" loading={busy === l.id} onClick={() => void decide(l, "Approved")}>
                          <Check className="size-4" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" disabled={busy === l.id} onClick={() => void decide(l, "Rejected")}>
                          <X className="size-4" /> Decline
                        </Button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-10 text-center text-muted-foreground">No requests here.</p>}
        </div>
      </Card>
    </AppShell>
  );
}
