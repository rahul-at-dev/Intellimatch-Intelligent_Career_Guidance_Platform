import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Compass,
  FileCheck,
  GitGraph,
  Github,
  LineChart,
  Lock,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: FileCheck,
    badge: "Affinda + ATS Engine",
    title: "Resume Analysis & ATS Scoring",
    desc: "Parse PDF/DOCX resumes with Affinda's document AI, normalize skills, and calculate a transparent 5-factor ATS compatibility score.",
  },
  {
    icon: BrainCircuit,
    badge: "LightGBM + Vector Search",
    title: "Intelligent Job Matching",
    desc: "Hybrid semantic search combined with a machine-learned ranking model to recommend jobs that genuinely match your capabilities.",
  },
  {
    icon: GitGraph,
    badge: "Deterministic Gap Engine",
    title: "Skill Gap & Priority Roadmap",
    desc: "Identify missing competencies separating you from your target role, with priority weighting based on real market demand.",
  },
  {
    icon: Compass,
    badge: "Predictive Analytics",
    title: "Career Path Simulation",
    desc: "Simulate 'what-if' skill acquisition scenarios to project market readiness and unlocked job opportunities before investing study hours.",
  },
  {
    icon: Github,
    badge: "Proof of Work",
    title: "GitHub Skill Verification",
    desc: "Validate claimed technical skills against public GitHub repository codebases, languages, and commit evidence.",
  },
  {
    icon: LineChart,
    badge: "Real-time Trends",
    title: "Market Intelligence",
    desc: "Explore live demand metrics across technical roles, regional salary distributions, and rapidly emerging technologies.",
  },
];

