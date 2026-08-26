"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import type { Job } from "@/types/api";
import { Card, LoadingBlock, PageHeader, Pill } from "@/components/ui";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    api.job(params.id).then(setJob).catch(() => setNotFound(true));
  }, [params?.id]);

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

  if (notFound) return <p className="text-sm text-slate-500">Job not found.</p>;
  if (!job) return <LoadingBlock label="Loading job..." />;

  return (
    <div>
      <PageHeader
        title={job.title}
        subtitle={`${job.company} · ${job.location}${job.remote ? " · Remote" : ""}`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            {job.redirect_url && (
              <a
                href={job.redirect_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                View on Adzuna <ExternalLink size={13} />
              </a>
            )}
            <Link
              href={`/interview-prep?company=${encodeURIComponent(job.company)}&role=${encodeURIComponent(job.title)}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition-colors"
            >
              Prepare for {job.company}
            </Link>
            <Link href={`/jobs/${job.id}/match`} className="btn-primary">
              See my match
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-2 font-semibold text-slate-900">Description</h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{job.description}</p>
          <h3 className="mb-2 mt-5 font-semibold text-slate-900">Required Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {job.skills.map((s) => (
              <Pill key={s} tone="brand">{s}</Pill>
            ))}
          </div>
        </Card>
        <Card>
          <p className="mb-1 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin size={14} /> {job.location}
          </p>
          <p className="mt-3 text-sm text-slate-500">Seniority</p>
          <p className="font-medium text-slate-900">{job.seniority || "Mid-level"}</p>
          <p className="mt-3 text-sm text-slate-500">Salary Range</p>
          <p className="font-medium text-slate-900">
            {formatSalary(job.salary_min, job.salary_max)}
          </p>
          {job.source && (
            <>
              <p className="mt-3 text-sm text-slate-500">Source</p>
              <p className="font-medium text-slate-900">{job.source}</p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
