from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.core.auth import get_current_user, get_optional_user
from app.core.store import demo_store
from app.data.seed_jobs import SEED_JOBS
from app.providers.github_provider import analyze_github
from app.schemas.requests import (
    AssessmentEvaluateRequest,
    AssessmentGenerateRequest,
    AssistantChatRequest,
    AtsScoreRequest,
    CareerRoadmapRequest,
    CareerSimulateRequest,
    GithubAnalyzeRequest,
    InterviewPrepRequest,
    JobSearchRequest,
    LearningPathRequest,
    MatchingRunRequest,
    ResumeSkillGapRequest,
    SkillGapRequest,
    CompanySearchRequest,
    CompanyPrepPlanRequest,
    CompanyQuestionsRequest,
    CompanyPracticeRequest,
    MockInterviewStartRequest,
    MockInterviewTurnRequest,
    MockInterviewEvaluateRequest,
    CompanySaveRequest,
)
from app.services.interview_service import interview_service


from app.services import (
    career_service,
    growth_service,
    matching_service,
    resume_service,
    skill_service,
)
from app.services.ats_engine import calculate_ats_score
from app.services.skill_gap_engine import analyze_skill_gap_against_job
from app.services.adzuna_service import adzuna_service
from app.services.market_insights_service import market_insights_service
from app.services.matching_service import compute_intellimatch_score

router = APIRouter(prefix="/api")



# ---------- Auth ----------
@router.get("/auth/me")
async def auth_me(current_user: dict = Depends(get_current_user)):
    """Return authenticated user identity."""
    return {
        "authenticated": True,
        "user_id": current_user.get("user_id") or current_user.get("sub"),
    }


# ---------- Resume ----------
@router.post("/resume/upload")
@router.post("/resume/analyze")
async def resume_analyze(
    file: UploadFile | None = File(default=None),
    job_description: str | None = Form(default=None),
    target_role: str | None = Form(default=None),
    current_user: dict = Depends(get_current_user),
):
    """Parse resume with Affinda, compute ATS score, and run skill-gap analysis."""
    file_bytes = await file.read() if file else b""
    file_name = file.filename if file else "demo-resume.pdf"
    result = await resume_service.analyze_resume(
        file_bytes=file_bytes,
        file_name=file_name,
        job_description=job_description,
        target_role=target_role,
    )
    return result


@router.post("/resume/ats-score")
async def resume_ats_score(
    req: AtsScoreRequest,
    current_user: dict = Depends(get_current_user),
):
    """Direct ATS score evaluation for text/skills against a job description."""
    synthetic_doc = {
        "personal_info": {"name": "Candidate", "summary": req.resume_text[:200]},
        "skills": req.resume_skills,
        "education": [{"degree": "Degree", "institution": "University"}],
        "experience": [{"title": "Engineer", "description": req.resume_text}],
        "raw_text": req.resume_text,
        "total_experience_years": 3.0,
    }
    return calculate_ats_score(synthetic_doc, job_description=req.job_description)


@router.post("/resume/skill-gap")
async def resume_skill_gap(
    req: ResumeSkillGapRequest,
    current_user: dict = Depends(get_current_user),
):
    """Direct skill gap computation between a list of skills and a job description/role."""
    target = req.job_description if req.job_description else (req.target_role or "Senior Backend Engineer")
    return analyze_skill_gap_against_job(
        resume_skills=req.resume_skills,
        job_skills_or_text=target,
        target_role=req.target_role,
    )


# ---------- Profile ----------
@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    profile = demo_store.get_profile(user_id)
    if current_user.get("email"):
        profile["email"] = current_user["email"]
    return profile


