"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CareerPrediction } from "@/types/api";
import { Card, LoadingBlock, PageHeader, Pill } from "@/components/ui";

export default function CareerPredictionsPage() {
  const [predictions, setPredictions] = useState<CareerPrediction[] | null>(null);

  useEffect(() => {
    api.careerPredict().then((res) => setPredictions(res.predictions));
  }, []);

  if (!predictions) return <LoadingBlock label="Running career prediction model..." />;

  return (
    <div>
      <PageHeader title="Career Predictions" subtitle="ML-predicted next roles based on your skills, experience, and market demand." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {predictions.map((p) => (
          <Card key={p.role}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{p.role}</h3>
              <Pill tone={p.transition_effort === "Low" ? "green" : p.transition_effort === "Medium" ? "amber" : "red"}>
                {p.transition_effort} effort
              </Pill>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
              <div className="h-1.5 rounded-full bg-brand-600" style={{ width: `${p.readiness * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-500">{Math.round(p.readiness * 100)}% readiness (ML prediction)</p>
            {p.missing_skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.missing_skills.map((s) => <Pill key={s} tone="amber">{s}</Pill>)}
              </div>
            )}
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-400">Predictions are model estimates based on demo job-market data, not guarantees.</p>
    </div>
  );
}
