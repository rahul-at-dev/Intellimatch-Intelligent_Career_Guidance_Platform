"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, MapPin, Search, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { Job } from "@/types/api";
import { Card, EmptyState, LoadingBlock, PageHeader, Pill } from "@/components/ui";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [query, setQuery] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  async function search() {
    setJobs(null);
    try {
      const res = await api.jobsSearch({ query, remote_only: remoteOnly });
      setJobs(res.jobs);
    } catch {
      setJobs([]);
    }
  }

  async function loadSavedJobs() {
    try {
      const res = await api.jobsSaved();
      setSavedJobIds(new Set(res.jobs.map((j) => j.id)));
    } catch {
      // Ignore auth error if unauthenticated
    }
  }

  async function toggleBookmark(job: Job) {
    const isSaved = savedJobIds.has(job.id);
    const updated = new Set(savedJobIds);
    if (isSaved) {
      updated.delete(job.id);
      setSavedJobIds(updated);
      try {
        await api.unsaveJob(job.id);
      } catch {
        setSavedJobIds(savedJobIds);
      }
    } else {
      updated.add(job.id);
      setSavedJobIds(updated);
      try {
        await api.saveJob(job.id, job);
      } catch {
        setSavedJobIds(savedJobIds);
      }
    }
  }

  useEffect(() => {
    search();
    loadSavedJobs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function formatSalary(min: number | null | undefined, max: number | null | undefined) {
    if (min && max) {
      return `₹${(min / 100000).toFixed(1)}L - ₹${(max / 100000).toFixed(1)}L`;
    }
    if (min) {
      return `₹${(min / 100000).toFixed(1)}L+`;
    }
    if (max) {
      return `Up to ₹${(max / 100000).toFixed(1)}L`;
    }
    return "Salary not disclosed";
  }

  const getCompanyInitial = (name: string) => {
    return (name || "C").trim().charAt(0).toUpperCase();
  };

  return (
    <div>
      <PageHeader
        title="Jobs"
        subtitle="Search live verified opportunities. Unranked search results — click 'See my match' for personalized IntelliMatch scoring."
      />

      <Card className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center bg-white p-4 shadow-sm border-slate-200/90">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-600" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search title, company, or skill..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none px-2">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(e) => setRemoteOnly(e.target.checked)}
            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Remote only
        </label>
        <button onClick={search} className="btn-primary py-2.5 px-6 shadow-md shadow-brand-500/20">
          Search
        </button>
      </Card>

      {!jobs && <LoadingBlock label="Searching live opportunities from Adzuna..." />}
      {jobs && jobs.length === 0 && (
        <EmptyState
          title="No jobs match your search"
          subtitle="Try searching a different role (e.g. 'Java Developer', 'Data Engineer') or uncheck Remote only."
        />
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {jobs?.map((job) => {
          const isSaved = savedJobIds.has(job.id);
          const hasSalary = Boolean(job.salary_min || job.salary_max);
          return (
            <Card
              key={job.id}
              className="group flex flex-col justify-between hover:border-brand-300 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Company Initial Avatar */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-100 via-indigo-50 to-brand-50 text-sm font-bold text-brand-700 shadow-sm border border-brand-200/50">
                      {getCompanyInitial(job.company)}
                    </div>
                    <div>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-bold text-slate-900 hover:text-brand-600 transition-colors text-base line-clamp-1"
                      >
                        {job.title}
                      </Link>
                      <p className="text-xs font-medium text-slate-500 line-clamp-1">{job.company}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleBookmark(job)}
                    className={`rounded-lg p-1.5 transition-colors ${
                      isSaved
                        ? "bg-brand-50 text-brand-600"
                        : "text-slate-300 hover:bg-slate-50 hover:text-brand-600"
                    }`}
                    aria-label={isSaved ? "Remove from saved jobs" : "Save job"}
                  >
                    <Bookmark
                      size={18}
                      className={isSaved ? "fill-brand-600 text-brand-600" : ""}
                    />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                    <MapPin size={13} className="text-sky-500" />
                    {job.location}
                  </span>
                  {job.remote && (
                    <Pill tone="green" className="text-[10px] py-0.5 px-2">
                      Remote
                    </Pill>
                  )}
                  {job.seniority && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200/60">
                      {job.seniority}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-2">
                  {job.description}
                </p>

                {/* Skill Pills */}
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {job.skills.slice(0, 5).map((s, idx) => (
                    <Pill
                      key={s}
                      tone={idx === 0 ? "brand" : idx === 1 ? "indigo" : "slate"}
                      className="text-[11px]"
                    >
                      {s}
                    </Pill>
                  ))}
                </div>
              </div>

              {/* Card Footer with Color Accents */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5">
                <span
                  className={`text-xs font-bold rounded-lg px-2.5 py-1 ${
                    hasSalary
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                      : "text-slate-500 bg-slate-100/70"
                  }`}
                >
                  {formatSalary(job.salary_min, job.salary_max)}
                </span>

                <Link
                  href={`/jobs/${job.id}/match`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 transition-all group-hover:translate-x-0.5"
                >
                  <Sparkles size={13} className="text-brand-500" />
                  <span>See my match</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
