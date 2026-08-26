"use client";
import { Bell, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";

const NOTIFS = [
  { icon: TrendingUp, text: "Your match score for Backend Engineer roles increased to 74%.", time: "2h ago" },
  { icon: Users, text: "A recruiter at Nimbus Cloud Systems viewed your profile.", time: "1d ago" },
  { icon: CheckCircle2, text: "Your resume analysis is complete — 12 skills identified.", time: "2d ago" },
];

export default function NotificationsPage() {
  return (
    <div>
      <PageHeader title="Notifications" subtitle="Updates about your matches, applications, and profile." />
      <Card className="p-0">
        <div className="divide-y divide-slate-50">
          {NOTIFS.map((n, i) => (
            <div key={i} className="flex items-start gap-3 p-4">
              <div className="rounded-full bg-brand-50 p-2 text-brand-600"><n.icon size={16} /></div>
              <div className="flex-1">
                <p className="text-sm text-slate-700">{n.text}</p>
                <p className="text-xs text-slate-400">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