@router.post("/profile")
@router.put("/profile")
async def update_profile(
    updates: dict,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    return demo_store.update_profile(user_id, updates)


# ---------- Jobs ----------
@router.get("/jobs/search")
@router.post("/jobs/search")
async def jobs_search(
    req: JobSearchRequest | None = None,
    query: str | None = None,
    location: str | None = None,
    remote_only: bool = False,
    page: int = 1,
):
    """Search jobs via real Adzuna API (defaulting to India market)."""
    search_q = (req.query if req and req.query is not None else query) or ""
    loc = (req.location if req and req.location is not None else location) or ""
    remote = (req.remote_only if req and req.remote_only is not None else remote_only) or False

    # If query is empty, use a sensible default software role so initial load has real jobs
    effective_query = search_q.strip() or "Software Engineer"

    jobs = await adzuna_service.search_jobs(
        query=effective_query,
        location=loc,
        remote_only=remote,
        page=page,
        results_per_page=12,
        country="in",
    )

    # Fallback to secondary search or local jobs if empty
    if not jobs:
        seed_list = list(demo_store.jobs.values())
        if search_q.strip():
            matched_seed = [
                j for j in seed_list
                if search_q.lower() in j["title"].lower()
                or search_q.lower() in j.get("company", "").lower()
                or any(search_q.lower() in s.lower() for s in j.get("skills", []))
            ]
            jobs = matched_seed if matched_seed else seed_list[:12]
        else:
            jobs = seed_list[:12]

    return {"count": len(jobs), "jobs": jobs}



@router.get("/jobs/saved")
async def get_saved_jobs(current_user: dict = Depends(get_current_user)):
    """Retrieve saved/bookmarked jobs for the authenticated user."""
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    saved = demo_store.get_saved_jobs(user_id)
    return {"count": len(saved), "jobs": saved}


@router.post("/jobs/saved/{job_id}")
async def save_job(
    job_id: str,
    job_payload: dict | None = None,
    current_user: dict = Depends(get_current_user),
):
    """Bookmark a job for the authenticated user."""
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    job = job_payload or adzuna_service.get_cached_job(job_id) or demo_store.jobs.get(job_id)
    if not job:
        job = {"id": job_id, "title": "Software Engineer", "company": "Company", "location": "India"}
    saved = demo_store.save_job(user_id, job)
    return {"status": "saved", "job": saved}


@router.delete("/jobs/saved/{job_id}")
async def delete_saved_job(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Remove a bookmarked job."""
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    removed = demo_store.unsave_job(user_id, job_id)
    return {"status": "removed" if removed else "not_found", "job_id": job_id}


@router.get("/jobs/{job_id}")
async def get_job(job_id: str):
    """Get single job details from cache or store."""
    job = adzuna_service.get_cached_job(job_id) or demo_store.jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.get("/jobs/{job_id}/match")
@router.post("/jobs/{job_id}/match")
async def get_job_match(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Calculate personalized IntelliMatch score for this specific job."""
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    candidate = demo_store.get_profile(user_id)
    job = adzuna_service.get_cached_job(job_id) or demo_store.jobs.get(job_id)
    
    if not job:
        raise HTTPException(404, "Job not found for match calculation")
        
    return compute_intellimatch_score(candidate, job)


# ---------- Matching ----------
@router.post("/matching/run")
async def matching_run(
    req: MatchingRunRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    candidate = demo_store.get_profile(user_id)
    return {"results": await matching_service.run_matching(candidate=candidate, top_k=req.top_k, explain=req.explain)}


@router.get("/matching/results")
async def matching_results(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    candidate = demo_store.get_profile(user_id)
    return {"results": await matching_service.run_matching(candidate=candidate, top_k=10, explain=False)}



# ---------- Skills ----------
@router.post("/skills/extract")
async def skills_extract(current_user: dict = Depends(get_current_user)):
    return {"skills": demo_store.candidate_profile["skills"]}


@router.post("/skills/gap-analysis")
async def skills_gap(
    req: SkillGapRequest,
    current_user: dict = Depends(get_current_user),
):
    return {"target_role": req.target_role, "gaps": skill_service.analyze_skill_gap(req.target_role)}


@router.get("/skills/graph")
async def skills_graph(
    root: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    return skill_service.get_skill_graph(root)


# ---------- Career ----------
@router.post("/career/simulate")
async def career_simulate(
    req: CareerSimulateRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    candidate = demo_store.get_profile(user_id)
    return await career_service.simulate_skill_addition(req.skills, candidate_profile=candidate)


@router.post("/career/roadmap")
async def career_roadmap(
    req: CareerRoadmapRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    candidate = demo_store.get_profile(user_id)
    stages = await career_service.generate_roadmap(
        current_role=req.current_role,
        candidate_profile=candidate,
        user_id=user_id,
    )
    return {"stages": stages}


@router.post("/career/predict")
async def career_predict(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    candidate = demo_store.get_profile(user_id)
    return {"predictions": await career_service.predict_next_roles(candidate)}


# ---------- Skill ROI ----------
@router.post("/skill/roi")
async def skill_roi(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    candidate = demo_store.get_profile(user_id)
    return {"ranked_skills": growth_service.compute_skill_roi(candidate.get("skills"))}


# ---------- Learning ----------
@router.post("/learning/path")
async def learning_path(
    req: LearningPathRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    candidate = demo_store.get_profile(user_id)
    
    skill_list = list(req.skills)
    if req.custom_skill and req.custom_skill.strip() and req.custom_skill.strip() not in skill_list:
        skill_list.insert(0, req.custom_skill.strip())
        
    if not skill_list:
        skill_list = ["Java"]

    paths = await growth_service.generate_learning_path(
        skills=skill_list,
        candidate_profile=candidate,
        target_role_override=req.target_role,
        current_level_override=req.current_level,
        user_id=user_id,
    )
    return {"paths": paths}



# ---------- Assessment ----------
@router.post("/assessment/generate")
async def assessment_generate(
    req: AssessmentGenerateRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    return await growth_service.generate_assessment(
        target_role=req.target_role,
        skill_gaps=req.skill_gaps,
        skill=req.skill,
        user_id=user_id,
    )


@router.post("/assessment/evaluate")
async def assessment_evaluate(
    req: AssessmentEvaluateRequest,
    current_user: dict = Depends(get_current_user),
):
    return growth_service.evaluate_assessment([a.model_dump() for a in req.answers])


# ---------- Interview Preparation ----------
@router.post("/interview/generate")
async def interview_generate(
    req: InterviewPrepRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    candidate = demo_store.get_profile(user_id)
    resume_skills = req.resume_skills or list(candidate.get("skills", {}).keys())
    return await growth_service.generate_interview_prep(
        target_role=req.target_role,
        resume_skills=resume_skills,
        skill_gaps=req.skill_gaps,
        job_description=req.job_description,
        user_id=user_id,
    )


# ---------- Company-Specific Interview Preparation Routes ----------
@router.get("/interview/companies")
async def list_interview_companies(
    query: str | None = None,
    category: str | None = None,
    letter: str | None = None,
    limit: int = 60,
    offset: int = 0,
    optional_user: dict = Depends(get_optional_user),
):
    """Retrieve 300+ searchable, categorizable companies."""
    return interview_service.list_companies(
        query=query,
        category=category,
        letter=letter,
        limit=limit,
        offset=offset,
    )


@router.get("/interview/companies/{company_id}")
async def get_company_detail(
    company_id: str,
    optional_user: dict = Depends(get_optional_user),
):
    """Get single company interview preparation profile."""
    company = interview_service.get_company_by_id(company_id)
    if not company:
        raise HTTPException(status_code=404, detail=f"Company '{company_id}' not found.")
    return company


@router.post("/interview/company/plan")
async def get_company_prep_plan(
    req: CompanyPrepPlanRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate personalized Two-Layer preparation plan using candidate profile."""
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    return interview_service.build_personalized_prep_plan(
        company_id=req.company_id,
        target_role=req.target_role,
        user_id=user_id,
    )


@router.post("/interview/company/questions")
async def get_company_questions(
    req: CompanyQuestionsRequest,
    optional_user: dict = Depends(get_optional_user),
):
    """Retrieve curated question bank with external links & difficulty ratings."""
    questions = interview_service.get_company_questions(
        company_id=req.company_id,
        category=req.category,
    )
    return {"company_id": req.company_id, "questions": questions}


@router.post("/interview/company/practice")
async def generate_company_practice(
    req: CompanyPracticeRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate AI practice questions inspired by company patterns."""
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    return await interview_service.generate_company_practice(
        company_id=req.company_id,
        target_role=req.target_role,
        category=req.category,
        user_id=user_id,
    )


@router.post("/interview/mock/start")
async def start_mock_interview(
    req: MockInterviewStartRequest,
    current_user: dict = Depends(get_current_user),
):
    """Start interactive AI Mock Interview session."""
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    return await interview_service.start_mock_interview(
        company_id=req.company_id,
        target_role=req.target_role,
        round_type=req.round_type,
        user_id=user_id,
    )


@router.post("/interview/mock/turn")
async def submit_mock_interview_turn(
    req: MockInterviewTurnRequest,
    current_user: dict = Depends(get_current_user),
):
    """Submit candidate response to AI interviewer."""
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    return await interview_service.submit_mock_turn(
        session_id=req.session_id,
        user_answer=req.user_answer,
        user_id=user_id,
    )


@router.post("/interview/mock/evaluate")
async def evaluate_mock_interview(
    req: MockInterviewEvaluateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Evaluate full mock interview session with 4 rubric scores."""
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    return await interview_service.evaluate_mock_interview(
        session_id=req.session_id,
        user_id=user_id,
    )


@router.get("/interview/saved")
async def get_saved_companies(
    current_user: dict = Depends(get_current_user),
):
    """List bookmarked companies for candidate."""
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    saved = interview_service.get_saved_companies(user_id)
    return {"saved_companies": saved}


@router.post("/interview/save")
async def toggle_save_company(
    req: CompanySaveRequest,
    current_user: dict = Depends(get_current_user),
):
    """Toggle bookmark for target company."""
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    return interview_service.toggle_save_company(user_id, req.company_id)



# ---------- GitHub ----------
@router.post("/github/analyze")
async def github_analyze(
    req: GithubAnalyzeRequest,
    current_user: dict = Depends(get_current_user),
):
    return await analyze_github(req.username)


# ---------- Market ----------
@router.get("/market/insights")
async def market_insights(
    role: str = "Software Engineer",
    location: str | None = None,
    country: str = "in",
    force_refresh: bool = False,
    current_user: dict | None = Depends(get_optional_user),
):
    """Fetch real-time / cached Adzuna employment data, salary intelligence, and skill demand."""
    candidate_skills = None
    if current_user:
        user_id = current_user.get("user_id") or current_user.get("sub") or "default"
        profile = demo_store.get_profile(user_id)
        candidate_skills = profile.get("skills")
    elif demo_store.candidate_profile.get("skills"):
        candidate_skills = demo_store.candidate_profile.get("skills")

    return await market_insights_service.get_insights(
        role=role.strip() if role else "Software Engineer",
        location=location.strip() if location else None,
        country=country.strip().lower() if country else "in",
        candidate_skills=candidate_skills,
        force_refresh=force_refresh,
    )


# ---------- Assistant ----------
@router.post("/assistant/chat")
async def assistant_chat(
    req: AssistantChatRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("user_id") or current_user.get("sub") or "default"
    candidate = demo_store.get_profile(user_id)
    return await growth_service.assistant_chat(
        message=req.message,
        candidate_profile=candidate,
        user_id=user_id,
    )

