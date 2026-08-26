"use client";

import { useState } from "react";
import {
  AlertCircle,
  Award,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe,
  GraduationCap,
  Info,
  Lightbulb,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Target,
  Upload,
  User,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import type { ResumeAnalysis } from "@/types/api";
import { Card, ImportancePill, LoadingBlock, PageHeader, Pill, ScoreRing } from "@/components/ui";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc"];

export default function ResumeAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [showJdInput, setShowJdInput] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "experience" | "education">("overview");
  const [result, setResult] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleFileChange(selectedFile: File | null) {
    setErrorMsg(null);
    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrorMsg("File size exceeds 10MB. Please choose a smaller PDF or DOCX file.");
      return;
    }

    const lower = selectedFile.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
    if (!hasValidExt) {
      setErrorMsg("Unsupported file format. Please upload a .pdf or .docx resume.");
      return;
    }

    setFile(selectedFile);
  }

  async function handleAnalyze() {
    if (!file) {
      setErrorMsg("Please select a resume file (PDF or DOCX) to analyze.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      const data = await api.resumeAnalyze(file, jobDescription.trim() || undefined);
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze resume. Please try again.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resume Intelligence & ATS Optimization"
        subtitle="Extract structured resume data with Affinda parser, calculate custom ATS scores, and identify critical skill gaps."
      />

      {/* Upload and Configuration Card */}
      <Card>
        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Upload size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {file ? file.name : "Click or drag your resume here to upload"}
              </p>
              <p className="mt-1 text-xs text-slate-400">Supported formats: PDF, DOCX (Max 10MB)</p>
            </div>
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
          </label>

          {/* Job Description Optional Toggle */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <button
              type="button"
              onClick={() => setShowJdInput(!showJdInput)}
              className="flex w-full items-center justify-between text-left text-sm font-medium text-slate-800"
            >
              <span className="flex items-center gap-2">
                <Target size={16} className="text-brand-600" />
                Target Job Description (Optional for Mode 2 ATS Matching)
              </span>
              {showJdInput ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>

            {showJdInput && (
              <div className="mt-3 space-y-2">
                <textarea
                  rows={4}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste a job description or list of requirements here to compute direct ATS skill match, keyword match, and role compatibility..."
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <p className="text-xs text-slate-500">
                  Tip: When provided, the ATS engine evaluates skill coverage, experience requirements, and keyword density against this job description.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={loading || !file}
              className="btn-primary flex items-center gap-2"
            >
              <Sparkles size={16} />
              {loading ? "Parsing & Scoring..." : "Analyze Resume"}
            </button>
            {file && (
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setErrorMsg(null);
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle size={20} className="shrink-0 text-rose-600" />
          <div className="flex-1">
            <p className="font-semibold">Analysis Notice</p>
            <p className="mt-0.5 text-xs text-rose-700">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <LoadingBlock label="Parsing document with Affinda, standardizing skills, calculating custom ATS scores..." />
      )}

      {/* Analysis Results View */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Header Score Banner */}
          <Card className="border-brand-200 bg-gradient-to-br from-white via-brand-50/20 to-brand-100/30">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="space-y-2 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <span className="pill bg-brand-100 font-semibold text-brand-800">
                    {result.mode === "resume_and_job" ? "Job Description Match Mode" : "Resume Readability Mode"}
                  </span>
                  <span className="pill bg-slate-100 text-slate-700">
                    {result.file_name}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  IntelliMatch ATS Score: {result.ats_score}/100
                </h2>
                <p className="max-w-2xl text-xs text-slate-500">
                  {result.disclaimer}
                </p>
              </div>

              <div className="flex shrink-0 items-center justify-center">
                <ScoreRing score={result.ats_score} size={110} />
              </div>
            </div>
          </Card>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Skill Match</span>
                <span className="text-xs font-medium text-slate-400">40% Wt</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{Math.round(result.breakdown.skill_match)}%</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-brand-600" style={{ width: `${result.breakdown.skill_match}%` }} />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Experience</span>
                <span className="text-xs font-medium text-slate-400">20% Wt</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{Math.round(result.breakdown.experience_match)}%</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-emerald-600" style={{ width: `${result.breakdown.experience_match}%` }} />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Keywords</span>
                <span className="text-xs font-medium text-slate-400">15% Wt</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{Math.round(result.breakdown.keyword_match)}%</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-amber-600" style={{ width: `${result.breakdown.keyword_match}%` }} />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Education</span>
                <span className="text-xs font-medium text-slate-400">15% Wt</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{Math.round(result.breakdown.education_match)}%</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-indigo-600" style={{ width: `${result.breakdown.education_match}%` }} />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Structure</span>
                <span className="text-xs font-medium text-slate-400">10% Wt</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{Math.round(result.breakdown.structure_score)}%</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-teal-600" style={{ width: `${result.breakdown.structure_score}%` }} />
              </div>
            </Card>
          </div>

          {/* Skill Gap Analysis Section */}
          {result.skill_gap && (
            <Card className="space-y-4">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold text-slate-900">Skill Gap & Requirements Analysis</h3>
                  <p className="text-xs text-slate-500">
                    Identified based on target requirements and canonical skill taxonomy.
                  </p>
                </div>
                <span className="pill bg-amber-50 font-semibold text-amber-700">
                  Skill Gap: {result.skill_gap.skill_gap_percentage}%
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Matched Skills */}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                    <CheckCircle2 size={14} className="text-emerald-600" /> Matched Skills ({result.matched_skills.length})
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {result.matched_skills.length === 0 ? (
                      <p className="text-xs text-slate-400">No matching skills detected for target requirements.</p>
                    ) : (
                      result.matched_skills.map((s) => (
                        <span key={s} className="pill bg-emerald-100 font-medium text-emerald-800">
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-800">
                    <XCircle size={14} className="text-rose-600" /> Missing Skills ({result.missing_skills.length})
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {result.missing_skills.length === 0 ? (
                      <p className="text-xs text-emerald-700">All target skills are covered in your resume!</p>
                    ) : (
                      result.missing_skills.map((s) => (
                        <span key={s} className="pill bg-rose-100 font-medium text-rose-800">
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Priority Skills Table */}
              {result.skill_gap.priority_skills && result.skill_gap.priority_skills.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    High Impact Skills to Learn or Highlight
                  </h4>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                    {result.skill_gap.priority_skills.map((ps) => (
                      <div key={ps.skill} className="flex items-center justify-between p-3 text-sm">
                        <div>
                          <p className="font-semibold text-slate-800">{ps.skill}</p>
                          <p className="text-xs text-slate-500">{ps.reason}</p>
                        </div>
                        <ImportancePill importance={ps.priority} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Actionable Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/30">
              <div className="flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-600" />
                <h3 className="font-semibold text-slate-900">Optimization Recommendations</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800">
                      {i + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Extracted Structured Resume Data Section */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-semibold text-slate-900">Extracted Structured Profile (Affinda Parser)</h3>
                <p className="text-xs text-slate-400">Cleaned and normalized candidate data extracted from your file.</p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs">
                {(["overview", "skills", "experience", "education"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-md px-3 py-1.5 font-medium transition ${
                      activeTab === tab ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <User size={18} className="text-brand-600" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Candidate Name</p>
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {result.structured_data?.personal_info?.name || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <Mail size={18} className="text-brand-600" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Email Address</p>
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {result.structured_data?.personal_info?.email || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <Phone size={18} className="text-brand-600" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {result.structured_data?.personal_info?.phone || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <MapPin size={18} className="text-brand-600" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {result.structured_data?.personal_info?.location || "Not specified"}
                    </p>
                  </div>
                </div>

                {result.structured_data?.personal_info?.summary && (
                  <div className="sm:col-span-2 lg:col-span-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Professional Summary</p>
                    <p className="mt-1 text-sm text-slate-700">{result.structured_data.personal_info.summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Skills */}
            {activeTab === "skills" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Total {result.skills_found.length} skills identified and normalized to taxonomy.
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.skills_found.map((s) => (
                    <Pill key={s} tone="brand">
                      {s}
                    </Pill>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Experience */}
            {activeTab === "experience" && (
              <div className="space-y-3">
                {result.structured_data?.experience && result.structured_data.experience.length > 0 ? (
                  result.structured_data.experience.map((exp, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{exp.title || "Position"}</p>
                          <p className="text-xs text-slate-600">{exp.company} {exp.location ? `· ${exp.location}` : ""}</p>
                        </div>
                        {exp.dates && <span className="pill bg-slate-200 text-xs text-slate-700">{exp.dates}</span>}
                      </div>
                      {exp.description && (
                        <p className="mt-2 whitespace-pre-line text-xs text-slate-600">{exp.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No explicit work experience entries extracted.</p>
                )}
              </div>
            )}

            {/* Tab 4: Education */}
            {activeTab === "education" && (
              <div className="space-y-3">
                {result.structured_data?.education && result.structured_data.education.length > 0 ? (
                  result.structured_data.education.map((edu, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                      <div>
                        <p className="font-semibold text-slate-900">{edu.degree || "Degree"}</p>
                        <p className="text-xs text-slate-600">{edu.institution}</p>
                      </div>
                      {edu.dates && <span className="pill bg-slate-200 text-xs text-slate-700">{edu.dates}</span>}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No education entries extracted.</p>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
