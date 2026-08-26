"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Compass,
  Cpu,
  Database,
  ExternalLink,
  Flame,
  Globe,
  GraduationCap,
  Layers,
  Lightbulb,
  Network,
  Play,
  RefreshCw,
  Rocket,
  Search,
  Server,
  Shield,
  Sparkles,
  Target,
  Terminal,
  TrendingUp,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import type { LearningPathItem, LearningStage } from "@/types/api";
import { Card, LoadingBlock, PageHeader, Pill } from "@/components/ui";

// Suggested popular skills
const POPULAR_SKILLS = [
  "Java",
  "Python",
  "React",
  "AWS",
  "Docker",
  "Kubernetes",
  "System Design",
  "SQL",
  "FastAPI",
  "TypeScript",
  "Node.js",
  "Microservices",
];

const TARGET_ROLES = [
  "Senior Backend Engineer",
  "Full Stack Developer",
  "Machine Learning Engineer",
  "Cloud / DevOps Engineer",
  "Frontend Engineer",
  "Data Engineer",
  "System Architect",
];

const PROFICIENCY_LEVELS = [
  { label: "Auto-detect from profile", value: -1 },
  { label: "Beginner (Level 0 – 1 / 5)", value: 1.0 },
  { label: "Intermediate (Level 2 – 3 / 5)", value: 2.5 },
  { label: "Advanced (Level 4 / 5)", value: 4.0 },
];

// Color mapping for progressive roadmap stages
const STAGE_ACCENTS = [
  {
    badge: "bg-purple-600 text-white",
    border: "border-purple-500",
    bg: "bg-purple-50/50",
    light: "bg-purple-100 text-purple-700",
    text: "text-purple-700",
  },
  {
    badge: "bg-blue-600 text-white",
    border: "border-blue-500",
    bg: "bg-blue-50/50",
    light: "bg-blue-100 text-blue-700",
    text: "text-blue-700",
  },
  {
    badge: "bg-teal-600 text-white",
    border: "border-teal-500",
    bg: "bg-teal-50/50",
    light: "bg-teal-100 text-teal-700",
    text: "text-teal-700",
  },
  {
    badge: "bg-amber-600 text-white",
    border: "border-amber-500",
    bg: "bg-amber-50/50",
    light: "bg-amber-100 text-amber-700",
    text: "text-amber-700",
  },
  {
    badge: "bg-indigo-700 text-white",
    border: "border-indigo-600",
    bg: "bg-indigo-50/50",
    light: "bg-indigo-100 text-indigo-700",
    text: "text-indigo-700",
  },
];

