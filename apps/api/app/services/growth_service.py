"""Skill ROI ranking, personalized learning paths, AI-generated assessments,
interview preparation, and the data-grounded AI career assistant."""
from __future__ import annotations

import json
from typing import Any

from app.core.store import demo_store
from app.data.seed_jobs import SEED_JOBS
from app.services.skill_service import analyze_skill_gap, get_market_demand
from app.services.adzuna_service import _adzuna_market_cache
from app.services.openrouter_service import openrouter_service


def _jobs_requiring(skill: str) -> int:
    return sum(1 for j in SEED_JOBS if skill in j.get("skills", []))


DIFFICULTY: dict[str, float] = {
    "Kubernetes": 0.8, "Machine Learning": 0.75, "Deep Learning": 0.85, "System Design": 0.7,
    "AWS": 0.6, "Docker": 0.4, "React": 0.45, "Python": 0.35, "SQL": 0.3, "FastAPI": 0.35,
    "PostgreSQL": 0.4, "TypeScript": 0.4, "Go": 0.5, "Rust": 0.85, "Microservices": 0.6,
}


def compute_skill_roi(candidate_skills: dict[str, float] | None = None) -> list[dict]:
    """Deterministic calculation of Skill Return on Investment.

    Formula:
    ROI = (demand * 0.4 + (jobs_affected / total_jobs) * 0.3 + (gap / 5) * 0.3) / max(0.3, difficulty)
    """
    candidate_skills = candidate_skills or demo_store.candidate_profile.get("skills", {})
    target_role = demo_store.candidate_profile.get("target_role", "Software Engineer")
    gaps = analyze_skill_gap(target_role, candidate_skills)
    candidate_gap_skills = {g["skill"]: g for g in gaps}

    all_skills = set(candidate_gap_skills.keys())
    for _, (_, cache_val) in _adzuna_market_cache.items():
        for s in cache_val.get("skills_in_demand", []):
            all_skills.add(s["skill"])

    if not all_skills:
        all_skills = {"Python", "SQL", "Docker", "AWS", "FastAPI", "React", "PostgreSQL", "Kubernetes", "System Design"}

    rows = []
    total_seed_jobs = max(1, len(SEED_JOBS))
    for skill in all_skills:
        demand = get_market_demand(skill, role=target_role)
        jobs_affected = _jobs_requiring(skill)
        difficulty = DIFFICULTY.get(skill, 0.5)
        gap = candidate_gap_skills.get(skill, {}).get("gap", 2.0)
        
        # Calculate deterministic ROI
        roi_score = round(
            (demand * 0.4 + (jobs_affected / total_seed_jobs) * 0.3 + (gap / 5.0) * 0.3) / max(0.3, difficulty),
            2,
        )
        rows.append({
            "skill": skill,
            "roi": roi_score,
            "demand": demand,
            "jobs_affected": jobs_affected,
            "difficulty": difficulty,
            "current_gap": gap,
        })

    rows.sort(key=lambda r: -r["roi"])
    return rows[:12]


async def generate_learning_path(
    skills: list[str],
    candidate_profile: dict[str, Any] | None = None,
    target_role_override: str | None = None,
    current_level_override: float | None = None,
    user_id: str = "default",
) -> list[dict]:
    """Generate structured, realistic learning plans via OpenRouter using real candidate and market context."""
    profile = candidate_profile or demo_store.candidate_profile
    target_role = target_role_override or profile.get("target_role", "Senior Backend Engineer")
    candidate_skills = profile.get("skills", {})
    existing_skills_list = list(candidate_skills.keys())

    paths = []
    for skill in skills:
        if not skill or not skill.strip():
            continue
        clean_skill = skill.strip()
        curr_lvl = current_level_override if current_level_override is not None else candidate_skills.get(clean_skill, 0.0)
        req_lvl = 3.5
        gap = max(0.0, req_lvl - curr_lvl)
        demand_pct = get_market_demand(clean_skill, role=target_role) * 100.0

        plan = await openrouter_service.generate_learning_path(
            skill=clean_skill,
            current_level=curr_lvl,
            required_level=req_lvl,
            gap=gap,
            market_demand_pct=demand_pct if demand_pct > 0 else 55.0,
            target_role=target_role,
            existing_skills=existing_skills_list,
            user_id=user_id,
        )
        paths.append(plan)

    return paths



