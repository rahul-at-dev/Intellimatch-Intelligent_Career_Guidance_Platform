"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import type { MatchResult } from "@/types/api";
import { Card, LoadingBlock, PageHeader, Pill, ScoreRing } from "@/components/ui";

export default function JobMatchPage() {
  const params = useParams<{ id: string }>();
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    // Call dedicated job match API
    api.jobMatch(params.id)
      .then(setMatch)
      .catch(() => {
        // Fallback: try run matching
        if (!params?.id) return;
        api.matchingRun(50, true).then((res) => {
          const found = res.results.find((r) => r.job_id === params.id);
          if (found) setMatch(found);
          else setNotFound(true);
        }).catch(() => setNotFound(true));
      });
  }, [params?.id]);

  if (notFound) return <p className="text-sm text-slate-500">No match data for this job.</p>;
  if (!match) return <LoadingBlock label="Calculating IntelliMatch score from your profile..." />;

  return (
    <div>
      <PageHeader
        title={`Your match: ${match.title}`}
        subtitle={`${match.company} · ${match.location}`}
        action={
          match.redirect_url ? (
            <a
              href={match.redirect_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              View on Adzuna <ExternalLink size={13} />
            </a>
          ) : undefined
        }
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center gap-2">
          <ScoreRing score={match.match_score} size={130} />
          <p className="text-sm font-semibold text-slate-700">IntelliMatch Score</p>
          <p className="text-xs text-slate-400 text-center">40% Skills · 20% Role · 15% Experience</p>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="mb-3 font-semibold text-slate-900">Why this match</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{match.explanation ?? "Strong technical alignment with your current skills."}</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Semantic Alignment</p>
              <p className="font-semibold text-slate-900">{(match.semantic_similarity * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Skill Coverage</p>
              <p className="font-semibold text-slate-900">{(match.skill_coverage * 100).toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold text-slate-900">Matched Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {match.matched_skills.length ? match.matched_skills.map((s) => <Pill key={s} tone="green">{s}</Pill>)
              : <p className="text-sm text-slate-400">None matched yet</p>}
          </div>
        </Card>
        <Card>
          <h3 className="mb-3 font-semibold text-slate-900">Missing Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {match.missing_skills.length ? match.missing_skills.map((s) => <Pill key={s} tone="amber">{s}</Pill>)
              : <p className="text-sm text-slate-400">No gaps — full coverage</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
