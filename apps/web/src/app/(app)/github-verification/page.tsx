"use client";

import { useState } from "react";
import { CheckCircle2, Github, HelpCircle, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { GithubResult } from "@/types/api";
import { Card, LoadingBlock, PageHeader } from "@/components/ui";

function statusIcon(status: string) {
  if (status === "Verified") return <CheckCircle2 className="text-emerald-600" size={16} />;
  if (status === "Partial Evidence") return <HelpCircle className="text-amber-600" size={16} />;
  return <XCircle className="text-slate-400" size={16} />;
}

export default function GithubVerificationPage() {
  const [username, setUsername] = useState("demo-user");
  const [result, setResult] = useState<GithubResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function connect() {
    setLoading(true);
    try {
      const res = await api.githubAnalyze(username);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="GitHub Verification" subtitle="Back up claimed skills with evidence from your public repositories." />
      <Card className="mb-6 flex items-center gap-3">
        <Github className="text-slate-400" />
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="GitHub username"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none" />
        <button onClick={connect} disabled={loading} className="btn-primary">{loading ? "Analyzing..." : "Connect & Analyze"}</button>
      </Card>

      {loading && <LoadingBlock label="Scanning repositories, languages, and frameworks..." />}

      {result && !loading && (
        <div>
          <Card className="mb-5">
            <p className="text-sm text-slate-500">{result.source === "mock" ? "Demo data (no GitHub token configured)" : "Live GitHub data"}</p>
            <p className="mt-1 text-sm text-slate-600">{result.repo_count} repositories analyzed across: {result.languages.join(", ")}</p>
          </Card>
          <Card>
            <h3 className="mb-3 font-semibold text-slate-900">Skill Evidence</h3>
            <div className="space-y-2">
              {Object.entries(result.skill_map).map(([skill, status]) => (
                <div key={skill} className="flex items-center justify-between border-b border-slate-50 py-2 text-sm">
                  <span className="text-slate-700">{skill}</span>
                  <span className="flex items-center gap-1.5 text-slate-600">{statusIcon(status)} {status}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">{result.disclaimer}</p>
          </Card>
        </div>
      )}
    </div>
  );
}
