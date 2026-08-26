"use client";
import { useState } from "react";
import { Card, PageHeader } from "@/components/ui";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and notification preferences." />
      <Card className="max-w-lg">
        <h3 className="mb-3 font-semibold text-slate-900">Preferences</h3>
        <div className="space-y-3 text-sm">
          <label className="flex items-center justify-between"><span>Email notifications</span><input type="checkbox" defaultChecked /></label>
          <label className="flex items-center justify-between"><span>Weekly market digest</span><input type="checkbox" defaultChecked /></label>
          <label className="flex items-center justify-between"><span>Remote roles only</span><input type="checkbox" /></label>
        </div>
        <button onClick={() => setSaved(true)} className="btn-primary mt-5">Save Changes</button>
        {saved && <p className="mt-2 text-sm text-emerald-600">Preferences saved.</p>}
      </Card>
    </div>
  );
}
