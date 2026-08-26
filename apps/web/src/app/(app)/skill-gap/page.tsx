"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { SkillGap } from "@/types/api";
import { Card, ImportancePill, LoadingBlock, PageHeader, Pill } from "@/components/ui";
import { Sparkles, TrendingUp } from "lucide-react";

const ROLES = [
  "Senior Backend Engineer",
  "Software Engineer",
  "ML Engineer",
  "Cloud Solutions Architect",
  "Engineering Manager",
];

export default function SkillGapPage() {
  const [role, setRole] = useState<string>(ROLES[0] ?? "Senior Backend Engineer");
  const [gaps, setGaps] = useState<SkillGap[] | null>(null);

  useEffect(() => {
    setGaps(null);
    api.skillGap(role).then((res) => setGaps(res.gaps));
  }, [role]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill Gap Analysis"
        subtitle="Compare your current profile skills against target role requirements with real market demand."
        action={
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400">Target Role:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        }
      />
      {!gaps ? (
        <LoadingBlock label="Analyzing skill gaps and calculating real market demand..." />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3.5 font-semibold">Skill</th>
                  <th className="px-6 py-3.5 font-semibold">Current Level</th>
                  <th className="px-6 py-3.5 font-semibold">Required</th>
                  <th className="px-6 py-3.5 font-semibold">Gap</th>
                  <th className="px-6 py-3.5 font-semibold">Priority</th>
                  <th className="px-6 py-3.5 font-semibold">Adzuna Market Demand</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {gaps.map((g) => (
                  <tr key={g.skill} className="transition hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 font-semibold text-slate-900">{g.skill}</td>
                    <td className="px-6 py-3.5 text-slate-600">
                      <div className="flex items-center gap-2">
                        <span>{g.current_level.toFixed(1)}/5</span>
                        <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full bg-brand-600"
                            style={{ width: `${(g.current_level / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{g.required_level.toFixed(1)}/5</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`font-semibold ${
                          g.gap > 2
                            ? "text-rose-600"
                            : g.gap > 0
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {g.gap > 0 ? `-${g.gap.toFixed(1)}` : "Met"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <ImportancePill importance={g.importance} />
                    </td>
                    <td className="px-6 py-3.5">
                      {g.market_demand > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
                          <TrendingUp size={12} className="text-emerald-500" />
                          {Math.round(g.market_demand * 100)}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Market benchmark</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-xs text-slate-500">
            <span>Market demand values sourced from live Adzuna employment intelligence.</span>
            <Pill tone="brand">Single Source of Truth</Pill>
          </div>
        </Card>
      )}
    </div>
  );
}

