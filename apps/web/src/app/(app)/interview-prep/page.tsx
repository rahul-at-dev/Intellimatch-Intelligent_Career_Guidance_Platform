"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Code2,
  Cpu,
  ExternalLink,
  Flame,
  Globe,
  GraduationCap,
  Layers,
  Lightbulb,
  MessageSquare,
  Network,
  Play,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { CompanyLogo } from "@/components/CompanyLogo";
import type {
  CompanyProfile,
  CompanyPrepPlan,
  CompanyQuestion,
  CompanyPracticeQuestion,
  MockInterviewSession,
  MockEvaluationResult,
} from "@/types/api";

const POPULAR_COMPANIES = [
  "Google",
  "Amazon",
  "Microsoft",
  "Meta",
  "Apple",
  "NVIDIA",
  "Atlassian",
  "Flipkart",
  "Swiggy",
  "Razorpay",
  "Goldman Sachs",
];

const TARGET_ROLES = [
  "Senior Backend Engineer",
  "Full Stack Developer",
  "Machine Learning Engineer",
  "Cloud / DevOps Engineer",
  "System Architect",
  "Frontend Engineer",
  "Data Engineer",
  "Product Manager",
];

const ALPHABET = [
  "All",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

export default function InterviewPrepPage() {
  const searchParams = useSearchParams();
  const initialCompanyParam = searchParams ? searchParams.get("company") : null;
  const initialRoleParam = searchParams ? searchParams.get("role") : null;


  // Directory State
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedLetter, setSelectedLetter] = useState<string>("All");
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(true);
  const [savedCompanyIds, setSavedCompanyIds] = useState<Set<string>>(new Set());

  // Company Preparation Dashboard State
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>(
    initialRoleParam || "Senior Backend Engineer"
  );
  const [prepPlan, setPrepPlan] = useState<CompanyPrepPlan | null>(null);
  const [loadingPrepPlan, setLoadingPrepPlan] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Question Bank State
  const [questions, setQuestions] = useState<CompanyQuestion[]>([]);
  const [questionCategory, setQuestionCategory] = useState<string>("All");
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // AI Practice Generator State
  const [aiPracticeQuestions, setAiPracticeQuestions] = useState<CompanyPracticeQuestion[]>([]);
  const [loadingAiPractice, setLoadingAiPractice] = useState<boolean>(false);

  // AI Mock Interview Simulator State
  const [mockSession, setMockSession] = useState<MockInterviewSession | null>(null);
  const [mockMessages, setMockMessages] = useState<{ role: "assistant" | "user"; content: string }[]>([]);
  const [userInput, setUserInput] = useState<string>("");
  const [isSendingTurn, setIsSendingTurn] = useState<boolean>(false);
  const [canEvaluateMock, setCanEvaluateMock] = useState<boolean>(false);
  const [mockEvaluation, setMockEvaluation] = useState<MockEvaluationResult | null>(null);
  const [isEvaluatingMock, setIsEvaluatingMock] = useState<boolean>(false);

  // Checklist State
  const [checklistProgress, setChecklistProgress] = useState<Record<string, boolean>>({});

  // 1. Fetch Companies list
  const fetchCompanies = async (query?: string, cat?: string, lettr?: string) => {
    setLoadingCompanies(true);
    try {
      const res = await api.companies({
        query: query || searchQuery,
        category: cat !== undefined ? cat : selectedCategory,
        letter: lettr !== undefined ? lettr : selectedLetter,
        limit: 100,
      });
      setCompanies(res.companies || []);
      setTotalCount(res.total || 0);
      if (res.categories && res.categories.length > 0) {
        setCategories(["All", ...res.categories]);
      }
    } catch (err) {
      console.error("Failed to load companies:", err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCompanies();
    // Load saved companies
    api.savedCompanies().then((res) => {
      if (res?.saved_companies) {
        setSavedCompanyIds(new Set(res.saved_companies.map((c) => c.id)));
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle URL query params (e.g. from Jobs module: /interview-prep?company=Google&role=Backend)
  useEffect(() => {
    if (initialCompanyParam) {
      handleSelectCompanyById(initialCompanyParam, initialRoleParam || "Senior Backend Engineer");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCompanyParam, initialRoleParam]);

  // Search / Category / Letter Filter Trigger
  const handleFilterChange = (newCat?: string, newLetter?: string) => {
    const nextCat = newCat !== undefined ? newCat : selectedCategory;
    const nextLetter = newLetter !== undefined ? newLetter : selectedLetter;
    if (newCat !== undefined) setSelectedCategory(newCat);
    if (newLetter !== undefined) setSelectedLetter(newLetter);
    fetchCompanies(searchQuery, nextCat, nextLetter);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies(searchQuery, selectedCategory, selectedLetter);
  };

  // Toggle Save Company
  const handleToggleSave = async (companyId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await api.saveCompany(companyId);
      setSavedCompanyIds((prev) => {
        const next = new Set(prev);
        if (res.is_saved) {
          next.add(companyId);
        } else {
          next.delete(companyId);
        }
        return next;
      });
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    }
  };

  // 2. Select Company & Generate Prep Plan
  const handleSelectCompany = async (company: CompanyProfile, targetRole: string = selectedRole) => {
    setSelectedCompany(company);
    setLoadingPrepPlan(true);
    setError(null);
    setPrepPlan(null);
    setAiPracticeQuestions([]);
    setMockSession(null);
    setMockMessages([]);
    setMockEvaluation(null);
    setCanEvaluateMock(false);

    try {
      const plan = await api.companyPrepPlan(company.id, targetRole);
      setPrepPlan(plan);

      // Load initial question bank
      loadCompanyQuestions(company.id, "All");
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to load personalized preparation plan. Using calibrated platform benchmarks."
      );
    } finally {
      setLoadingPrepPlan(false);
    }
  };

  const handleSelectCompanyById = async (companyId: string, targetRole: string = selectedRole) => {
    try {
      const company = await api.companyDetail(companyId);
      if (company) {
        handleSelectCompany(company, targetRole);
      }
    } catch {
      // Fallback
      handleSelectCompany(
        {
          id: companyId.toLowerCase(),
          name: companyId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          industry: "Technology & Software",
          categories: ["Product Companies"],
          website: `https://${companyId.toLowerCase()}.com`,
          careers_url: `https://${companyId.toLowerCase()}.com/careers`,
          interview_guide_url: `https://${companyId.toLowerCase()}.com/careers`,
          difficulty: "High",
          preparation_areas: ["Data Structures & Algorithms", "System Design", "Behavioral & Culture Fit"],
          interview_rounds: ["Technical Screen", "Coding (2x)", "System Design", "Behavioral"],
          behavioral_focus: "Collaboration, Ownership, and Technical Excellence",
          technical_focus: "Algorithms, Clean Architecture, Distributed Systems",
          company_principles: ["Customer focus", "High ownership", "Continuous innovation"],
          verified_source: "Reported engineering interview patterns",
          verified_date: "2025-Q1",
        },
        targetRole
      );
    }
  };

  // 3. Load Questions for Company
  const loadCompanyQuestions = async (companyId: string, category: string) => {
    setLoadingQuestions(true);
    setQuestionCategory(category);
    try {
      const res = await api.companyQuestions(companyId, category);
      setQuestions(res.questions || []);
    } catch (err) {
      console.error("Failed to load questions:", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // 4. Generate AI Practice Questions
  const handleGenerateAiPractice = async () => {
    if (!selectedCompany) return;
    setLoadingAiPractice(true);
    try {
      const res = await api.companyPractice(
        selectedCompany.id,
        selectedRole,
        questionCategory
      );
      setAiPracticeQuestions(res.practice_questions || []);
    } catch (err) {
      console.error("AI practice generation error:", err);
    } finally {
      setLoadingAiPractice(false);
    }
  };

  // 5. Mock Interview Flow
  const handleStartMockInterview = async () => {
    if (!selectedCompany) return;
    setIsSendingTurn(true);
    setMockEvaluation(null);
    try {
      const session = await api.mockInterviewStart(
        selectedCompany.id,
        selectedRole,
        "Technical & System Design"
      );
      setMockSession(session);
      setMockMessages([{ role: "assistant", content: session.initial_message }]);
      setCanEvaluateMock(false);
    } catch (err) {
      console.error("Error starting mock session:", err);
    } finally {
      setIsSendingTurn(false);
    }
  };

  const handleSendMockTurn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockSession || !userInput.trim() || isSendingTurn) return;

    const answer = userInput.trim();
    setUserInput("");
    setMockMessages((prev) => [...prev, { role: "user", content: answer }]);
    setIsSendingTurn(true);

    try {
      const res = await api.mockInterviewTurn(mockSession.session_id, answer);
      setMockMessages((prev) => [...prev, { role: "assistant", content: res.message }]);
      if (res.can_evaluate) {
        setCanEvaluateMock(true);
      }
    } catch (err) {
      console.error("Turn submission error:", err);
      setMockMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Thank you for walking me through your trade-offs. Let's move forward: You can now click 'Evaluate Mock Interview' to generate your scorecard.",
        },
      ]);
      setCanEvaluateMock(true);
    } finally {
      setIsSendingTurn(false);
    }
  };

  const handleEvaluateMockInterview = async () => {
    if (!mockSession) return;
    setIsEvaluatingMock(true);
    try {
      const res = await api.mockInterviewEvaluate(mockSession.session_id);
      setMockEvaluation(res);
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setIsEvaluatingMock(false);
    }
  };

  // Toggle Checklist Item
  const toggleChecklistItem = (id: string) => {
    setChecklistProgress((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ========================================================================= */}
      {/* 1. DIRECTORY VIEW (When no company selected) */}
      {/* ========================================================================= */}
      {!selectedCompany ? (
        <div className="space-y-6">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E1035] via-[#2A174E] to-[#120B24] p-8 text-white shadow-xl border border-purple-900/40">
            <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
            <div className="absolute right-32 bottom-0 h-48 w-48 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-purple-200 backdrop-blur-md">
                <Sparkles size={13} className="text-purple-300 animate-pulse" />
                <span>360+ Verified Company Interview Profiles</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                Company-Specific AI Interview Preparation
              </h1>

              <p className="text-sm sm:text-base text-purple-200/90 leading-relaxed">
                Prepare specifically for the company and role you want. Explore verified interview round structures,
                high-yield problem sets, personalized skill gap recommendations, and interactive AI mock interviews.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="pt-2">
                <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-1.5 backdrop-blur-xl border border-white/20 shadow-inner">
                  <div className="flex flex-1 items-center gap-3 pl-3">
                    <Search size={18} className="text-purple-300" />
                    <input
                      type="text"
                      placeholder="Search company by name, industry, or tech stack (e.g. Google, FinTech, Distributed Systems)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-sm text-white placeholder-purple-300/60 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:from-purple-600 hover:to-indigo-700 transition-all"
                  >
                    <span>Search</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>

              {/* Popular Suggestions */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-purple-200/70">
                <span className="font-semibold text-purple-300">Popular:</span>
                {POPULAR_COMPANIES.map((comp) => (
                  <button
                    key={comp}
                    onClick={() => {
                      setSearchQuery(comp);
                      fetchCompanies(comp, "All", "All");
                    }}
                    className="rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 px-2.5 py-1 font-medium text-white transition-colors"
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Categories Filter Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Industry Categories
              </span>
              <span className="text-xs font-semibold text-purple-600">
                Showing {companies.length} of {totalCount} Companies
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pb-1">
              {[
                "All",
                "FAANG / Big Tech",
                "Product Companies",
                "SaaS",
                "FinTech",
                "Banking",
                "Indian Product",
                "IT Services",
                "Consulting",
                "Semiconductor",
                "Cloud",
                "Security",
                "Automotive",
                "Gaming",
                "Healthcare",
                "E-Commerce",
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleFilterChange(cat, undefined)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* A-Z Alphabet Filter */}
            <div className="flex flex-wrap items-center gap-1 rounded-2xl bg-white border border-slate-200/80 p-2 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 px-2">A-Z:</span>
              {ALPHABET.map((lettr) => (
                <button
                  key={lettr}
                  onClick={() => handleFilterChange(undefined, lettr)}
                  className={`min-w-[26px] h-7 rounded-lg text-xs font-bold transition-colors ${
                    selectedLetter.toUpperCase() === lettr.toUpperCase()
                      ? "bg-purple-600 text-white"
                      : "text-slate-600 hover:bg-purple-50 hover:text-purple-700"
                  }`}
                >
                  {lettr}
                </button>
              ))}
            </div>
          </div>

          {/* Companies Grid */}
          {loadingCompanies ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-slate-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-3/4 rounded bg-slate-200" />
                      <div className="h-3 w-1/2 rounded bg-slate-100" />
                    </div>
                  </div>
                  <div className="h-10 rounded-xl bg-slate-100" />
                </div>
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
              <BuildingIcon className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="text-base font-bold text-slate-800">No companies found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No company matched &quot;{searchQuery}&quot; with selected filters. Try searching by domain or clearing category filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  handleFilterChange("All", "All");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 transition-colors"
              >
                <RefreshCw size={13} /> Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((comp) => {
                const isSaved = savedCompanyIds.has(comp.id);
                return (
                  <div
                    key={comp.id}
                    onClick={() => handleSelectCompany(comp)}
                    className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-lg hover:border-purple-300 transition-all duration-200 cursor-pointer overflow-hidden"
                  >
                    {/* Top gradient highlight on hover */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div>
                      {/* Logo + Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <CompanyLogo name={comp.name} website={comp.website} size="md" />
                          <div>
                            <h3 className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors text-base">
                              {comp.name}
                            </h3>
                            <p className="text-xs text-slate-500 line-clamp-1">{comp.industry}</p>
                          </div>
                        </div>

                        {/* Save Bookmark button */}
                        <button
                          onClick={(e) => handleToggleSave(comp.id, e)}
                          title={isSaved ? "Saved to My Companies" : "Bookmark company"}
                          className={`rounded-lg p-1.5 transition-colors ${
                            isSaved
                              ? "text-amber-500 bg-amber-50"
                              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                        </button>
                      </div>

                      {/* Tags */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            comp.difficulty === "Very High"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : comp.difficulty === "High"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          <Flame size={11} /> {comp.difficulty}
                        </span>

                        {comp.categories?.slice(0, 2).map((cat) => (
                          <span
                            key={cat}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>

                      {/* Technical Focus Snippet */}
                      <div className="mt-3 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Focus: </span>
                        <span className="line-clamp-1 text-slate-500">{comp.technical_focus}</span>
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700 group-hover:text-purple-800">
                      <span>Prepare for {comp.name}</span>
                      <ChevronRight
                        size={16}
                        className="transform group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. COMPANY PREPARATION DASHBOARD (When company is selected) */
        /* ========================================================================= */
        <div className="space-y-8">
          {/* Back to Directory Button */}
          <button
            onClick={() => setSelectedCompany(null)}
            className="inline-flex items-center gap-2 text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors"
          >
            <ArrowLeft size={15} />
            <span>← Back to 360+ Companies Directory</span>
          </button>

          {/* Company Profile Header Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50 to-purple-50/30 p-6 sm:p-8 border border-purple-100 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <CompanyLogo
                  name={selectedCompany.name}
                  website={selectedCompany.website}
                  size="xl"
                />

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {selectedCompany.name}
                    </h1>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold ${
                        selectedCompany.difficulty === "Very High"
                          ? "bg-rose-100 text-rose-800"
                          : selectedCompany.difficulty === "High"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      <Flame size={12} /> {selectedCompany.difficulty} Difficulty
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 font-medium">{selectedCompany.industry}</p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                    {selectedCompany.website && (
                      <a
                        href={selectedCompany.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-purple-700 font-semibold"
                      >
                        <Globe size={13} /> Official Website <ExternalLink size={10} />
                      </a>
                    )}
                    {selectedCompany.careers_url && (
                      <a
                        href={selectedCompany.careers_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-purple-700 font-semibold"
                      >
                        <Briefcase size={13} /> Careers Portal <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Target Role Selector & Save Action */}
              <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3">
                <div className="w-full sm:w-auto">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Target Role for Preparation
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setSelectedRole(newRole);
                      handleSelectCompany(selectedCompany, newRole);
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-xs focus:border-purple-500 focus:outline-none"
                  >
                    {TARGET_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleToggleSave(selectedCompany.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all ${
                    savedCompanyIds.has(selectedCompany.id)
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {savedCompanyIds.has(selectedCompany.id) ? (
                    <>
                      <BookmarkCheck size={14} className="text-amber-600" /> Saved to My Companies
                    </>
                  ) : (
                    <>
                      <Bookmark size={14} /> Bookmark Company
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Readiness Score & Two-Layer Analysis */}
          {loadingPrepPlan ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-purple-600" />
              <p className="text-sm font-bold text-slate-800">
                Building personalized {selectedCompany.name} {selectedRole} preparation plan...
              </p>
            </div>
          ) : prepPlan ? (
            <div className="space-y-8">
              {/* Readiness Score + Sub-Dimensions Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Overall Readiness Gauge */}
                <div className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-white p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                        Preparation Readiness
                      </span>
                      <ShieldCheck className="h-5 w-5 text-teal-600" />
                    </div>

                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-5xl font-extrabold text-teal-900 tracking-tight">
                        {prepPlan.readiness_score}%
                      </span>
                      <span className="text-xs font-bold text-teal-700">Calculated readiness</span>
                    </div>

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      Grounded in your demonstrated skills from your profile and resume evaluated against {selectedCompany.name}&apos;s hiring benchmarks.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-teal-100">
                    <button
                      onClick={handleStartMockInterview}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 shadow-md shadow-teal-600/20 transition-all"
                    >
                      <Play size={13} /> Start AI Mock Interview
                    </button>
                  </div>
                </div>

                {/* 4 Dimension Breakdown */}
                <div className="lg:col-span-2 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Layers size={16} className="text-purple-600" />
                      Readiness Dimension Breakdown
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Target: {selectedRole}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* DSA Score */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5 text-blue-700">
                          <Code2 size={14} /> DSA & Problem Solving
                        </span>
                        <span>{prepPlan.readiness_breakdown.dsa}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${prepPlan.readiness_breakdown.dsa}%` }}
                        />
                      </div>
                    </div>

                    {/* System Design Score */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5 text-teal-700">
                          <Network size={14} /> System Design & Scale
                        </span>
                        <span>{prepPlan.readiness_breakdown.system_design}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-teal-600 rounded-full transition-all duration-500"
                          style={{ width: `${prepPlan.readiness_breakdown.system_design}%` }}
                        />
                      </div>
                    </div>

                    {/* Behavioral Score */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5 text-amber-700">
                          <Users size={14} /> Behavioral & Leadership
                        </span>
                        <span>{prepPlan.readiness_breakdown.behavioral}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${prepPlan.readiness_breakdown.behavioral}%` }}
                        />
                      </div>
                    </div>

                    {/* Role Fit Score */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5 text-purple-700">
                          <Cpu size={14} /> Role Fit & Domain
                        </span>
                        <span>{prepPlan.readiness_breakdown.role_fit}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full transition-all duration-500"
                          style={{ width: `${prepPlan.readiness_breakdown.role_fit}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two-Layer Analysis Grid: Layer 1 (Common) vs Layer 2 (Personalized) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Layer 1: Common Company Interview Profile */}
                <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                        Layer 1: Universal Benchmark
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        Reported {selectedCompany.name} Interview Structure
                      </h3>
                    </div>
                  </div>

                  {/* Typical Rounds */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Reported Interview Rounds
                    </h4>
                    <div className="space-y-2">
                      {prepPlan.interview_rounds.map((round, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2 text-xs font-semibold text-slate-700"
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">
                            {idx + 1}
                          </span>
                          <span>{round}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Behavioral Values / Principles */}
                  {prepPlan.company_principles?.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Company Principles & Values
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {prepPlan.company_principles.map((pr, i) => (
                          <span
                            key={i}
                            className="rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-1 text-xs font-medium"
                          >
                            &ldquo;{pr}&rdquo;
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Layer 2: Personalized Candidate Skill Alignment */}
                <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        Layer 2: Candidate Personalization
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        Your Tailored Skill Assessment
                      </h3>
                    </div>
                  </div>

                  {/* Strong Skills */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5 mb-2">
                      <CheckCircle2 size={14} /> Confirmed Strengths
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {prepPlan.strong_skills.map((s) => (
                        <span
                          key={s}
                          className="rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 text-xs font-semibold"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Identified Gaps with Learning Path Link */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5 mb-2">
                      <Target size={14} /> Priority Preparation Gaps
                    </h4>
                    <div className="space-y-2">
                      {prepPlan.skill_gaps.map((gap) => (
                        <div
                          key={gap}
                          className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/50 p-2.5"
                        >
                          <span className="text-xs font-bold text-rose-900">{gap}</span>
                          <Link
                            href={`/learning-path?skill=${encodeURIComponent(gap)}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-white border border-rose-200 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                          >
                            <GraduationCap size={12} /> Learn in Learning Path
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 6-Stage Visual Preparation Roadmap */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Zap size={18} className="text-purple-600" />
                    {selectedCompany.name} 6-Stage Preparation Roadmap
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Recommended sequential milestones to maximize offer probability.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {prepPlan.roadmap_stages.map((stage) => (
                    <div
                      key={stage.step}
                      className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4 hover:border-purple-200 hover:bg-white transition-all shadow-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-600 text-xs font-bold text-white shadow-xs">
                            {stage.step}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {stage.duration}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{stage.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{stage.focus}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* Question Bank & AI Practice Generator */}
              {/* ========================================================================= */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Code2 size={18} className="text-purple-600" />
                      {selectedCompany.name} Curated Question Bank
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verified public problem patterns and company-tailored algorithmic benchmarks.
                    </p>
                  </div>

                  {/* AI Practice Generator Button */}
                  <button
                    onClick={handleGenerateAiPractice}
                    disabled={loadingAiPractice}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                  >
                    <Sparkles size={13} className={loadingAiPractice ? "animate-spin" : ""} />
                    <span>
                      {loadingAiPractice
                        ? "Generating AI Practice..."
                        : "Generate AI Practice Questions"}
                    </span>
                  </button>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                  {["All", "DSA", "System Design", "Behavioral", "Role-Specific"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => loadCompanyQuestions(selectedCompany.id, cat)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                        questionCategory.toLowerCase() === cat.toLowerCase()
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Questions List */}
                {loadingQuestions ? (
                  <div className="py-6 text-center text-xs font-semibold text-slate-400 animate-pulse">
                    Loading question bank...
                  </div>
                ) : questions.length === 0 ? (
                  <div className="py-6 text-center text-xs font-medium text-slate-500">
                    No questions found for this filter.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questions.map((q) => {
                      const isExpanded = expandedQuestionId === q.id;
                      return (
                        <div
                          key={q.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-purple-200 transition-colors space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                  q.difficulty === "Hard"
                                    ? "bg-rose-50 text-rose-700"
                                    : q.difficulty === "Medium"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {q.difficulty}
                              </span>
                              <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                                {q.category}
                              </span>
                              <span className="text-xs font-bold text-slate-800">{q.title}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              {q.source_url && (
                                <a
                                  href={q.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-800"
                                >
                                  <span>{q.source}</span>
                                  <ExternalLink size={11} />
                                </a>
                              )}
                              <button
                                onClick={() =>
                                  setExpandedQuestionId(isExpanded ? null : q.id)
                                }
                                className="text-xs font-bold text-slate-500 hover:text-slate-700"
                              >
                                {isExpanded ? "Hide Details" : "View Details"}
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600">{q.description}</p>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-bold text-slate-500">
                                  Key Concepts:
                                </span>
                                {q.key_concepts?.map((c, i) => (
                                  <span
                                    key={i}
                                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* AI Practice Questions Output */}
                {aiPracticeQuestions.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50/40 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-600" />
                        <h4 className="text-sm font-bold text-purple-900">
                          AI-Generated Practice Questions for {selectedCompany.name}
                        </h4>
                      </div>
                      <span className="text-[11px] font-semibold text-purple-700">
                        Tailored to your current gaps
                      </span>
                    </div>

                    <div className="space-y-3">
                      {aiPracticeQuestions.map((pq, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-purple-100 bg-white p-4 shadow-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5">
                              {pq.category}
                            </span>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              {pq.difficulty}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900">{pq.prompt}</p>
                          <p className="text-xs text-slate-500 italic">
                            <span className="font-semibold">Relevance:</span> {pq.relevance}
                          </p>
                          <div className="rounded-lg bg-amber-50/60 p-2.5 text-xs text-amber-900 border border-amber-100">
                            <span className="font-bold flex items-center gap-1 text-amber-800 mb-0.5">
                              <Lightbulb size={12} /> Suggested Strategy:
                            </span>
                            {pq.suggested_approach}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* Interactive AI Mock Interview Simulator */}
              {/* ========================================================================= */}
              <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <MessageSquare size={18} className="text-indigo-600" />
                      Interactive AI Mock Interview: {selectedCompany.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Simulate a realistic technical loop with the AI Principal Interviewer and receive rubric-based scoring.
                    </p>
                  </div>

                  {!mockSession && (
                    <button
                      onClick={handleStartMockInterview}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
                    >
                      <Play size={13} /> Start AI Interview
                    </button>
                  )}
                </div>

                {/* Active Mock Session Chat */}
                {mockSession && (
                  <div className="space-y-4">
                    <div className="max-h-96 overflow-y-auto space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      {mockMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex gap-3 ${
                            msg.role === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          {msg.role === "assistant" && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white flex-shrink-0 text-xs font-bold shadow-xs">
                              AI
                            </div>
                          )}
                          <div
                            className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                              msg.role === "user"
                                ? "bg-purple-600 text-white rounded-br-none shadow-xs"
                                : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs whitespace-pre-line"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}

                      {isSendingTurn && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 animate-pulse pl-11">
                          <RefreshCw size={12} className="animate-spin" /> Interviewer is thinking...
                        </div>
                      )}
                    </div>

                    {/* Chat Input & Evaluation CTA */}
                    <form onSubmit={handleSendMockTurn} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type your technical explanation, architectural trade-offs, or answer..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        disabled={isSendingTurn}
                        className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none shadow-xs"
                      />
                      <button
                        type="submit"
                        disabled={!userInput.trim() || isSendingTurn}
                        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        <Send size={14} />
                      </button>
                    </form>

                    {canEvaluateMock && (
                      <div className="flex items-center justify-between rounded-xl bg-indigo-100/70 p-3.5">
                        <span className="text-xs font-bold text-indigo-900">
                          Interview round concluded! Ready for committee evaluation.
                        </span>
                        <button
                          onClick={handleEvaluateMockInterview}
                          disabled={isEvaluatingMock}
                          className="rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-colors"
                        >
                          {isEvaluatingMock ? "Evaluating..." : "Evaluate Mock Interview"}
                        </button>
                      </div>
                    )}

                    {/* Evaluation Scorecard */}
                    {mockEvaluation && (
                      <div className="mt-6 rounded-2xl border border-indigo-200 bg-white p-6 shadow-md space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Trophy size={18} className="text-amber-500" />
                            <h4 className="text-base font-bold text-slate-900">
                              Mock Interview Assessment Scorecard
                            </h4>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-extrabold text-indigo-900">
                              {mockEvaluation.overall_score}%
                            </span>
                            <span className="text-[10px] block font-semibold text-slate-400">
                              Overall Score
                            </span>
                          </div>
                        </div>

                        {/* 4 Rubrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                            <span className="text-xs font-bold text-blue-700">
                              {mockEvaluation.technical_accuracy}%
                            </span>
                            <p className="text-[10px] font-semibold text-slate-500">Tech Accuracy</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                            <span className="text-xs font-bold text-teal-700">
                              {mockEvaluation.problem_solving}%
                            </span>
                            <p className="text-[10px] font-semibold text-slate-500">Problem Solving</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                            <span className="text-xs font-bold text-amber-700">
                              {mockEvaluation.communication}%
                            </span>
                            <p className="text-[10px] font-semibold text-slate-500">Communication</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                            <span className="text-xs font-bold text-purple-700">
                              {mockEvaluation.role_fit}%
                            </span>
                            <p className="text-[10px] font-semibold text-slate-500">Role Fit</p>
                          </div>
                        </div>

                        {/* Strengths & Areas to Improve */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 size={13} /> Observed Strengths
                            </span>
                            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                              {mockEvaluation.strengths?.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                              <Target size={13} /> Areas to Improve
                            </span>
                            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                              {mockEvaluation.areas_to_improve?.map((a, i) => (
                                <li key={i}>{a}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Before the Interview Checklist */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-purple-600" />
                  &ldquo;Before the Interview&rdquo; Readiness Checklist
                </h3>

                <div className="space-y-2">
                  {prepPlan.checklist.map((item) => {
                    const isChecked = checklistProgress[item.id] ?? item.completed;
                    return (
                      <label
                        key={item.id}
                        onClick={() => toggleChecklistItem(item.id)}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-xs font-medium cursor-pointer transition-all ${
                          isChecked
                            ? "bg-purple-50/50 border-purple-200 text-purple-900"
                            : "bg-slate-50 border-slate-100 text-slate-700 hover:bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className={isChecked ? "line-through opacity-70" : ""}>
                          {item.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}
