"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Job } from "@/types/api";
import { Card, EmptyState, LoadingBlock, PageHeader, Pill } from "@/components/ui";

const STATUSES = ["Applied", "Under Review", "Interview", "Offer"];

export default function ApplicationsPage() {
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    api.jobsSearch({}).then((res) => setJobs(res.jobs.slice(0, 4)));
  }, []);

  if (!jobs) return <LoadingBlock label="Loading applications..." />;
  if (jobs.length === 0) return <EmptyState title="No applications yet" />;

  return (
    <div>
      <PageHeader title="Applications" subtitle="Track the status of jobs you've applied to." />
      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-slate-100 text-slate-500">
            <th className="px-6 py-3 font-medium">Job</th><th className="px-6 py-3 font-medium">Company</th><th className="px-6 py-3 font-medium">Status</th>
          </tr></thead>
          <tbody>
            {jobs.map((job, i) => (
              <tr key={job.id} className="border-b border-slate-50">
                <td className="px-6 py-3 font-medium text-slate-900">{job.title}</td>
                <td className="px-6 py-3 text-slate-600">{job.company}</td>
                <td className="px-6 py-3"><Pill tone={i === 0 ? "green" : "brand"}>{STATUSES[i % STATUSES.length]}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
