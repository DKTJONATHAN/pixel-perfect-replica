import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Plus, Printer } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Input, Modal, Select, TextArea } from "@/components/UI";
import { useSchool } from "@/context/SchoolProvider";
import { className, downloadCsv, fullName, money, prettyDate } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import { TERMS, type Payment } from "@/lib/types";

export const Route = createFileRoute("/admin/fees")({
  head: () => ({
    meta: [
      { title: "Fees & receipts — KidRight Academy" },
      {
        name: "description",
        content: "Record school fee payments, issue receipts and track term arrears.",
      },
      { property: "og:title", content: "Fees & receipts — KidRight Academy" },
      {
        property: "og:description",
        content: "Record school fee payments, issue receipts and track term arrears.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FeesPage,
});

const METHODS: Payment["method"][] = ["Mobile Money", "Bank", "Cash"];

function newReceiptNo() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 90000 + 10000);
  return `RCT-${year}-${rand}`;
}

function FeesPage() {
  const { db, refresh } = useSchool();
  const currency = db.settings.currency;
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState(db.settings.currentTerm || TERMS[0]!);

  const outstanding = useMemo(() => {
    return db.students
      .filter((s) => s.status === "Active" && !s.archived)
      .map((s) => {
        const cls = db.classes.find((c) => c.id === s.classId);
        const billed = cls?.feePerTerm ?? 0;
        const paid = db.payments
          .filter((p) => p.studentId === s.id && p.term === term)
          .reduce((sum, p) => sum + p.amount, 0);
        return { student: s, billed, paid, balance: Math.max(billed - paid, 0) };
      })
      .sort((a, b) => b.balance - a.balance);
  }, [db.students, db.classes, db.payments, term]);

  const totals = useMemo(
    () => ({
      billed: outstanding.reduce((n, r) => n + r.billed, 0),
      paid: outstanding.reduce((n, r) => n + r.paid, 0),
      balance: outstanding.reduce((n, r) => n + r.balance, 0),
    }),
    [outstanding],
  );

  function exportArrears() {
    downloadCsv(
      `arrears-${term.replace(/\s/g, "-").toLowerCase()}.csv`,
      ["Admission", "Learner", "Class", "Billed", "Paid", "Balance"],
      outstanding.map((r) => [
        r.student.admissionNo,
        fullName(r.student),
        className(db, r.student.classId),
        r.billed,
        r.paid,
        r.balance,
      ]),
    );
  }

  return (
    <AppShell
      portal="admin"
      title="Fees & receipts"
      subtitle="Record payments and follow up on arrears."
      requires="fees.manage"
      actions={
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Record payment
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs text-muted-foreground uppercase">Billed · {term}</p>
          <p className="mt-1 font-display text-2xl font-medium">{money(totals.billed, currency)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground uppercase">Collected</p>
          <p className="mt-1 font-display text-2xl font-medium text-success">
            {money(totals.paid, currency)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground uppercase">Outstanding</p>
          <p className="mt-1 font-display text-2xl font-medium text-destructive">
            {money(totals.balance, currency)}
          </p>
        </Card>
      </div>

      <Card className="mt-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="space-y-1 text-sm sm:w-56">
            <span className="font-medium">Term</span>
            <Select value={term} onChange={(e) => setTerm(e.target.value)}>
              {TERMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </label>
          <Button variant="outline" onClick={exportArrears}>
            <Download className="size-4" /> Export arrears
          </Button>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        <h2 className="border-b border-border px-5 py-3 font-display font-medium">
          Fee balances · {term}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <th className="px-5 py-3">Learner</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Billed</th>
                <th className="px-5 py-3">Paid</th>
                <th className="px-5 py-3">Balance</th>
              </tr>
            </thead>
            <tbody>
              {outstanding.map((r) => (
                <tr key={r.student.id} className="border-b border-border/70">
                  <td className="px-5 py-3 font-medium">{fullName(r.student)}</td>
                  <td className="px-5 py-3">{className(db, r.student.classId)}</td>
                  <td className="px-5 py-3">{money(r.billed, currency)}</td>
                  <td className="px-5 py-3">{money(r.paid, currency)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={r.balance === 0 ? "success" : "danger"}>
                      {r.balance === 0 ? "Cleared" : money(r.balance, currency)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {outstanding.length === 0 && (
            <p className="p-10 text-center text-muted-foreground">No active learners yet.</p>
          )}
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        <h2 className="border-b border-border px-5 py-3 font-display font-medium">Recent receipts</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <th className="px-5 py-3">Receipt</th>
                <th className="px-5 py-3">Learner</th>
                <th className="px-5 py-3">Term</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 no-print">Print</th>
              </tr>
            </thead>
            <tbody>
              {db.payments.map((p) => {
                const st = db.students.find((s) => s.id === p.studentId);
                return (
                  <tr key={p.id} className="border-b border-border/70">
                    <td className="px-5 py-3 font-medium">{p.receiptNo}</td>
                    <td className="px-5 py-3">{st ? fullName(st) : "—"}</td>
                    <td className="px-5 py-3">{p.term}</td>
                    <td className="px-5 py-3">{money(p.amount, currency)}</td>
                    <td className="px-5 py-3">{p.method}</td>
                    <td className="px-5 py-3">{prettyDate(p.date)}</td>
                    <td className="px-5 py-3 no-print">
                      <Button variant="ghost" size="sm" onClick={() => window.print()}>
                        <Printer className="size-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {db.payments.length === 0 && (
            <p className="p-10 text-center text-muted-foreground">
              No payments recorded yet. Use “Record payment” to issue the first receipt.
            </p>
          )}
        </div>
      </Card>

      <PaymentModal
        open={open}
        onClose={() => setOpen(false)}
        defaultTerm={term}
        onSaved={() => void refresh()}
      />
    </AppShell>
  );
}

function PaymentModal({
  open,
  onClose,
  defaultTerm,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  defaultTerm: string;
  onSaved: () => void;
}) {
  const { db } = useSchool();
  const [query, setQuery] = useState("");
  const [studentId, setStudentId] = useState("");
  const [term, setTerm] = useState(defaultTerm);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Payment["method"]>("Mobile Money");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = db.students.filter((s) => !s.archived);
    if (!q) return pool.slice(0, 25);
    return pool
      .filter(
        (s) =>
          fullName(s).toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q),
      )
      .slice(0, 25);
  }, [db.students, query]);

  async function save() {
    const value = Number(amount);
    if (!studentId) {
      toast.error("Choose a learner");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const sb = getSupabase();
      const receiptNo = newReceiptNo();
      const { error } = await sb.from("payments").insert({
        receipt_no: receiptNo,
        student_id: studentId,
        term,
        amount: value,
        date,
        method,
        note: note.trim() || null,
      });
      if (error) throw new Error(error.message);

      const st = db.students.find((s) => s.id === studentId);
      await sb.from("activity_log").insert({
        actor: "Bursar",
        message: `Receipt ${receiptNo} recorded for ${st ? fullName(st) : "a learner"} (${term})`,
      });

      toast.success(`Receipt ${receiptNo} issued`);
      setAmount("");
      setNote("");
      setStudentId("");
      setQuery("");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record payment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record a fee payment"
      description="A receipt number is generated automatically."
    >
      <div className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Find learner</span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or admission number"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Learner</span>
          <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">Select a learner…</option>
            {matches.map((s) => (
              <option key={s.id} value={s.id}>
                {fullName(s)} · {s.admissionNo} · {className(db, s.classId)}
              </option>
            ))}
          </Select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
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
            <span className="font-medium">Amount ({db.settings.currency})</span>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Method</span>
            <Select
              value={method}
              onChange={(e) => setMethod(e.target.value as Payment["method"])}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Date</span>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Note (optional)</span>
          <TextArea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="M-Pesa code, bank slip reference…"
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={() => void save()}>
            Save & issue receipt
          </Button>
        </div>
      </div>
    </Modal>
  );
}
