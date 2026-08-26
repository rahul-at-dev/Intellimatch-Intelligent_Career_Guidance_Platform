export interface Profile {
  id: string;
  full_name: string;
  current_role: string;
  target_role: string;
  years_experience: number;
  location: string;
  skills: Record<string, number>;
  resume_text: string | null;
  profile_strength: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  seniority: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  skills: string[];
  redirect_url?: string;
  source?: string;
  currency?: string;
  created_at?: string;
  job_type?: string;
  category?: string;
}

export interface MatchResult {
  job_id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  seniority: string;
  salary_min: number | null;
  salary_max: number | null;
  redirect_url?: string;
  match_score: number;
  semantic_similarity: number;
  skill_coverage: number;
  matched_skills: string[];
  missing_skills: string[];
  explanation: string | null;
}

export interface SkillGap {
  skill: string;
  current_level: number;
  required_level: number;
  gap: number;
  importance: "Critical" | "High" | "Medium" | "Low";
  market_demand: number;
}

export interface SkillGraph {
  nodes: { id: string }[];
  edges: { source: string; relation: string; target: string }[];
}

export interface RoadmapStage {
  stage: number;
  from_role: string;
  to_role: string;
  readiness: number;
  missing_skills: string[];
  estimated_effort_months: number;
  market_demand: number;
  explanation: string;
}

export interface CareerPrediction {
  role: string;
  readiness: number;
  missing_skills: string[];
  transition_effort: "Low" | "Medium" | "High";
  is_ml_prediction: boolean;
}

export interface SimulationResult {
  skills_added: string[];
  baseline: { avg_match_score: number; opportunities: number };
  projected: { avg_match_score: number; opportunities: number };
  additional_opportunities: number;
  career_paths_unlocked: string[];
  estimated_learning_effort_hours: number;
  disclaimer: string;
}

export interface SkillRoi {
  skill: string;
  roi: number;
  demand: number;
  jobs_affected: number;
  difficulty: number;
  current_gap: number;
}

export interface LearningStage {

  name: string;
  duration_hours: number;
  description: string;
  topics: string[];
  deliverables: string[];
}

export interface LearningPathItem {
  skill: string;
  objective: string;
  estimated_hours: number;
  current_level?: number;
  required_level?: number;
  gap?: number;
  market_demand_pct?: number;
  target_role?: string;
  stages?: LearningStage[];
  prerequisites?: string[];
  resources: { title: string; provider: string; hours: number; type: string }[];
  project: string;
  project_title?: string;
  project_description?: string;
  project_skills?: string[];
  assessment: string;
  assessment_topics?: string[];
  disclaimer?: string;
}


export interface AssessmentQuestionItem {
  type: string;
  prompt: string;
  options?: string[];
  correct_answer?: number;
  explanation?: string;
}

export interface AssessmentResultItem {
  score: number;
  correct_count?: number;
  total_questions?: number;
  breakdown: {
    question: string;
    score: number;
    is_correct?: boolean;
    explanation?: string;
  }[];
}

export interface InterviewQuestionItem {
  type: string;
  prompt: string;
  context?: string;
  suggested_approach?: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  categories: string[];
  website: string;
  careers_url: string;
  interview_guide_url: string;
  difficulty: "Very High" | "High" | "Medium-High" | "Medium" | string;
  preparation_areas: string[];
  interview_rounds: string[];
  behavioral_focus: string;
  technical_focus: string;
  company_principles: string[];
  verified_source: string;
  verified_date: string;
}

export interface CompanyPrepPlan {
  company: CompanyProfile;
  target_role: string;
  readiness_score: number;
  readiness_breakdown: {
    dsa: number;
    system_design: number;
    behavioral: number;
    role_fit: number;
  };
  strong_skills: string[];
  skill_gaps: string[];
  roadmap_stages: {
    step: string;
    title: string;
    focus: string;
    color: string;
    duration: string;
  }[];
  checklist: {
    id: string;
    text: string;
    completed: boolean;
  }[];
  interview_rounds: string[];
  company_principles: string[];
}

export interface CompanyQuestion {
  id: string;
  title: string;
  category: "DSA" | "System Design" | "Behavioral" | "Role-Specific" | string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  topic: string;
  priority: "High Priority" | "Medium Priority" | "Recommended" | string;
  source: string;
  source_url: string;
  description: string;
  key_concepts: string[];
  companies?: string[];
}

export interface CompanyPracticeQuestion {
  category: string;
  prompt: string;
  difficulty: string;
  relevance: string;
  suggested_approach: string;
}

