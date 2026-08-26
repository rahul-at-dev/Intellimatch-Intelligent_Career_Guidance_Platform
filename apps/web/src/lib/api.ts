/**
 * API client for IntelliMatch AI backend.
 *
 * Auth: Clerk JWT is attached via window.Clerk.session.getToken() when available.
 * In demo mode (no Clerk key set), requests are unauthenticated — the backend
 * returns its demo-mode response.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    // window.Clerk is available on the global after ClerkProvider mounts.
    // getToken() returns null if the user is not signed in.
    const clerk = (window as typeof window & { Clerk?: { session?: { getToken: () => Promise<string | null> } } }).Clerk;
    const token = await clerk?.session?.getToken();
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    // Suppress any errors — auth is optional (demo mode works without it)
  }
  return {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const authHeaders = typeof window !== "undefined" ? await getAuthHeaders() : {};
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  authMe: () => request<{ authenticated: boolean; user_id: string }>("/api/auth/me"),

  profile: () => request<import("@/types/api").Profile>("/api/profile"),
  profileUpdate: (updates: Partial<import("@/types/api").Profile>) =>
    request<import("@/types/api").Profile>("/api/profile", {
      method: "POST",
      body: JSON.stringify(updates),
    }),

  jobsSearch: (body: { query?: string; location?: string; remote_only?: boolean }) =>
    request<{ count: number; jobs: import("@/types/api").Job[] }>("/api/jobs/search", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  job: (id: string) => request<import("@/types/api").Job>(`/api/jobs/${id}`),

  jobMatch: (id: string) => request<import("@/types/api").MatchResult>(`/api/jobs/${id}/match`),

  jobsSaved: () => request<{ count: number; jobs: import("@/types/api").Job[] }>("/api/jobs/saved"),

  saveJob: (id: string, job?: import("@/types/api").Job) =>
    request<{ status: string; job: import("@/types/api").Job }>(`/api/jobs/saved/${id}`, {
      method: "POST",
      body: JSON.stringify(job || {}),
    }),

  unsaveJob: (id: string) =>
    request<{ status: string; job_id: string }>(`/api/jobs/saved/${id}`, {
      method: "DELETE",
    }),

  matchingRun: (top_k = 10, explain = true) =>
    request<{ results: import("@/types/api").MatchResult[] }>("/api/matching/run", {
      method: "POST",
      body: JSON.stringify({ top_k, explain }),
    }),

  skillGap: (target_role: string) =>
    request<{ target_role: string; gaps: import("@/types/api").SkillGap[] }>(
      "/api/skills/gap-analysis",
      { method: "POST", body: JSON.stringify({ target_role }) }
    ),

  skillGraph: (root?: string) =>
    request<import("@/types/api").SkillGraph>(
      `/api/skills/graph${root ? `?root=${encodeURIComponent(root)}` : ""}`
    ),

  careerRoadmap: (current_role?: string) =>
    request<{ stages: import("@/types/api").RoadmapStage[] }>("/api/career/roadmap", {
      method: "POST",
      body: JSON.stringify({ current_role }),
    }),

  careerPredict: () =>
    request<{ predictions: import("@/types/api").CareerPrediction[] }>(
      "/api/career/predict",
      { method: "POST", body: JSON.stringify({}) }
    ),

  careerSimulate: (skills: string[]) =>
    request<import("@/types/api").SimulationResult>("/api/career/simulate", {
      method: "POST",
      body: JSON.stringify({ skills }),
    }),

  skillRoi: () =>
    request<{ ranked_skills: import("@/types/api").SkillRoi[] }>("/api/skill/roi", {
      method: "POST",
      body: JSON.stringify({}),
    }),

  learningPath: (params: string[] | { skills?: string[]; target_role?: string; current_level?: number; custom_skill?: string }) => {
    const bodyPayload = Array.isArray(params) ? { skills: params } : params;
    return request<{ paths: import("@/types/api").LearningPathItem[] }>("/api/learning/path", {
      method: "POST",
      body: JSON.stringify(bodyPayload),
    });
  },


  assessmentGenerate: (target_role: string, skill_gaps?: string[], skill?: string) =>
    request<{ target_role: string; skill?: string; questions: import("@/types/api").AssessmentQuestionItem[] }>(
      "/api/assessment/generate",
      { method: "POST", body: JSON.stringify({ target_role, skill_gaps: skill_gaps || [], skill }) }
    ),

  assessmentEvaluate: (answers: { question: string; answer?: string; user_answer?: any; correct_answer?: any; explanation?: string }[]) =>
    request<import("@/types/api").AssessmentResultItem>(
      "/api/assessment/evaluate",
      { method: "POST", body: JSON.stringify({ answers }) }
    ),

  interviewGenerate: (params?: { target_role?: string; resume_skills?: string[]; skill_gaps?: string[]; job_description?: string }) =>
    request<{ target_role: string; questions: import("@/types/api").InterviewQuestionItem[] }>(
      "/api/interview/generate",
      { method: "POST", body: JSON.stringify(params || {}) }
    ),

  // Company-Specific Interview Preparation Methods
  companies: (params?: { query?: string; category?: string; letter?: string; limit?: number; offset?: number }) => {
    const sp = new URLSearchParams();
    if (params?.query) sp.set("query", params.query);
    if (params?.category) sp.set("category", params.category);
    if (params?.letter) sp.set("letter", params.letter);
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.offset) sp.set("offset", String(params.offset));
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return request<{
      total: number;
      companies: import("@/types/api").CompanyProfile[];
      categories: string[];
      limit: number;
      offset: number;
    }>(`/api/interview/companies${qs}`);
  },

  companyDetail: (company_id: string) =>
    request<import("@/types/api").CompanyProfile>(`/api/interview/companies/${encodeURIComponent(company_id)}`),

  companyPrepPlan: (company_id: string, target_role: string = "Senior Backend Engineer") =>
    request<import("@/types/api").CompanyPrepPlan>("/api/interview/company/plan", {
      method: "POST",
      body: JSON.stringify({ company_id, target_role }),
    }),

  companyQuestions: (company_id: string, category?: string) =>
    request<{ company_id: string; questions: import("@/types/api").CompanyQuestion[] }>(
      "/api/interview/company/questions",
      {
        method: "POST",
        body: JSON.stringify({ company_id, category: category || "all" }),
      }
    ),

  companyPractice: (company_id: string, target_role: string = "Senior Backend Engineer", category: string = "All") =>
    request<{
      company_name: string;
      target_role: string;
      practice_questions: import("@/types/api").CompanyPracticeQuestion[];
    }>("/api/interview/company/practice", {
      method: "POST",
      body: JSON.stringify({ company_id, target_role, category }),
    }),

  mockInterviewStart: (
    company_id: string,
    target_role: string = "Senior Backend Engineer",
    round_type: string = "Technical & System Design"
  ) =>
    request<import("@/types/api").MockInterviewSession>("/api/interview/mock/start", {
      method: "POST",
      body: JSON.stringify({ company_id, target_role, round_type }),
    }),

  mockInterviewTurn: (session_id: string, user_answer: string) =>
    request<{ session_id: string; message: string; turns_count: number; can_evaluate: boolean }>(
      "/api/interview/mock/turn",
      {
        method: "POST",
        body: JSON.stringify({ session_id, user_answer }),
      }
    ),

  mockInterviewEvaluate: (session_id: string) =>
    request<import("@/types/api").MockEvaluationResult>("/api/interview/mock/evaluate", {
      method: "POST",
      body: JSON.stringify({ session_id }),
    }),

  savedCompanies: () =>
    request<{ saved_companies: import("@/types/api").CompanyProfile[] }>("/api/interview/saved"),

  saveCompany: (company_id: string) =>
    request<{ company_id: string; is_saved: boolean; total_saved: number }>("/api/interview/save", {
      method: "POST",
      body: JSON.stringify({ company_id }),
    }),



  githubAnalyze: (username: string) =>
    request<import("@/types/api").GithubResult>("/api/github/analyze", {
      method: "POST",
      body: JSON.stringify({ username }),
    }),

  marketInsights: (params?: {
    role?: string;
    location?: string;
    country?: string;
    force_refresh?: boolean;
  }) => {
    const sp = new URLSearchParams();
    if (params?.role) sp.set("role", params.role);
    if (params?.location) sp.set("location", params.location);
    if (params?.country) sp.set("country", params.country);
    if (params?.force_refresh) sp.set("force_refresh", "true");
    const qs = sp.toString();
    return request<import("@/types/api").MarketInsights>(`/api/market/insights${qs ? `?${qs}` : ""}`);
  },


  assistantChat: (message: string) =>
    request<import("@/types/api").AssistantResponse>("/api/assistant/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  resumeAnalyze: async (
    file?: File | null,
    jobDescription?: string,
    targetRole?: string
  ) => {
    const authHeaders = typeof window !== "undefined" ? await getAuthHeaders() : {};
    const form = new FormData();
    if (file) {
      form.append("file", file);
    }
    if (jobDescription) {
      form.append("job_description", jobDescription);
    }
    if (targetRole) {
      form.append("target_role", targetRole);
    }
    const res = await fetch(`${API_BASE}/api/resume/analyze`, {
      method: "POST",
      body: form,
      headers: authHeaders,
    });
    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `API error ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.detail || parsed.message || errMsg;
      } catch {
        errMsg = errText || errMsg;
      }
      throw new Error(errMsg);
    }
    return res.json() as Promise<import("@/types/api").ResumeAnalysis>;
  },
};
