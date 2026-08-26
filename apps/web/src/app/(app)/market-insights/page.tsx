"use client";

import { useCallback, useEffect, useState } from "react";


import { api } from "@/lib/api";
import type { MarketInsights } from "@/types/api";
import { Card, LoadingBlock, PageHeader, Pill, ScoreRing, StatCard } from "@/components/ui";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  Building2,
  MapPin,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Globe,
  Info,
  ArrowRight,
  Code2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const TARGET_ROLES = [
  "Software Engineer",
  "Senior Backend Engineer",
  "Full Stack Developer",
  "Frontend Developer",
  "DevOps Engineer",
  "Data Engineer",
  "Machine Learning Engineer",
  "Cloud Solutions Architect",
  "QA Engineer",
];

const COUNTRIES = [
  { code: "in", label: "India", currency: "₹" },
  { code: "gb", label: "United Kingdom", currency: "£" },
  { code: "us", label: "United States", currency: "$" },
];

const QUICK_LOCATIONS: Record<string, string[]> = {
  in: ["All India", "Bangalore", "Hyderabad", "Pune", "Mumbai", "Delhi NCR", "Chennai"],
  gb: ["All UK", "London", "Manchester", "Birmingham", "Edinburgh", "Cambridge"],
  us: ["All US", "San Francisco", "New York", "Seattle", "Austin", "Boston", "Remote"],
};

function formatCurrency(val: number | null | undefined, country: string): string {
  if (val === null || val === undefined || isNaN(val)) return "N/A";
  if (country === "in") {
    const lakhs = val / 100000;
    if (lakhs >= 100) {
      return `₹${(lakhs / 100).toFixed(2)} Cr`;
    }
    return `₹${lakhs.toFixed(1)} LPA`;
  } else if (country === "gb") {
    return `£${Math.round(val / 1000)}k/yr`;
  } else {
    return `$${Math.round(val / 1000)}k/yr`;
  }
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "Just now";
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return "Recently";
  }
}