export interface MockInterviewSession {
  session_id: string;
  company_name: string;
  target_role: string;
  round_type: string;
  initial_message: string;
}

export interface MockEvaluationResult {
  overall_score: number;
  technical_accuracy: number;
  problem_solving: number;
  communication: number;
  role_fit: number;
  strengths: string[];
  areas_to_improve: string[];
  recommended_actions: string[];
}



export interface GithubResult {
  username: string;
  source: string;
  repo_count: number;
  languages: string[];
  repos: { name: string; language: string; topics: string[] }[];
  skill_map: Record<string, string>;
  disclaimer: string;
}

export interface SalaryTrendPoint {
  date: string;
  label: string;
  average_salary: number;
}

export interface SalaryDistributionBucket {
  range_label: string;
  min_salary: number;
  max_salary: number | null;
  count: number;
}

export interface TopCompanyItem {
  name: string;
  count: number;
  average_salary: number | null;
}

export interface TopLocationItem {
  location: string;
  count: number;
}

export interface SkillInDemandItem {
  skill: string;
  demand_percentage: number;
  job_count: number;
}

export interface MarketAlignmentSkill {
  skill: string;
  demand_percentage: number;
}

export interface MarketAlignmentData {
  score: number;
  strong_skills: MarketAlignmentSkill[];
  gap_skills: MarketAlignmentSkill[];
  summary: string;
  matched_count: number;
  gap_count: number;
  total_evaluated: number;
}

export interface MarketSkillPriority {
  skill: string;
  demand_percentage: number;
  priority: "High" | "Medium" | "Low";
  reason: string;
}

export interface MarketInsights {
  role: string;
  location: string;
  country: string;
  currency: string;
  currency_symbol: string;
  job_count: number;
  average_salary: number | null;
  salary_growth_percentage: number | null;
  trend_direction: "up" | "down" | "stable";
  salary_trend: SalaryTrendPoint[];
  salary_distribution: SalaryDistributionBucket[];
  top_companies: TopCompanyItem[];
  top_locations: TopLocationItem[];
  skills_in_demand: SkillInDemandItem[];
  sample_size: number;
  market_alignment: MarketAlignmentData | null;
  skill_priorities: MarketSkillPriority[];
  data_source: string;
  last_updated: string;
  is_cached?: boolean;
  cache_age_seconds?: number;
}


export interface AssistantResponse {
  type: string;
  data: unknown;
  message: string;
}

export interface RecruiterSearchResult {
  parsed_filters: { skills: string[]; location: string | null; min_years: number | null };
  candidates: {
    id: string;
    name: string;
    match_score: number;
    current_role: string;
    years_experience: number;
  }[];
}

export interface AdminMetrics {
  users: number;
  jobs: number;
  applications: number;
  ai_requests_today: number;
  model_performance: Record<string, number>;
  system_health: Record<string, number>;
}

export interface StructuredResumeData {
  personal_info: {
    name: string;
    email: string;
    phone: string;
    location: string;
    websites: string[];
    summary: string;
  };
  skills: string[];
  education: {
    institution: string;
    degree: string;
    dates: string;
    grade?: string;
  }[];
  experience: {
    title: string;
    company: string;
    dates: string;
    location?: string;
    description: string;
  }[];
  projects: {
    name: string;
    description: string;
    skills: string[];
  }[];
  certifications: {
    name: string;
    issuer?: string;
    dates?: string;
  }[];
  languages: string[];
  total_experience_years: number;
  raw_text?: string;
}

export interface AtsBreakdown {
  skill_match: number;
  experience_match: number;
  keyword_match: number;
  education_match: number;
  structure_score: number;
}

export interface PrioritySkill {
  skill: string;
  priority: "High" | "Medium" | "Low";
  reason: string;
}

export interface ResumeSkillGapResult {
  matched_skills: string[];
  missing_skills: string[];
  skill_gap_percentage: number;
  priority_skills: PrioritySkill[];
}

export interface ResumeAnalysis {
  file_name: string;
  ats_score: number;
  mode: "resume_only" | "resume_and_job";
  breakdown: AtsBreakdown;
  weights: Record<string, number>;
  structured_data: StructuredResumeData;
  skills_found: string[];
  matched_skills: string[];
  missing_skills: string[];
  matched_keywords?: string[];
  missing_keywords?: string[];
  skill_gap: ResumeSkillGapResult;
  recommendations: string[];
  missing_information: string[];
  profile_strength: number;
  raw_text_preview: string;
  sections_detected: string[];
  disclaimer: string;
}