async def generate_assessment(
    target_role: str,
    skill_gaps: list[str] | None = None,
    skill: str | None = None,
    user_id: str = "default",
) -> dict:
    """Generate structured assessment questions using OpenRouter."""
    target_skill = skill or (skill_gaps[0] if skill_gaps else "Backend Architecture")
    return await openrouter_service.generate_assessment(
        target_role=target_role,
        skill=target_skill,
        skill_gaps=skill_gaps,
        question_count=5,
        user_id=user_id,
    )


def evaluate_assessment(answers: list[dict]) -> dict:
    """Deterministic scoring of assessment answers."""
    breakdown = []
    correct_count = 0
    total = len(answers)

    for i, a in enumerate(answers):
        q_text = a.get("question") or f"Question {i+1}"
        user_ans = a.get("user_answer") if a.get("user_answer") is not None else a.get("answer")
        correct_ans = a.get("correct_answer")
        explanation = a.get("explanation", "")

        is_correct = False
        if correct_ans is not None and user_ans is not None:
            # Multiple-choice numerical index match
            try:
                is_correct = int(user_ans) == int(correct_ans)
            except (ValueError, TypeError):
                is_correct = str(user_ans).strip().lower() == str(correct_ans).strip().lower()
        elif user_ans is not None:
            # Text heuristic fallback if raw text answer
            text_str = str(user_ans or "")
            is_correct = len(text_str.split()) >= 8

        if is_correct:
            correct_count += 1

        score_item = 100.0 if is_correct else 0.0
        breakdown.append({
            "question": q_text,
            "score": score_item,
            "is_correct": is_correct,
            "explanation": explanation,
        })

    overall_score = round((correct_count / max(1, total)) * 100, 1)
    return {
        "score": overall_score,
        "correct_count": correct_count,
        "total_questions": total,
        "breakdown": breakdown,
    }



async def generate_interview_prep(
    target_role: str = "Senior Backend Engineer",
    resume_skills: list[str] | None = None,
    skill_gaps: list[str] | None = None,
    job_description: str | None = None,
    user_id: str = "default",
) -> dict:
    """Generate role-grounded technical and behavioral interview preparation questions."""
    return await openrouter_service.generate_interview_prep(
        target_role=target_role,
        resume_skills=resume_skills,
        skill_gaps=skill_gaps,
        job_description=job_description,
        user_id=user_id,
    )


async def assistant_chat(
    message: str,
    candidate_profile: dict[str, Any] | None = None,
    user_id: str = "default",
) -> dict:
    """Grounded AI career assistant that blends structured platform data with OpenRouter reasoning."""
    lower = message.lower()
    candidate = candidate_profile or demo_store.candidate_profile

    if "what should i learn" in lower or "learn next" in lower or "roi" in lower:
        roi = compute_skill_roi(candidate.get("skills"))[:3]
        return {
            "type": "skill_roi_cards",
            "data": roi,
            "message": "Based on your current profile and live job market demand, these skills offer the highest estimated ROI right now.",
        }

    if "jobs fit" in lower or "which jobs" in lower or "match" in lower:
        from app.services.matching_service import run_matching
        matches = await run_matching(candidate, top_k=5)
        return {
            "type": "job_match_cards",
            "data": matches,
            "message": "Here are your top current job matches calculated from your demonstrated skills and experience.",
        }

    if "senior" in lower or "not matching" in lower:
        gaps = analyze_skill_gap("Senior Backend Engineer", candidate.get("skills"))
        return {
            "type": "skill_gap_table",
            "data": gaps,
            "message": "These core skill gaps are most likely limiting your readiness score for senior roles.",
        }

    if "biggest skill gap" in lower or "explain my" in lower:
        gaps = analyze_skill_gap(candidate.get("target_role", "Software Engineer"), candidate.get("skills"))
        top_gap = gaps[0] if gaps else None
        if top_gap:
            return {
                "type": "explanation",
                "data": top_gap,
                "message": f"Your primary skill gap is {top_gap['skill']}, which is currently required at level {top_gap['required_level']}/5.0 with {top_gap['importance']} priority.",
            }

    # Free-form career question: route to OpenRouter with candidate context
    context = {
        "target_role": candidate.get("target_role"),
        "top_skills": list(candidate.get("skills", {}).keys())[:8],
    }
    reply = await openrouter_service.assistant_chat(message, candidate, context)
    return {"type": "text", "data": None, "message": reply}


