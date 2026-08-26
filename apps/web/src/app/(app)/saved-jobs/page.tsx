"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, ExternalLink, MapPin, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { Job } from "@/types/api";
import { Card, EmptyState, LoadingBlock, PageHeader, Pill } from "@/components/ui";

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<Job[] | null>(null);

  async function loadSavedJobs() {
    try {
      const res = await api.jobsSaved();
      setJobs(res.jobs);
    } catch {
      setJobs([]);
    }
  }

  async function handleUnsave(jobId: string) {
    if (!jobs) return;
    setJobs(jobs.filter((j) => j.id !== jobId));
    try {
      await api.unsaveJob(jobId);
    } catch {
      loadSavedJobs();
    }
  }

  useEffect(() => {
    loadSavedJobs();
  }, []);

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

  if (!jobs) return <LoadingBlock label="Loading your saved jobs..." />;
  if (jobs.length === 0) {
    return (
      <div>
        <PageHeader title="Saved Jobs" subtitle="Jobs you've bookmarked for later review and match analysis." />
        <EmptyState
          title="No saved jobs yet"
          subtitle="Click the bookmark icon on any job card to save listings here."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Saved Jobs"
        subtitle={`You have ${jobs.length} bookmarked ${jobs.length === 1 ? "opportunity" : "opportunities"}.`}
      />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {jobs.map((job) => {
          const hasSalary = Boolean(job.salary_min || job.salary_max);
          return (
            <Card
              key={job.id}
              className="group flex flex-col justify-between hover:border-brand-300 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
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
                    onClick={() => handleUnsave(job.id)}
                    className="rounded-lg p-1.5 text-brand-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Remove from saved jobs"
                    aria-label="Remove bookmark"
                  >
                    <Bookmark size={18} className="fill-brand-600 text-brand-600" />
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
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-2">
                  {job.description}
                </p>

                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {job.skills?.slice(0, 5).map((s, idx) => (
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

                <div className="flex items-center gap-3">
                  {job.redirect_url && (
                    <a
                      href={job.redirect_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors"
                    >
                      <span>Listing</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                  <Link
                    href={`/jobs/${job.id}/match`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 transition-all group-hover:translate-x-0.5"
                  >
                    <Sparkles size={13} className="text-brand-500" />
                    <span>See my match</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
