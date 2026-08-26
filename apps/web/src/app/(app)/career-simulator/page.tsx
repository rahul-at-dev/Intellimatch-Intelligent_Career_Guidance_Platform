"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { SimulationResult } from "@/types/api";
import { Card, LoadingBlock, PageHeader, Pill } from "@/components/ui";

const AVAILABLE_SKILLS = ["AWS", "Docker", "Kubernetes", "Machine Learning", "System Design", "React", "TypeScript", "NLP"];

export default function CareerSimulatorPage() {
  const [selected, setSelected] = useState<string[]>(["AWS"]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  function toggle(skill: string) {
    setSelected((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  }

  async function runSimulation() {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const res = await api.careerSimulate(selected);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Career Simulator" subtitle="Model how learning new skills could change your opportunities." />

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-slate-900">Choose skills to simulate</h3>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_SKILLS.map((s) => (
            <button
              key={s}
              onClick={() => toggle(s)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                selected.includes(s) ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:border-brand-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={runSimulation} disabled={loading || selected.length === 0} className="btn-primary mt-4">
          {loading ? "Simulating..." : `Simulate +${selected.length} skill(s)`}
        </button>
      </Card>

      {loading && <LoadingBlock label="Recomputing matches with projected skills..." />}

      {result && !loading && (
        <div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Card>
              <p className="text-sm text-slate-500">Before</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900">{result.baseline.avg_match_score}%</p>
              <p className="text-xs text-slate-400">{result.baseline.opportunities} strong matches</p>
            </Card>
            <Card className="border-brand-200 bg-brand-50/40">
              <p className="text-sm text-brand-700">After</p>
              <p className="mt-1 text-3xl font-semibold text-brand-900">{result.projected.avg_match_score}%</p>
              <p className="text-xs text-brand-600">{result.projected.opportunities} strong matches (+{result.additional_opportunities})</p>
            </Card>
          </div>
          <Card className="mt-5">
            <h3 className="mb-2 font-semibold text-slate-900">Career Paths Unlocked</h3>
            <div className="flex flex-wrap gap-1.5">
              {result.career_paths_unlocked.length ? result.career_paths_unlocked.map((p) => <Pill key={p} tone="green">{p}</Pill>)
                : <p className="text-sm text-slate-400">No new roles unlocked at the current match threshold.</p>}
            </div>
            <p className="mt-4 text-xs text-slate-400">Estimated learning effort: {result.estimated_learning_effort_hours} hours. {result.disclaimer}</p>
          </Card>
        </div>
      )}
    </div>
  );
}
