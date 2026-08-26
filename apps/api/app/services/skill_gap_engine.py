"""Deterministic Skill Gap Engine.

Compares resume skills against target job description requirements or target roles,
computes gap percentage, and generates prioritized recommendations.
"""
from __future__ import annotations

from app.data.seed_skills import SEED_SKILLS
from app.services.skill_normalization import (
    extract_skills_from_text,
    normalize_skill,
    normalize_skills_list,
)

# Demand weights for priority calculation
HIGH_PRIORITY_SKILLS = {
    "Python", "Java", "SQL", "PostgreSQL", "Docker", "Kubernetes", "AWS",
    "FastAPI", "React", "TypeScript", "Microservices", "System Design",
    "CI/CD", "Git", "REST APIs", "Machine Learning",
}

SKILL_ROLE_REASONS = {
    "Docker": "Essential for containerized microservices and reproducible deployment environments.",
    "Kubernetes": "Core container orchestration technology required for modern cloud workloads.",
    "AWS": "Primary cloud infrastructure platform heavily sought after by top engineering teams.",
    "FastAPI": "Modern, high-performance web framework for Python microservices and API gateways.",
    "PostgreSQL": "Industry-standard relational database for production systems and complex querying.",
    "System Design": "Critical architectural capability required for scalable distributed applications.",
    "Microservices": "Key architectural pattern for building decoupled, resilient enterprise systems.",
    "React": "Most widely used frontend library for responsive web user interfaces.",
    "TypeScript": "Type-safe JavaScript superset essential for scalable full-stack applications.",
    "Spring Boot": "Enterprise standard framework for Java microservices and enterprise applications.",
    "CI/CD": "Automation standard for testing, building, and deploying software continuously.",
    "Git": "Fundamental version control system required across all software development teams.",
    "Machine Learning": "High-demand AI/ML foundation for data-driven applications and intelligence systems.",
    "SQL": "Core querying language necessary for data persistence, reporting, and backend logic.",
}


def analyze_skill_gap_against_job(
    resume_skills: list[str],
    job_skills_or_text: list[str] | str,
    target_role: str | None = None,
) -> dict:
    """Perform deterministic skill gap analysis between resume skills and job requirements.

    Args:
        resume_skills: List of candidate skills extracted from resume.
        job_skills_or_text: Either an explicit list of required job skills, or the raw JD text.
        target_role: Optional target role name for contextual explanations.

    Returns:
        Dict with matched_skills, missing_skills, skill_gap_percentage, priority_skills.
    """
    # 1. Normalize resume skills
    norm_resume_skills = normalize_skills_list(resume_skills)
    resume_set = {s.lower(): s for s in norm_resume_skills}

    # 2. Extract and normalize required job skills
    if isinstance(job_skills_or_text, str):
        raw_job_skills = extract_skills_from_text(job_skills_or_text)
    else:
        raw_job_skills = job_skills_or_text

    norm_job_skills = normalize_skills_list(raw_job_skills)

    if not norm_job_skills:
        # Fallback if no skills could be parsed from text: assume common core skills
        norm_job_skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "REST APIs", "Git"]

    # 3. Deterministic matching
    matched_skills: list[str] = []
    missing_skills: list[str] = []

    for j_skill in norm_job_skills:
        j_lower = j_skill.lower()
        if j_lower in resume_set:
            matched_skills.append(resume_set[j_lower])
        else:
            missing_skills.append(j_skill)

    # 4. Calculate skill gap percentage
    total_required = len(norm_job_skills)
    missing_count = len(missing_skills)
    gap_percentage = round((missing_count / max(1, total_required)) * 100, 1)

    # 5. Determine priority skills
    priority_skills: list[dict] = []
    for s in missing_skills:
        canonical = normalize_skill(s)
        is_high = canonical in HIGH_PRIORITY_SKILLS
        priority = "High" if is_high else "Medium"
        reason = SKILL_ROLE_REASONS.get(
            canonical,
            f"Frequently required for {target_role or 'this target role'}." if target_role else "Core technical competency required in job description.",
        )
        priority_skills.append({
            "skill": canonical,
            "priority": priority,
            "reason": reason,
        })

    # Sort priority skills: High first, then Medium, then Low
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    priority_skills.sort(key=lambda x: priority_order.get(x["priority"], 3))

    return {
        "matched_skills": sorted(list(dict.fromkeys(matched_skills))),
        "missing_skills": sorted(list(dict.fromkeys(missing_skills))),
        "skill_gap_percentage": gap_percentage,
        "priority_skills": priority_skills,
    }
