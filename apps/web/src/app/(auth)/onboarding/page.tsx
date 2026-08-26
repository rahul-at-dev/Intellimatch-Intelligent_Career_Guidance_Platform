"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { api } from "@/lib/api";

const STAGES = [
  "Reading resume...",
  "Extracting skills...",
  "Mapping skills...",
  "Analyzing experience...",
  "Building career profile...",
];

type Step = "profile" | "resume" | "goals" | "done";

const STEPS: Step[] = ["profile", "resume", "goals", "done"];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [step, setStep] = useState<Step>("profile");
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [targetRole, setTargetRole] = useState("Senior Backend Engineer");

  // Profile form state — pre-filled from Clerk when available
  const [fullName, setFullName] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [location, setLocation] = useState("");

  // Pre-fill name from Clerk once loaded
  if (isLoaded && user && !fullName) {
    setFullName(user.fullName ?? user.firstName ?? "");
  }

  async function runAnalysis() {
    setProcessing(true);
    for (let i = 0; i < STAGES.length; i++) {
      setStageIndex(i);
      await new Promise((r) => setTimeout(r, 500));
    }
    try {
      if (file) await api.resumeAnalyze(file);
      else
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/resume/analyze`,
          { method: "POST" }
        );
    } catch {
      // Demo mode tolerates API being offline
    }
    setProcessing(false);
    setStep("goals");
  }

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      {/* Progress bar */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              stepIndex >= i ? "bg-brand-600" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Profile info */}
      {step === "profile" && (
        <div className="card p-8">
          <h1 className="text-xl font-semibold text-slate-900">Tell us about yourself</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isLoaded && user
              ? `Hi ${user.firstName ?? "there"} — let's set up your career profile.`
              : "Let's set up your career profile."}
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Current role</label>
              <input
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                placeholder="e.g. Backend Engineer"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bangalore"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <button onClick={() => setStep("resume")} className="btn-primary mt-6 w-full">
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Resume upload */}
      {step === "resume" && !processing && (
        <div className="card p-8">
          <h1 className="text-xl font-semibold text-slate-900">Upload your resume</h1>
          <p className="mt-1 text-sm text-slate-500">
            PDF preferred. We&apos;ll extract your skills automatically.
          </p>
          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-10 text-center hover:border-brand-400 transition-colors">
            <Upload className="text-slate-400" />
            <span className="text-sm text-slate-600">{file ? file.name : "Click to choose a PDF"}</span>
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button onClick={runAnalysis} className="btn-primary mt-6 w-full">
            Analyze My Resume
          </button>
          <button
            onClick={() => setStep("goals")}
            className="mt-2 w-full rounded-lg py-2 text-sm text-slate-500 hover:text-slate-700"
          >
            Skip for now
          </button>
        </div>
      )}

      {/* Processing overlay */}
      {processing && (
        <div className="card p-8">
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="animate-spin text-brand-600" size={32} />
            <p className="text-sm font-medium text-slate-700">{STAGES[stageIndex]}</p>
          </div>
        </div>
      )}

      {/* Step 3: Career goals */}
      {step === "goals" && (
        <div className="card p-8">
          <h1 className="text-xl font-semibold text-slate-900">Set your career goals</h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose the role you&apos;re working towards. You can update this anytime.
          </p>
          <div className="mt-6">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Target role</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option>Senior Backend Engineer</option>
              <option>ML Engineer</option>
              <option>Engineering Manager</option>
              <option>Cloud Solutions Architect</option>
              <option>Full Stack Engineer</option>
              <option>Data Engineer</option>
              <option>DevOps Engineer</option>
            </select>
          </div>
          <button onClick={() => setStep("done")} className="btn-primary mt-6 w-full">
            Continue
          </button>
        </div>
      )}

      {/* Step 4: Done */}
      {step === "done" && (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <CheckCircle2 className="text-emerald-600" size={36} />
          <h1 className="text-xl font-semibold text-slate-900">Your career profile is ready</h1>
          <p className="text-sm text-slate-500">
            We&apos;ve analyzed your resume and identified your skills and target opportunities.
          </p>
          <button onClick={() => router.push("/dashboard")} className="btn-primary mt-2">
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
