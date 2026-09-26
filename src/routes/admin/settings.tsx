import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Input, Select, TextArea } from "@/components/UI";
import { useSchool } from "@/context/SchoolProvider";
import { getSupabase } from "@/lib/supabase";
import { TERMS } from "@/lib/types";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Academy settings — KidRight Academy" },
      {
        name: "description",
        content: "Update the academic year, current term, contact details and school profile.",
      },
      { property: "og:title", content: "Academy settings — KidRight Academy" },
      {
        property: "og:description",
        content: "Update the academic year, current term, contact details and school profile.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { db, refresh } = useSchool();
  const s = db.settings;
  const [form, setForm] = useState({ ...s });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const sb = getSupabase();
      const { error } = await sb
        .from("school_settings")
        .update({
          school_name: form.schoolName,
          motto: form.motto,
          address: form.address,
          phone: form.phone,
          email: form.email,
          academic_year: form.academicYear,
          current_term: form.currentTerm,
          currency: form.currency,
          annual_leave_days: Number(form.annualLeaveDays) || 0,
          about: form.about,
          vision: form.vision,
          mission: form.mission,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      if (error) throw new Error(error.message);

      await sb.from("activity_log").insert({
        actor: "Administrator",
        message: `Academy settings updated (${form.currentTerm}, ${form.academicYear})`,
      });

      toast.success("Settings saved");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      portal="admin"
      title="Academy settings"
      subtitle="These details appear across the portals, receipts and report cards."
      requires="settings.manage"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-medium">Academic period</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Academic year</span>
              <Input
                value={form.academicYear}
                onChange={(e) => set("academicYear", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Current term</span>
              <Select
                value={form.currentTerm}
                onChange={(e) => set("currentTerm", e.target.value)}
              >
                {TERMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Currency</span>
              <Input value={form.currency} onChange={(e) => set("currency", e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Annual leave days</span>
              <Input
                type="number"
                min={0}
                value={form.annualLeaveDays}
                onChange={(e) => set("annualLeaveDays", Number(e.target.value))}
              />
            </label>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-medium">Contact details</h2>
          <div className="mt-4 space-y-3">
            <label className="block space-y-1 text-sm">
              <span className="font-medium">School name</span>
              <Input value={form.schoolName} onChange={(e) => set("schoolName", e.target.value)} />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Motto</span>
              <Input value={form.motto} onChange={(e) => set("motto", e.target.value)} />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Address</span>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Phone</span>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Email</span>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </label>
            </div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-medium">School profile</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span className="font-medium">About</span>
              <TextArea value={form.about} onChange={(e) => set("about", e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Vision</span>
              <TextArea value={form.vision} onChange={(e) => set("vision", e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Mission</span>
              <TextArea value={form.mission} onChange={(e) => set("mission", e.target.value)} />
            </label>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={() => setForm({ ...s })}>
          Reset
        </Button>
        <Button loading={saving} onClick={() => void save()}>
          Save settings
        </Button>
      </div>
    </AppShell>
  );
}