export default function MarketInsightsPage() {
  const [role, setRole] = useState<string>("Software Engineer");
  const [country, setCountry] = useState<string>("in");
  const [location, setLocation] = useState<string>("All India");
  const [data, setData] = useState<MarketInsights | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const locParam = location.startsWith("All") ? "" : location;

    try {
      const res = await api.marketInsights({
        role,
        location: locParam,
        country,
        force_refresh: force,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Unable to fetch live market insights. Please check connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [role, country, location]);

  useEffect(() => {
    fetchInsights(false);
  }, [fetchInsights]);

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const defaults = QUICK_LOCATIONS[newCountry] || ["All"];
    setLocation(defaults[0] || "All");
  };


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Market Insights"
        subtitle="Real-time employment demand, live salary benchmarks, and skill trends powered by Adzuna."
        action={
          <button
            onClick={() => fetchInsights(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            title="Refresh latest live Adzuna data"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-brand-600" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        }
      />

      {/* Filter Control Bar */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:items-center">
            {/* Target Role Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Target Role
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full min-w-[200px] rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm font-medium text-slate-800 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  {TARGET_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Country Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full min-w-[140px] rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm font-medium text-slate-800 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label} ({c.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Location Pills */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Location Filter
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {(QUICK_LOCATIONS[country] || ["All"]).map((loc) => {
                const isActive = location === loc;
                return (
                  <button
                    key={loc}
                    onClick={() => setLocation(loc)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      isActive
                        ? "bg-brand-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Data Source & Timestamp Banner */}
        <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Source: <strong className="font-semibold text-slate-700">Adzuna Employment API</strong>
            </span>
            {data?.sample_size ? (
              <span className="text-slate-400">
                · Skill frequency derived from {data.sample_size} active job descriptions
              </span>
            ) : null}
          </div>
          <div className="text-slate-400">
            {data?.last_updated ? `Updated: ${timeAgo(data.last_updated)}` : ""}
            {data?.is_cached ? " (cached)" : ""}
          </div>
        </div>
      </Card>

      {/* Error state */}
      {error && (
        <Card className="border-rose-200 bg-rose-50/50 p-4 text-sm text-rose-700">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} />
            Failed to load market data
          </div>
          <p className="mt-1 text-xs text-rose-600">{error}</p>
        </Card>
      )}

      {/* Loading state */}
      {loading && !data ? (
        <LoadingBlock label="Fetching live employment data and computing skill intelligence from Adzuna..." />
      ) : data ? (
        <>
          {/* Market Overview Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Active Vacancies"
              value={data.job_count > 0 ? data.job_count.toLocaleString() : "Data unavailable"}
              hint={data.job_count > 0 ? `Live in ${data.location}` : "Adzuna active count"}
              icon={Briefcase}
              tone="brand"
            />
            <StatCard
              label="Average Salary"
              value={
                data.average_salary
                  ? formatCurrency(data.average_salary, data.country)
                  : "Data unavailable"
              }
              hint={
                data.average_salary
                  ? `Annual mean (${data.currency})`
                  : "Not reported in market"
              }
              icon={TrendingUp}
              tone="indigo"
            />
            <StatCard
              label="Market Demand Trend"
              value={
                data.salary_growth_percentage !== null
                  ? `${data.salary_growth_percentage > 0 ? "+" : ""}${data.salary_growth_percentage}%`
                  : data.job_count > 100
                  ? "High Demand"
                  : "Moderate"
              }
              hint={
                data.salary_growth_percentage !== null
                  ? "12-month salary growth"
                  : "Based on active listings"
              }
              icon={data.trend_direction === "down" ? TrendingDown : TrendingUp}
              tone={data.trend_direction === "down" ? "amber" : "green"}
            />
            <StatCard
              label="Sample Analyzed"
              value={data.sample_size > 0 ? `${data.sample_size} Jobs` : "0 Listings"}
              hint="Deep skill parsing"
              icon={Code2}
              tone="sky"
            />
          </div>

          {/* User Market Alignment (Personalized) */}
          {data.market_alignment && (
            <Card className="border-brand-200/80 bg-gradient-to-br from-white via-brand-50/20 to-indigo-50/30">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <ScoreRing score={data.market_alignment.score} size={100} />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">Your Market Alignment</h3>
                      <Pill
                        tone={
                          data.market_alignment.score >= 70
                            ? "green"
                            : data.market_alignment.score >= 40
                            ? "amber"
                            : "red"
                        }
                      >
                        {data.market_alignment.score >= 70
                          ? "Strong Match"
                          : data.market_alignment.score >= 40
                          ? "Moderate Alignment"
                          : "High Skill Gap"}
                      </Pill>
                    </div>
                    <p className="max-w-2xl text-sm text-slate-600">
                      {data.market_alignment.summary}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-96">
                  {/* Strong Skills */}
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 size={14} />
                      Possessed In-Demand ({data.market_alignment.strong_skills.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {data.market_alignment.strong_skills.length > 0 ? (
                        data.market_alignment.strong_skills.slice(0, 5).map((s) => (
                          <span
                            key={s.skill}
                            className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-emerald-700 shadow-2xs"
                          >
                            {s.skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No overlap detected yet</span>
                      )}
                    </div>
                  </div>

                  {/* Gap Skills */}
                  <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-amber-800">
                      <AlertTriangle size={14} />
                      High-Priority Gaps ({data.market_alignment.gap_skills.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {data.market_alignment.gap_skills.length > 0 ? (
                        data.market_alignment.gap_skills.slice(0, 5).map((s) => (
                          <span
                            key={s.skill}
                            className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-amber-700 shadow-2xs"
                          >
                            {s.skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-600">All top skills covered!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Salary Trend Chart */}
          <Card>
            <div className="mb-4 flex flex-col justify-between sm:flex-row sm:items-center">
              <div>
                <h3 className="font-semibold text-slate-900">Historical Salary Trend</h3>
                <p className="text-xs text-slate-500">
                  Monthly average salary recorded by Adzuna for {role} in {data.location}
                </p>
              </div>
              {data.salary_trend.length > 0 && (
                <Pill tone="indigo">
                  {data.salary_trend[0]?.label} → {data.salary_trend[data.salary_trend.length - 1]?.label}
                </Pill>
              )}
            </div>

            {data.salary_trend && data.salary_trend.length > 0 ? (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.salary_trend} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCurrency(v, data.country)}
                    />
                    <Tooltip
                      formatter={(v: any) => [formatCurrency(Number(v), data.country), "Average Salary"]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="average_salary"
                      stroke="#6b3ff0"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#6b3ff0", stroke: "#ffffff", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#4f2dbd" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-slate-50 text-center text-sm text-slate-500">
                <Info size={24} className="mb-1 text-slate-400" />
                <p className="font-medium text-slate-700">Historical salary data unavailable</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Adzuna historical salary series is not recorded for this specific role and location filter.
                </p>
              </div>
            )}
          </Card>

          {/* Two Columns: Skills in Demand & Top Hiring Companies */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Skills in Demand (Calculated from real JDs) */}
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Skills in Demand</h3>
                  <p className="text-xs text-slate-500">
                    Frequency across {data.sample_size} real {role} listings
                  </p>
                </div>
                <Pill tone="brand">Real-Time Sample</Pill>
              </div>

              {data.skills_in_demand && data.skills_in_demand.length > 0 ? (
                <div className="space-y-3">
                  {data.skills_in_demand.slice(0, 10).map((s) => {
                    const isPossessed = data.market_alignment?.strong_skills.some(
                      (st) => st.skill.toLowerCase() === s.skill.toLowerCase()
                    );
                    return (
                      <div key={s.skill} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-medium text-slate-800">
                            {s.skill}
                            {isPossessed && (
                              <span className="rounded bg-emerald-100 px-1 py-0.2 text-[10px] font-semibold text-emerald-700">
                                in profile
                              </span>
                            )}
                          </span>
                          <span className="font-semibold text-slate-600">
                            {s.demand_percentage}%{" "}
                            <span className="font-normal text-slate-400">
                              ({s.job_count} jobs)
                            </span>
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isPossessed ? "bg-emerald-500" : "bg-brand-600"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(4, s.demand_percentage))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-slate-400">
                  No skills extracted from current query listings.
                </div>
              )}
            </Card>

            {/* Top Hiring Companies */}
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Top Hiring Companies</h3>
                  <p className="text-xs text-slate-500">
                    Employers with highest active openings on Adzuna
                  </p>
                </div>
                <Building2 size={16} className="text-slate-400" />
              </div>

              {data.top_companies && data.top_companies.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {data.top_companies.map((comp, idx) => {
                    const initials = comp.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                    return (
                      <div key={comp.name} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 font-bold text-xs text-indigo-700">
                            {initials || `${idx + 1}`}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{comp.name}</p>
                            {comp.average_salary ? (
                              <p className="text-xs text-slate-400">
                                Avg: {formatCurrency(comp.average_salary, data.country)}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400">Verified Employer</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                            {comp.count.toLocaleString()} jobs
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-slate-400">
                  Top employer breakdown unavailable for this query.
                </div>
              )}
            </Card>
          </div>

          {/* Two Columns: Salary Distribution & Regional Demand */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Salary Distribution Histogram */}
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Salary Distribution</h3>
                  <p className="text-xs text-slate-500">
                    Real Adzuna salary bracket histogram
                  </p>
                </div>
                <Pill tone="indigo">Histogram</Pill>
              </div>

              {data.salary_distribution && data.salary_distribution.length > 0 ? (
                <div className="h-60 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.salary_distribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="range_label"
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        axisLine={{ stroke: "#e2e8f0" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(v: any) => [`${Number(v).toLocaleString()} active jobs`, "Vacancies"]}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-slate-50 text-center text-sm text-slate-500">
                  <Info size={24} className="mb-1 text-slate-400" />
                  <p className="font-medium text-slate-700">Salary distribution unavailable</p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    No bracket histogram data provided by Adzuna for this specific filter.
                  </p>
                </div>
              )}
            </Card>

            {/* Top Locations / Regional Demand */}
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Regional Job Demand</h3>
                  <p className="text-xs text-slate-500">
                    Geographic distribution of active openings
                  </p>
                </div>
                <Globe size={16} className="text-slate-400" />
              </div>

              {data.top_locations && data.top_locations.length > 0 ? (
                <div className="space-y-2.5">
                  {data.top_locations.map((loc, idx) => {
                    const maxCount = data.top_locations[0]?.count || 1;
                    const pct = Math.round((loc.count / maxCount) * 100);
                    return (
                      <div key={loc.location} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-medium text-slate-800">
                            <MapPin size={12} className="text-slate-400" />
                            {loc.location}
                          </span>
                          <span className="font-semibold text-slate-700">
                            {loc.count.toLocaleString()} jobs
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full bg-indigo-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-slate-400">
                  Regional breakdown unavailable for this query.
                </div>
              )}
            </Card>
          </div>

          {/* Market-Driven Skill Priorities */}
          {data.skill_priorities && data.skill_priorities.length > 0 && (
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Market-Driven Skill Priorities</h3>
                  <p className="text-xs text-slate-500">
                    High-impact missing competencies prioritized based on current Adzuna hiring demand
                  </p>
                </div>
                <Sparkles size={16} className="text-brand-600" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.skill_priorities.slice(0, 6).map((sp) => (
                  <div
                    key={sp.skill}
                    className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:border-brand-200 hover:bg-white hover:shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900">{sp.skill}</h4>
                        <Pill
                          tone={
                            sp.priority === "High"
                              ? "red"
                              : sp.priority === "Medium"
                              ? "amber"
                              : "slate"
                          }
                        >
                          {sp.priority} Priority
                        </Pill>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">{sp.reason}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-200/50 pt-2 text-xs">
                      <span className="font-semibold text-brand-600">
                        {sp.demand_percentage}% Market Demand
                      </span>
                      <span className="text-slate-400">Recommended</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}