const steps = [
  {
    num: "01",
    title: "Upload Your Resume",
    desc: "Upload any PDF or DOCX file. Our Affinda integration extracts structured experience, education, and skills with high accuracy.",
  },
  {
    num: "02",
    title: "Get ATS & Skill Gap Scores",
    desc: "Our ATS engine calculates your compatibility score (0–100) and highlights high-impact missing skills.",
  },
  {
    num: "03",
    title: "Match & Accelerate",
    desc: "Discover ranked job opportunities, simulate career trajectories, and follow personalized learning roadmaps.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fcfbfe] text-slate-900 selection:bg-brand-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 font-bold text-white shadow-md shadow-brand-500/20">
              I
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900">IntelliMatch AI</span>
              <span className="text-[10px] font-medium text-brand-600 uppercase tracking-wider">Career Intelligence</span>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/resume-analysis" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
              Resume Analysis
            </Link>
            <Link href="/jobs" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
              Explore Jobs
            </Link>
            <Link href="/market-insights" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
              Market Insights
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <SignedIn>
              <Link href="/dashboard" className="rounded-lg bg-slate-100 px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Sign in
              </Link>
              <Link href="/sign-up" className="btn-primary shadow-sm shadow-brand-500/20">
                Get Started Free
              </Link>
            </SignedOut>
          </div>
        </div>
      </header>

      {/* Hero Section with Prominent Box Showcase */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f7f4ee]/80 via-white to-slate-50 pt-12 pb-20 sm:pt-16 sm:pb-28">
        {/* Subtle decorative background ambient glow */}
        <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute top-20 left-10 -z-10 h-72 w-72 rounded-full bg-amber-100/60 blur-3xl" />

        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Column: Hero Text & CTAs */}
            <div className="text-center lg:col-span-7 lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-xs font-semibold text-brand-700 shadow-sm">
                <Sparkles size={14} className="text-brand-600" />
                <span>AI-Driven Resume Parsing & Career Growth</span>
              </div>

              {/* Headline */}
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.15]">
                Understand your potential.{" "}
                <span className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-600 bg-clip-text text-transparent">
                  Accelerate your career.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-5 text-base text-slate-600 sm:text-lg sm:leading-relaxed">
                IntelliMatch AI combines <strong>Affinda document intelligence</strong>, transparent <strong>ATS scoring</strong>, 
                machine-learned job matching, and career simulation to help you understand your skill strengths, close gaps, and land target roles.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                <SignedIn>
                  <Link href="/dashboard" className="btn-primary w-full sm:w-auto px-7 py-3 text-base shadow-lg shadow-brand-500/25 hover:shadow-brand-500/35">
                    Go to Dashboard <ArrowRight size={18} />
                  </Link>
                  <Link href="/resume-analysis" className="btn-secondary w-full sm:w-auto px-6 py-3 text-base">
                    Analyze Resume
                  </Link>
                </SignedIn>
                <SignedOut>
                  <Link href="/resume-analysis" className="btn-primary w-full sm:w-auto px-7 py-3 text-base shadow-lg shadow-brand-500/25 hover:shadow-brand-500/35">
                    Analyze Resume Free <ArrowRight size={18} />
                  </Link>
                  <Link href="/sign-up" className="btn-secondary w-full sm:w-auto px-6 py-3 text-base">
                    Create Account
                  </Link>
                </SignedOut>
              </div>

              {/* Micro Trust Indicators */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500 sm:gap-8 lg:justify-start">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-amber-500" />
                  <span>Affinda Optical Extraction</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-emerald-500" />
                  <span>Explainable ATS Scoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-brand-500" />
                  <span>Clerk Security</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Box Showcase */}
            <div className="relative mx-auto w-full max-w-lg lg:col-span-5 lg:max-w-none">
              {/* Outer decorative glow */}
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-brand-500/20 to-amber-500/20 blur-xl opacity-75" />

              {/* Image Frame Card */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200/90 bg-white p-3 shadow-2xl shadow-slate-300/60">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
                  <Image
                    src="/career-growth-or-career-development-impr.jpg"
                    alt="Career Growth and Development Pathway"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-contain object-center"
                  />
                </div>

                {/* Floating Badge 1: Top-Right ATS Score */}
                <div className="absolute -top-3 -right-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-sm animate-bounce [animation-duration:4s]">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">ATS Compatibility</p>
                    <p className="text-sm font-bold text-slate-900">88/100 <span className="text-[10px] text-emerald-600 font-semibold">Strong</span></p>
                  </div>
                </div>

                {/* Floating Badge 2: Bottom-Left Skill Match */}
                <div className="absolute -bottom-3 -left-3 flex items-center gap-2 rounded-xl border border-brand-200 bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Skill Gap Engine</p>
                    <p className="text-xs font-bold text-slate-900">92% Target Match</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Snapshot Metrics Bar */}
      <section className="relative z-20 mx-auto -mt-6 max-w-6xl px-6">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-200/60">
          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-6 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">ATS Readiness Engine</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                85<span className="text-lg text-slate-400">/100</span>
              </p>
              <p className="mt-1 text-xs text-emerald-600 font-medium">5-factor explainable score breakdown</p>
            </div>
            <div className="p-6 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Role Opportunities</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">Top 10</p>
              <p className="mt-1 text-xs text-brand-600 font-medium">Ranked via LightGBM ML model</p>
            </div>
            <div className="p-6 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Skill Taxonomy Coverage</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">100%</p>
              <p className="mt-1 text-xs text-indigo-600 font-medium">Canonical normalized mapping</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-20">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Simple 3-Step Flow</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How IntelliMatch AI Works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
            From raw resume document to personalized career trajectory in seconds.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.num} className="relative rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm hover:shadow-md transition-shadow">
              <span className="text-3xl font-extrabold text-brand-100">{s.num}</span>
              <h3 className="mt-2 text-lg font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Full Feature Stack */}
      <section className="border-t border-slate-200/80 bg-gradient-to-b from-white to-slate-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Comprehensive Suite</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Complete Career Intelligence Architecture
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
              Purpose-built tools empowering students and developers to excel in technical hiring.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-500/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    <f.icon size={22} />
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                    {f.badge}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-indigo-950 px-8 py-16 text-center text-white shadow-2xl">
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to optimize your career path?
            </h2>
            <p className="mt-4 text-sm text-brand-100">
              Analyze your resume, test your ATS score, and receive personalized skill development pathways today.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/resume-analysis"
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-900 shadow-md hover:bg-brand-50 transition-colors"
              >
                Start Resume Analysis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-6 space-y-3">
          <p className="font-medium text-slate-600">
            IntelliMatch AI assists career discovery. Humans remain responsible for final career and hiring decisions.
          </p>
          <p className="text-slate-400">
            © 2026 IntelliMatch AI. Built with Next.js, FastAPI, Affinda & Clerk.
          </p>
        </div>
      </footer>
    </div>
  );
}
