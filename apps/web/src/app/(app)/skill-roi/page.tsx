"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { SkillRoi } from "@/types/api";
import { Card, LoadingBlock, PageHeader } from "@/components/ui";

export default function SkillRoiPage() {
  const [rows, setRows] = useState<SkillRoi[] | null>(null);

  useEffect(() => {
    api.skillRoi().then((res) => setRows(res.ranked_skills));
  }, []);

  if (!rows) return <LoadingBlock label="Computing skill ROI..." />;

  return (
    <div>
      <PageHeader title="Skill ROI" subtitle="Which skill is worth learning first, based on demand, difficulty, and your current gap." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((r, i) => (
          <Card key={r.skill}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">#{i + 1} {r.skill}</h3>
              <span className="text-lg font-semibold text-brand-700">{r.roi.toFixed(2)}</span>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><span>Demand</span><span>{Math.round(r.demand * 100)}%</span></div>
              <div className="flex justify-between"><span>Difficulty</span><span>{Math.round(r.difficulty * 100)}%</span></div>
              <div className="flex justify-between"><span>Jobs affected</span><span>{r.jobs_affected}</span></div>
              <div className="flex justify-between"><span>Your current gap</span><span>{r.current_gap.toFixed(1)}/5</span></div>
            </div>
            <Link href="/learning-path" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">
              Build a learning path →
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