// ---------------------------------------------------------------------------
// Technology Logo & Category Icon Renderer
// ---------------------------------------------------------------------------
function SkillLogoIcon({ skill }: { skill: string }) {
  const norm = skill.toLowerCase().trim();

  // Known high-res SVG brand logos & category iconography
  if (norm.includes("java") && !norm.includes("script")) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-600/20 to-red-600/20 p-3 shadow-inner ring-1 ring-orange-500/30">
        <svg viewBox="0 0 24 24" className="h-10 w-10 fill-[#E76F00]" role="img" aria-label="Java logo">
          <path d="M8.851 18.56s-.917.534.667.7c2.297.24 3.824.205 6.304-.216 0 0 .897.433 1.815.766-4.636 1.94-11.487.809-8.786-1.25zm-1.077-3.713s-1.077.7-.308 1.018c1.35.559 4.37.705 7.027.18 0 0 .817.518 1.488.75-4.99 1.583-11.668.74-8.207-1.948zm10.748-4.475c.677.818-.28 2.015-1.572 2.766-1.528.89-3.693 1.39-5.94 1.34-2.185-.05-4.14-.663-5.01-1.637-.643-.72-.258-1.428.468-1.892 1.385-.884 4.093-1.07 6.44-.925 2.15.132 4.148.552 5.614 1.348zm-1.98-3.048c-.68.61-2.146.993-3.67 1.082-1.826.106-3.837-.08-4.985-.757-.864-.51-1.084-1.222-.44-1.848.913-.889 2.92-1.328 5.093-1.252 2.174.075 4.316.59 4.002 2.775zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z"/>
        </svg>
      </div>
    );
  }

  if (norm.includes("python")) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 via-sky-600/20 to-yellow-500/20 p-3 shadow-inner ring-1 ring-blue-500/30">
        <svg viewBox="0 0 24 24" className="h-10 w-10 fill-[#3776AB]" role="img" aria-label="Python logo">
          <path d="M11.914 0C5.82 0 6.2 2.656 6.2 2.656l.006 2.75h5.808v.825H3.875S0 5.79 0 11.908c0 6.12 3.39 5.918 3.39 5.918h2.023v-2.842s-.11-3.39 3.33-3.39h5.714s3.226.05 3.226-3.17V3.17S18.006 0 11.914 0zm-3.27 1.777a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1zm3.442 22.223c6.094 0 5.714-2.656 5.714-2.656l-.006-2.75H11.986v-.825h8.14s3.874.44 3.874-5.677c0-6.118-3.39-5.918-3.39-5.918h-2.023v2.842s.11 3.39-3.33 3.39H9.543s-3.226-.05-3.226 3.17v5.253s-.326 3.17 5.766 3.17zm3.27-1.777a1.05 1.05 0 1 1 0-2.1 1.05 1.05 0 0 1 0 2.1z"/>
        </svg>
      </div>
    );
  }

  if (norm.includes("react")) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 via-sky-600/20 to-blue-600/20 p-3 shadow-inner ring-1 ring-cyan-500/30">
        <svg viewBox="0 0 24 24" className="h-10 w-10 fill-[#61DAFB]" role="img" aria-label="React logo">
          <path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zm0 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm0-6.5c-4.418 0-8 3.582-8 8 0 .84.13 1.65.37 2.41 1.83-.87 4.54-1.41 7.63-1.41 3.09 0 5.8.54 7.63 1.41.24-.76.37-1.57.37-2.41 0-4.418-3.582-8-8-8z"/>
        </svg>
      </div>
    );
  }

  if (norm.includes("aws") || norm.includes("cloud")) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-600/20 to-slate-900/20 p-3 shadow-inner ring-1 ring-amber-500/30">
        <Server className="h-9 w-9 text-amber-600" />
      </div>
    );
  }

  if (norm.includes("docker")) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/20 via-sky-500/20 to-teal-500/20 p-3 shadow-inner ring-1 ring-blue-500/30">
        <Layers className="h-9 w-9 text-blue-600" />
      </div>
    );
  }

  if (norm.includes("kubernetes") || norm.includes("k8s")) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700/20 via-indigo-600/20 to-purple-600/20 p-3 shadow-inner ring-1 ring-indigo-500/30">
        <Network className="h-9 w-9 text-indigo-600" />
      </div>
    );
  }

  if (norm.includes("system design") || norm.includes("architecture")) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600/20 via-indigo-600/20 to-brand-600/20 p-3 shadow-inner ring-1 ring-purple-500/30">
        <Cpu className="h-9 w-9 text-purple-600" />
      </div>
    );
  }

  if (norm.includes("sql") || norm.includes("postgres") || norm.includes("database")) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600/20 via-blue-600/20 to-indigo-700/20 p-3 shadow-inner ring-1 ring-sky-500/30">
        <Database className="h-9 w-9 text-sky-600" />
      </div>
    );
  }

  if (norm.includes("machine learning") || norm.includes("ai") || norm.includes("deep learning")) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 via-purple-600/20 to-indigo-600/20 p-3 shadow-inner ring-1 ring-rose-500/30">
        <Zap className="h-9 w-9 text-rose-600" />
      </div>
    );
  }

  // Large stylized initials fallback
  const words = skill.trim().split(/\s+/);
  const firstWord = words[0] || "SK";
  const secondWord = words[1] || "";
  const initials =
    words.length === 1
      ? firstWord.slice(0, 2).toUpperCase()
      : (firstWord[0] + (secondWord[0] || "")).toUpperCase();

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-800 text-white font-extrabold text-xl shadow-lg ring-2 ring-brand-400/30">
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Learning Path Component
// ---------------------------------------------------------------------------
export default function LearningPathPage() {
  const [searchQuery, setSearchQuery] = useState<string>("Java");
  const [selectedRole, setSelectedRole] = useState<string>("Senior Backend Engineer");
  const [selectedLevel, setSelectedLevel] = useState<number>(-1);
  const [paths, setPaths] = useState<LearningPathItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStageText, setLoadingStageText] = useState<string>("Analyzing your profile & skill gaps...");
  const [error, setError] = useState<string | null>(null);

  // Completed stage tracker for dynamic progress calculation
  const [completedStages, setCompletedStages] = useState<Record<string, number[]>>({});

  // Cycle loading step messages during generation
  useEffect(() => {
    if (!loading) return;
    const messages = [
      "Analyzing your profile & skill gaps...",
      "Querying live Adzuna employment demand...",
      "Synthesizing structured curriculum via OpenRouter AI...",
      "Calibrating real-world milestones & deliverables...",
    ];
    let idx = 0;
    const timer = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setLoadingStageText(messages[idx] || "Synthesizing structured curriculum...");
    }, 2200);
    return () => clearInterval(timer);
  }, [loading]);


  const handleGenerate = async (skillToGenerate?: string) => {
    const targetSkill = (skillToGenerate || searchQuery).trim();
    if (!targetSkill) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.learningPath({
        skills: [targetSkill],
        custom_skill: targetSkill,
        target_role: selectedRole,
        current_level: selectedLevel >= 0 ? selectedLevel : undefined,
      });
      setPaths(res.paths);
    } catch (err: any) {
      setError(
        err?.message ||
          "AI learning path generation is currently unavailable. Please verify your OpenRouter API key configuration."
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    handleGenerate("Java");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const toggleStageCompletion = (skill: string, stageIdx: number) => {
    setCompletedStages((prev) => {
      const currentList = prev[skill] || [];
      const updated = currentList.includes(stageIdx)
        ? currentList.filter((idx) => idx !== stageIdx)
        : [...currentList, stageIdx];
      return { ...prev, [skill]: updated };
    });
  };

  const activePath = paths && paths.length > 0 ? paths[0] : null;

  // Calculate completion percentage
  const totalStages = activePath?.stages?.length || 5;
  const completedCount = (activePath && completedStages[activePath.skill]?.length) || 0;
  const progressPct = Math.round((completedCount / totalStages) * 100);

  return (
    <div className="space-y-8 pb-12">
      {/* ------------------------------------------------------------------- */}
      {/* 1. Top Hero Section: Gradient Header & Search                        */}
      {/* ------------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl ring-1 ring-white/10">
        {/* Subtle background glow decorative elements */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-900/40 px-3 py-1 text-xs font-semibold text-purple-200 backdrop-blur-md">
            <Sparkles size={13} className="text-purple-300 animate-pulse" />
            <span>OpenRouter AI Powered Learning Engine</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Turn any skill into a <span className="bg-gradient-to-r from-purple-300 via-indigo-200 to-cyan-300 bg-clip-text text-transparent">personalized career roadmap</span>.
          </h1>

          <p className="text-sm sm:text-base text-purple-200/80 leading-relaxed max-w-2xl">
            Calibrated against real Adzuna job vacancy demand, your demonstrated profile skills, and your target seniority goals.
          </p>

          {/* Search & Custom Inputs Box */}
          <div className="mt-6 rounded-2xl bg-white/10 p-3 sm:p-4 backdrop-blur-md ring-1 ring-white/20 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-purple-300" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate(searchQuery)}
                  placeholder="What do you want to learn? (e.g. Java, Python, React, AWS, Docker, System Design...)"
                  className="w-full rounded-xl bg-slate-900/80 border border-purple-500/30 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-purple-300/60 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all"
                />
              </div>

              <button
                onClick={() => handleGenerate(searchQuery)}
                disabled={loading || !searchQuery.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg hover:from-brand-600 hover:to-indigo-700 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Generate Path</span>
                  </>
                )}
              </button>
            </div>

            {/* Target Role and Current Level Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-purple-200/80 uppercase tracking-wider block mb-1">
                  Target Role:
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full rounded-lg bg-slate-900/70 border border-purple-500/20 px-3 py-1.5 text-xs text-purple-100 focus:border-cyan-400 focus:outline-none"
                >
                  {TARGET_ROLES.map((r) => (
                    <option key={r} value={r} className="bg-slate-900 text-white">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-purple-200/80 uppercase tracking-wider block mb-1">
                  Current Level:
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(parseFloat(e.target.value))}
                  className="w-full rounded-lg bg-slate-900/70 border border-purple-500/20 px-3 py-1.5 text-xs text-purple-100 focus:border-cyan-400 focus:outline-none"
                >
                  {PROFICIENCY_LEVELS.map((lvl) => (
                    <option key={lvl.value} value={lvl.value} className="bg-slate-900 text-white">
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Skill Suggestion Pills */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-purple-300/80 mr-1">
                Popular skills:
              </span>
              {POPULAR_SKILLS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSearchQuery(s);
                    handleGenerate(s);
                  }}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    searchQuery.toLowerCase() === s.toLowerCase()
                      ? "bg-cyan-400 text-slate-950 shadow-sm"
                      : "bg-white/10 text-purple-200 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. Error State                                                      */}
      {/* ------------------------------------------------------------------- */}
      {error && (
        <Card className="border-rose-200 bg-rose-50/60 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-900">Learning Path Generation Unavailable</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 3. Loading State with Multi-stage Steps                             */}
      {/* ------------------------------------------------------------------- */}
      {loading && (
        <Card className="p-8 text-center bg-gradient-to-b from-purple-50/40 via-white to-slate-50/40 border-purple-100">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-brand-600 shadow-inner ring-1 ring-purple-300">
            <RefreshCw className="h-7 w-7 animate-spin" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            Building Your Personalized {searchQuery} Curriculum
          </h3>
          <p className="mt-1 text-xs font-semibold text-brand-600 animate-pulse">
            {loadingStageText}
          </p>
          <div className="mt-6 mx-auto max-w-xs h-1.5 w-full overflow-hidden rounded-full bg-purple-100">
            <div className="h-full w-2/3 bg-gradient-to-r from-brand-600 to-indigo-600 animate-[shimmer_1.5s_infinite]" />
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 4. Generated Learning Overview & Metrics                             */}
      {/* ------------------------------------------------------------------- */}
      {activePath && !loading && (
        <div className="space-y-8">
          {/* Main Overview Card */}
          <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/30 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <SkillLogoIcon skill={activePath.skill} />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-extrabold text-slate-900">{activePath.skill}</h2>
                    <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-bold text-brand-700">
                      Personalized Path
                    </span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                    {activePath.objective}
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                    Calibrated for <span className="font-semibold text-slate-700">{selectedRole}</span> profile alignment.
                  </p>
                </div>
              </div>

              {/* Progress Summary Meter */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs min-w-[220px]">
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700">Learning Progress</span>
                  <span className="text-brand-600">{progressPct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-teal-500 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-slate-500">
                  {completedCount} of {totalStages} roadmap stages completed
                </p>
              </div>
            </div>

            {/* 4 Semantic Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-6">
              {/* Metric 1: Current Level (Blue) */}
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-blue-700 text-xs font-semibold">
                  <span>Current Level</span>
                  <Compass size={15} />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-blue-950">
                  {(activePath.current_level ?? 1.5).toFixed(1)} <span className="text-xs font-normal text-blue-600">/ 5.0</span>
                </div>
                <p className="mt-1 text-[11px] text-blue-700/80">From resume & profile analysis</p>
              </div>

              {/* Metric 2: Skill Gap (Rose / Amber) */}
              <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/60 to-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-rose-700 text-xs font-semibold">
                  <span>Skill Gap</span>
                  <Target size={15} />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-rose-950">
                  {(activePath.gap ?? 2.0).toFixed(1)} <span className="text-xs font-normal text-rose-600">pts</span>
                </div>
                <p className="mt-1 text-[11px] text-rose-700/80">Required target: {(activePath.required_level ?? 3.5).toFixed(1)} / 5.0</p>
              </div>

              {/* Metric 3: Market Demand (Teal / Green) */}
              <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/60 to-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-teal-700 text-xs font-semibold">
                  <span>Market Demand</span>
                  <TrendingUp size={15} />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-teal-950">
                    {(activePath.market_demand_pct ?? 72).toFixed(0)}%
                  </span>
                  <span className="text-[10px] font-bold text-teal-700 uppercase">High Demand</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-teal-100">
                  <div
                    className="h-full rounded-full bg-teal-600"
                    style={{ width: `${Math.min(100, activePath.market_demand_pct ?? 72)}%` }}
                  />
                </div>
              </div>

              {/* Metric 4: Estimated Time (Purple) */}
              <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/60 to-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-purple-700 text-xs font-semibold">
                  <span>Estimated Effort</span>
                  <Clock size={15} />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-purple-950">
                  ~{activePath.estimated_hours} <span className="text-xs font-normal text-purple-600">hours</span>
                </div>
                <p className="mt-1 text-[11px] text-purple-700/80">Across {totalStages} progressive stages</p>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* 5. Visual Learning Roadmap (Vertical Timeline)                   */}
          {/* ----------------------------------------------------------------- */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step-by-Step Learning Roadmap</h3>
                <p className="text-xs text-slate-500">
                  Progressive curriculum ordered from foundational concepts to advanced production architecture.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {totalStages} Stages Planned
              </span>
            </div>

            <div className="relative border-l-2 border-slate-200 ml-4 sm:ml-6 space-y-6 pb-2">
              {activePath.stages &&
                activePath.stages.map((stage: LearningStage, idx: number) => {
                  const isCompleted = (completedStages[activePath.skill] || []).includes(idx);
                  const isNextRecommended = !isCompleted && (idx === 0 || (completedStages[activePath.skill] || []).includes(idx - 1));
                  const accent = STAGE_ACCENTS[idx % STAGE_ACCENTS.length] || STAGE_ACCENTS[0]!;

                  return (
                    <div key={idx} className="relative pl-6 sm:pl-8 group">
                      {/* Roadmap Number Node */}
                      <button
                        onClick={() => toggleStageCompletion(activePath.skill, idx)}
                        title={isCompleted ? "Mark as Incomplete" : "Mark as Completed"}
                        className={`absolute -left-[17px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold transition-all shadow-md ${
                          isCompleted
                            ? "bg-teal-600 text-white ring-4 ring-teal-100"
                            : isNextRecommended
                            ? "bg-brand-600 text-white ring-4 ring-purple-100 scale-110"
                            : `${accent.badge} ring-4 ring-white`
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 size={16} /> : `0${idx + 1}`}
                      </button>

                      {/* Stage Card */}
                      <div
                        className={`rounded-2xl border p-5 transition-all ${
                          isCompleted
                            ? "border-teal-200 bg-teal-50/30 opacity-90"
                            : isNextRecommended
                            ? "border-brand-300 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/30 shadow-md ring-1 ring-brand-200"
                            : "border-slate-200 bg-white hover:border-slate-300 shadow-xs"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900">{stage.name}</h4>
                            {isNextRecommended && !isCompleted && (
                              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white shadow-xs">
                                Next Recommended
                              </span>
                            )}
                            {isCompleted && (
                              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                                Completed
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                              <Clock size={12} /> ~{stage.duration_hours}h
                            </span>
                            <button
                              onClick={() => toggleStageCompletion(activePath.skill, idx)}
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                                isCompleted
                                  ? "border border-teal-300 text-teal-700 hover:bg-teal-100"
                                  : "border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
                              }`}
                            >
                              {isCompleted ? "Mark Incomplete" : "Mark as Done"}
                            </button>
                          </div>
                        </div>

                        <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {stage.description}
                        </p>

                        {/* Topics Pill Cloud */}
                        {stage.topics && stage.topics.length > 0 && (
                          <div className="mt-3.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                              Core Topics Covered:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {stage.topics.map((topic, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Deliverables Checklist */}
                        {stage.deliverables && stage.deliverables.length > 0 && (
                          <div className="mt-3.5 border-t border-slate-100 pt-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                              Milestone Deliverables:
                            </p>
                            <div className="grid gap-1.5 sm:grid-cols-2 text-xs text-slate-700">
                              {stage.deliverables.map((del, dIdx) => (
                                <div key={dIdx} className="flex items-center gap-2">
                                  <CheckCircle2 size={13} className={isCompleted ? "text-teal-600" : "text-brand-500"} />
                                  <span>{del}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* 6. Dedicated Project & Assessment Cards (Colored Zones)           */}
          {/* ----------------------------------------------------------------- */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Project Card (Soft Teal / Blue Zone) */}
            <div className="relative overflow-hidden rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-50/70 via-cyan-50/40 to-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-3 py-1 text-xs font-extrabold uppercase text-white shadow-xs">
                  <Rocket size={13} /> Hands-on Capstone Project
                </span>
                <span className="text-xs font-bold text-teal-800">Portfolio Ready</span>
              </div>

              <h4 className="text-lg font-bold text-slate-900">
                {activePath.project_title || `${activePath.skill} Architecture Capstone`}
              </h4>

              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {activePath.project_description || activePath.project}
              </p>

              {activePath.project_skills && activePath.project_skills.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-teal-800 mb-1.5">
                    Skills Applied in Project:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activePath.project_skills.map((ps, psIdx) => (
                      <span
                        key={psIdx}
                        className="rounded-md bg-white border border-teal-200 px-2 py-0.5 text-xs font-semibold text-teal-800"
                      >
                        {ps}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-teal-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Estimated ~8–12 hours build time</span>
                <button
                  onClick={() => alert(`Starting workspace for ${activePath.skill} Capstone project.`)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-800 transition-all"
                >
                  <Code2 size={14} /> Start Project
                </button>
              </div>
            </div>

            {/* Assessment Card (Soft Amber Zone) */}
            <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-xs font-extrabold uppercase text-white shadow-xs">
                  <GraduationCap size={13} /> Verify Your Knowledge
                </span>
                <span className="text-xs font-bold text-amber-800">5 Questions · ~10 mins</span>
              </div>

              <h4 className="text-lg font-bold text-slate-900">
                {activePath.skill} Competency Assessment
              </h4>

              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Test your mastery of {activePath.skill} with scenario-based multiple choice questions generated by OpenRouter AI.
              </p>

              {activePath.assessment_topics && activePath.assessment_topics.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1.5">
                    Topics Evaluated:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activePath.assessment_topics.map((top, topIdx) => (
                      <span
                        key={topIdx}
                        className="rounded-md bg-white border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800"
                      >
                        {top}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-amber-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Deterministic scoring & instant feedback</span>
                <Link
                  href="/assessment"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-700 transition-all"
                >
                  <Zap size={14} /> Start Assessment
                </Link>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* 7. Learning Journey Flowchart Summary                             */}
          {/* ----------------------------------------------------------------- */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Your Complete Learning Journey
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
              <span className="rounded-lg bg-purple-50 border border-purple-200 px-3 py-1.5 text-purple-700">
                1. {activePath.skill} Fundamentals
              </span>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-blue-700">
                2. Core Architecture
              </span>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-indigo-700">
                3. Advanced Mastery
              </span>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="rounded-lg bg-teal-50 border border-teal-200 px-3 py-1.5 text-teal-700">
                4. Capstone Project
              </span>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-amber-700">
                5. Assessment
              </span>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-emerald-700">
                6. Production Ready
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
