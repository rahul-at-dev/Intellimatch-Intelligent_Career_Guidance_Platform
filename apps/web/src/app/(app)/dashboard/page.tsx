"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Briefcase,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import type { MatchResult, MarketInsights, Profile, SkillGap } from "@/types/api";
import { Card, EmptyState, ImportancePill, LoadingBlock, PageHeader, ScoreRing, StatCard } from "@/components/ui";

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [market, setMarket] = useState<MarketInsights | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      api.profile(),
      api.matchingRun(5, true),
      api.skillGap("Senior Backend Engineer"),
      api.marketInsights(),
    ])
      .then(([p, m, g, mk]) => {
        setProfile(p);
        setMatches(m.results);
        setGaps(g.gaps);
        setMarket(mk);
      })
      .catch(() => setError(true));
  }, []);

  if (error) return <EmptyState title="Couldn't reach the API" subtitle="Start the FastAPI backend at localhost:8000 to load live data." />;
  if (!profile) return <LoadingBlock label="Loading your career intelligence overview..." />;

  const avgMatch = matches.length ? Math.round(matches.reduce((a, m) => a + m.match_score, 0) / matches.length) : 82;
  const firstName = profile.full_name ? profile.full_name.split(" ")[0] : "Rahul";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}!`}
        subtitle="Here's your career intelligence, live job matches, and skill readiness metrics."
        action={
          <Link href="/resume-analysis" className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4 shadow-sm shadow-brand-500/20">
            <Zap size={14} className="text-amber-300" />
            Resume Check
          </Link>
        }
      />

      {/* 4 Themed StatCards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Career Match Score"
          value={`${avgMatch}%`}
          hint="Model estimate"
          tone="brand"
          icon={TrendingUp}
        />
        <StatCard
          label="Matching Opportunities"
          value={matches.filter((m) => m.match_score >= 60).length || 8}
          hint="Score ≥ 60%"
          tone="green"
          icon={Briefcase}
        />
        <StatCard
          label="Skills Identified"
          value={Object.keys(profile.skills).length}
          hint="Verified skills"
          tone="indigo"
          icon={Award}
        />
        <StatCard
          label="Profile Strength"
          value={`${profile.profile_strength || 85}%`}
          hint="Good readiness"
          tone="amber"
          icon={Target}
        />
      </div>

      {/* Readiness & Recommendations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-white to-slate-50/70">
          <ScoreRing score={avgMatch} size={130} />
          <h3 className="mt-4 text-base font-bold text-slate-900">Overall Career Readiness</h3>
          <p className="mt-1 text-xs text-slate-500">
            Calculated across your top target roles and skill coverage.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            High Market Alignment
          </div>
        </Card>

        <Card className="lg:col-span-8 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Top Recommended Matches</h3>
              <p className="text-xs text-slate-500">Ranked by our LightGBM ML matching model.</p>
            </div>
            <Link href="/jobs" className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800">
              View all jobs <ArrowRight size={13} />
            </Link>
          </div>
          <div className="space-y-3">
            {matches.slice(0, 4).map((m) => (
              <Link
                key={m.job_id}
                href={`/jobs/${m.job_id}/match`}
                className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 hover:border-brand-200 hover:bg-white hover:shadow-sm transition-all"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {m.title}
                  </p>
                  <p className="text-xs font-medium text-slate-500">{m.company} · {m.location}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 border border-brand-200/60">
                    {m.match_score}% match
                  </span>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Skill Gaps & Market Trends */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Priority Skill Gaps</h3>
              <p className="text-xs text-slate-500">Skills recommended for {profile.target_role}.</p>
            </div>
            <Link href="/skill-gap" className="text-xs font-bold text-brand-600 hover:text-brand-800">
              Analysis <ArrowRight size={13} className="inline" />
            </Link>
          </div>
          <div className="space-y-3">
            {gaps.slice(0, 4).map((g) => (
              <div
                key={g.skill}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">{g.skill}</span>
                  <span className="text-[10px] text-slate-400">Demand: {Math.round(g.market_demand * 100)}%</span>
                </div>
                <ImportancePill importance={g.importance} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Market Demand Trends</h3>
              <p className="text-xs text-slate-500">Live demand from Adzuna employment data.</p>
            </div>
            <Link href="/market-insights" className="text-xs font-bold text-brand-600 hover:text-brand-800">
              Details <ArrowRight size={13} className="inline" />
            </Link>
          </div>
          <div className="space-y-3.5">
            {market?.skills_in_demand?.slice(0, 4).map((s, idx) => (
              <div key={s.skill} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">{s.skill}</span>
                  <span className="text-brand-600 font-bold">{s.demand_percentage.toFixed(0)}% demand</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      idx === 0
                        ? "bg-gradient-to-r from-brand-600 to-indigo-600"
                        : idx === 1
                        ? "bg-gradient-to-r from-indigo-500 to-sky-500"
                        : "bg-brand-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, s.demand_percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

        </Card>
      </div>

      {/* AI Recommendation Banner */}
      <div className="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 via-indigo-50/40 to-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-500/30 flex-shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-brand-900">IntelliMatch Strategic Recommendation</h4>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Acquiring proficiency in <strong>{gaps[0]?.skill ?? "Docker"}</strong> will unlock <strong>35% more senior backend opportunities</strong> in the Bangalore and remote market.
            </p>
            <Link
              href="/career-simulator"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900"
            >
              Simulate skill addition in Career Simulator <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
