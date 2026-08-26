from typing import Any
from pydantic import BaseModel, Field



class JobSearchRequest(BaseModel):
    query: str = ""
    location: str | None = None
    remote_only: bool = False


class MatchingRunRequest(BaseModel):
    top_k: int = Field(default=10, ge=1, le=50)
    explain: bool = True


class SkillGapRequest(BaseModel):
    target_role: str


class CareerSimulateRequest(BaseModel):
    skills: list[str] = Field(..., min_length=1, max_length=10)


class CareerRoadmapRequest(BaseModel):
    current_role: str | None = None


class SkillRoiRequest(BaseModel):
    pass


class AssessmentGenerateRequest(BaseModel):
    target_role: str = "Senior Backend Engineer"
    skill_gaps: list[str] = []
    skill: str | None = None


class AssessmentAnswer(BaseModel):
    question: str = ""
    answer: str | None = None
    user_answer: Any | None = None
    correct_answer: Any | None = None
    explanation: str | None = ""


class AssessmentEvaluateRequest(BaseModel):
    answers: list[AssessmentAnswer]


class InterviewPrepRequest(BaseModel):
    target_role: str = "Senior Backend Engineer"
    resume_skills: list[str] = []
    skill_gaps: list[str] = []
    job_description: str | None = None



class GithubAnalyzeRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=64)


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class LearningPathRequest(BaseModel):
    skills: list[str] = Field(default_factory=list, max_length=10)
    target_role: str | None = None
    current_level: float | None = None
    custom_skill: str | None = None



class AtsScoreRequest(BaseModel):
    resume_text: str = ""
    resume_skills: list[str] = []
    job_description: str | None = None


class ResumeSkillGapRequest(BaseModel):
    resume_skills: list[str] = []
    job_description: str | None = None
    target_role: str | None = None


# ---------- Company-Specific Interview Prep Schemas ----------
class CompanySearchRequest(BaseModel):
    query: str | None = None
    category: str | None = None
    letter: str | None = None
    limit: int = Field(default=60, ge=1, le=400)
    offset: int = Field(default=0, ge=0)


class CompanyPrepPlanRequest(BaseModel):
    company_id: str
    target_role: str = "Senior Backend Engineer"


class CompanyQuestionsRequest(BaseModel):
    company_id: str
    category: str | None = None


class CompanyPracticeRequest(BaseModel):
    company_id: str
    target_role: str = "Senior Backend Engineer"
    category: str = "All"


class MockInterviewStartRequest(BaseModel):
    company_id: str
    target_role: str = "Senior Backend Engineer"
    round_type: str = "Technical & System Design"


class MockInterviewTurnRequest(BaseModel):
    session_id: str
    user_answer: str = Field(..., min_length=1, max_length=4000)


class MockInterviewEvaluateRequest(BaseModel):
    session_id: str


class CompanySaveRequest(BaseModel):
    company_id: str

