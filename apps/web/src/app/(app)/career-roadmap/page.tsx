"use client";

import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { RoadmapStage } from "@/types/api";
import { Card, LoadingBlock, PageHeader, Pill } from "@/components/ui";

export default function CareerRoadmapPage() {
  const [stages, setStages] = useState<RoadmapStage[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoadmap = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.careerRoadmap();
      setStages(res.stages);
    } catch (err: any) {
      setError(err?.message || "AI features are currently unavailable. Please configure the OpenRouter API key.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoadmap();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Career Roadmap"
          subtitle="A realistic progression from your current role toward target seniority, reasoned by OpenRouter AI and grounded in market data."
        />
        {stages && (
          <button
            onClick={loadRoadmap}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        )}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50/50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Career Roadmap Unavailable</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {loading && <LoadingBlock label="Building your personalized career roadmap with OpenRouter AI..." />}

      {stages && !loading && (
        <div className="relative space-y-5 border-l-2 border-slate-100 pl-8">
          {stages.map((s) => (
            <div key={s.stage} className="relative">
              <div className="absolute -left-[39px] top-2 h-4 w-4 rounded-full border-2 border-brand-600 bg-white" />
              <Card>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">{s.from_role} → {s.to_role}</h3>
                  <Pill tone={s.readiness > 0.7 ? "green" : s.readiness > 0.4 ? "amber" : "red"}>
                    {Math.round(s.readiness * 100)}% ready
                  </Pill>
                </div>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.explanation}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                  <span>Est. effort: {s.estimated_effort_months} months</span>
                  <span>·</span>
                  <span>Market demand: {Math.round(s.market_demand * 100)}%</span>
                </div>
                {s.missing_skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.missing_skills.map((m) => <Pill key={m} tone="amber">{m}</Pill>)}
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

