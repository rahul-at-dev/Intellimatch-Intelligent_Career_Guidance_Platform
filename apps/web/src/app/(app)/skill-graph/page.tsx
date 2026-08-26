"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { SkillGraph } from "@/types/api";
import { Card, LoadingBlock, PageHeader, Pill } from "@/components/ui";

export default function SkillGraphPage() {
  const [graph, setGraph] = useState<SkillGraph | null>(null);

  useEffect(() => {
    api.skillGraph().then(setGraph);
  }, []);

  if (!graph) return <LoadingBlock label="Loading skill graph..." />;

  const width = 760, height = 460;
  const nodes = graph.nodes.map((n, i) => {
    const angle = (i / graph.nodes.length) * Math.PI * 2;
    return { id: n.id, x: width / 2 + Math.cos(angle) * (width * 0.35), y: height / 2 + Math.sin(angle) * (height * 0.35) };
  });
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div>
      <PageHeader title="Skill Knowledge Graph" subtitle="Relationships between your skills and adjacent/prerequisite skills." />
      <Card>
        {graph.nodes.length === 0 ? (
          <p className="text-sm text-slate-400">No graph relationships found for your current skills.</p>
        ) : (
          <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
            {graph.edges.map((e, i) => {
              const s = nodeMap[e.source], t = nodeMap[e.target];
              if (!s || !t) return null;
              return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#e2e8f0" strokeWidth={1.5} />;
            })}
            {nodes.map((n) => (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={28} fill="#f5f6ff" stroke="#7c5cff" strokeWidth={1.5} />
                <text x={n.x} y={n.y} textAnchor="middle" dy="0.35em" className="fill-slate-700 text-[9px] font-medium">
                  {n.id.length > 10 ? n.id.slice(0, 9) + "…" : n.id}
                </text>
              </g>
            ))}
          </svg>
        )}
      </Card>
      <Card className="mt-5">
        <h3 className="mb-2 font-semibold text-slate-900">Relationships</h3>
        <div className="space-y-1.5">
          {graph.edges.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">{e.source}</span>
              <Pill>{e.relation}</Pill>
              <span className="font-medium text-slate-900">{e.target}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
