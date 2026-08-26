"""IntelliMatch ATS Scoring & Compatibility Engine.

Transparent, deterministic scoring model calculating resume ATS readiness and
job description compatibility.
"""
from __future__ import annotations

import re
from typing import Any

from app.services.skill_normalization import (
    extract_keywords_from_text,
    extract_skills_from_text,
    normalize_skills_list,
)

# Configurable ATS Scoring Weights
ATS_WEIGHTS = {
    "skill_match": 0.40,
    "experience_match": 0.20,
    "keyword_match": 0.15,
    "education_match": 0.15,
    "structure_score": 0.10,
}

DISCLAIMER_TEXT = (
    "This ATS score is an IntelliMatch compatibility estimate based on deterministic "
    "heuristics and semantic matching. It is not an official vendor ATS certification."
)


def _compute_structure_score(structured_resume: dict[str, Any]) -> float:
    """Calculate resume layout, completeness, and ATS readability score (0 - 100)."""
    score = 0.0
    p_info = structured_resume.get("personal_info") or {}

    # Contact information (up to 30 points)
    if p_info.get("name"):
        score += 10.0
    if p_info.get("email"):
        score += 10.0
    if p_info.get("phone"):
        score += 5.0
    if p_info.get("location"):
        score += 5.0

    # Professional Summary (up to 15 points)
    summary = p_info.get("summary") or ""
    if summary and len(summary.split()) >= 15:
        score += 15.0
    elif summary:
        score += 8.0

    # Experience section completeness (up to 25 points)
    experience = structured_resume.get("experience") or []
    if experience:
        score += 10.0
        # Check if experience has dates, title, and bullet descriptions
        has_dates = any(e.get("dates") for e in experience)
        has_desc = any(e.get("description") and len(e["description"].split()) > 10 for e in experience)
        if has_dates:
            score += 7.5
        if has_desc:
            score += 7.5

    # Education completeness (up to 15 points)
    education = structured_resume.get("education") or []
    if education:
        score += 10.0
        if any(e.get("degree") and e.get("institution") for e in education):
            score += 5.0

    # Skills section presence (up to 15 points)
    skills = structured_resume.get("skills") or []
    if len(skills) >= 8:
        score += 15.0
    elif len(skills) >= 4:
        score += 10.0
    elif len(skills) >= 1:
        score += 5.0

    return min(100.0, round(score, 1))


def _extract_experience_years_from_text(text: str) -> float | None:
    """Extract required years of experience from job description text."""
    patterns = [
        r"(\d+)\+?\s*(?:-\s*\d+)?\s*(?:years?|yrs?)(?:\s+of)?\s+experience",
        r"experience\s*(?:of)?\s*(\d+)\+?\s*years?",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            try:
                return float(m.group(1))
            except (ValueError, IndexError):
                pass
    return None


def calculate_ats_score(
    structured_resume: dict[str, Any],
    job_description: str | None = None,
) -> dict[str, Any]:
    """Calculate the ATS compatibility score and detailed breakdown.

    Supports two modes:
    - Mode 1: Resume-only analysis (quality, structure, skill depth, readability).
    - Mode 2: Resume + Job Description compatibility analysis.
    """
    structure_score = _compute_structure_score(structured_resume)
    resume_skills = normalize_skills_list(structured_resume.get("skills") or [])
    resume_skills_lower = {s.lower(): s for s in resume_skills}
    resume_raw_text = structured_resume.get("raw_text") or ""
    total_exp_years = float(structured_resume.get("total_experience_years") or 0.0)
    education_entries = structured_resume.get("education") or []

    # =========================================================================
    # MODE 1: RESUME-ONLY ANALYSIS (No Job Description provided)
    # =========================================================================
    if not job_description or not job_description.strip():
        # Skill Depth Score (0-100)
        skill_count = len(resume_skills)
        if skill_count >= 12:
            skill_score = 95.0
        elif skill_count >= 8:
            skill_score = 85.0
        elif skill_count >= 5:
            skill_score = 70.0
        elif skill_count >= 2:
            skill_score = 55.0
        else:
            skill_score = 35.0

        # Experience Quality Score (0-100)
        exp_entries = structured_resume.get("experience") or []
        if exp_entries and total_exp_years >= 2.0:
            exp_score = 90.0
        elif exp_entries:
            exp_score = 75.0
        elif total_exp_years > 0:
            exp_score = 60.0
        else:
            exp_score = 40.0

        # Education Score (0-100)
        if education_entries:
            edu_score = 90.0 if any(e.get("degree") for e in education_entries) else 75.0
        else:
            edu_score = 50.0

        # Keyword / Readability Score (0-100)
        # Check action verbs and technical keywords density
        action_verbs = {"developed", "built", "engineered", "designed", "architected", "implemented", "deployed", "optimized", "managed", "automated", "created", "led"}
        resume_words = set(re.findall(r"\b[a-zA-Z]{3,}\b", resume_raw_text.lower()))
        verb_matches = action_verbs.intersection(resume_words)
        verb_score = min(40.0, len(verb_matches) * 8.0)
        length_score = 40.0 if len(resume_raw_text.split()) >= 150 else 20.0
        keyword_score = round(min(100.0, 20.0 + verb_score + length_score), 1)

        breakdown = {
            "skill_match": skill_score,
            "experience_match": exp_score,
            "keyword_match": keyword_score,
            "education_match": edu_score,
            "structure_score": structure_score,
        }

        weighted_ats = (
            breakdown["skill_match"] * ATS_WEIGHTS["skill_match"]
            + breakdown["experience_match"] * ATS_WEIGHTS["experience_match"]
            + breakdown["keyword_match"] * ATS_WEIGHTS["keyword_match"]
            + breakdown["education_match"] * ATS_WEIGHTS["education_match"]
            + breakdown["structure_score"] * ATS_WEIGHTS["structure_score"]
        )
        ats_score = int(round(weighted_ats))

        # Recommendations for Mode 1
        recommendations = []
        if structure_score < 75:
            if not structured_resume.get("personal_info", {}).get("summary"):
                recommendations.append("Add a 2-3 sentence professional summary at the top to give recruiters quick context.")
            if not structured_resume.get("personal_info", {}).get("phone"):
                recommendations.append("Include your contact phone number for ATS parsing.")
        if skill_count < 8:
            recommendations.append("List at least 8-10 core technical and soft skills to improve ATS indexing.")
        if not any(re.search(r"\d+%", exp.get("description", "")) or re.search(r"\b\d+\b", exp.get("description", "")) for exp in exp_entries):
            recommendations.append("Quantify accomplishments in your work experience (e.g. 'improved latency by 35%').")
        if not recommendations:
            recommendations.append("Your resume structure is strong! Provide a job description to calculate target role compatibility.")

        return {
            "ats_score": ats_score,
            "mode": "resume_only",
            "weights": ATS_WEIGHTS,
            "breakdown": breakdown,
            "matched_skills": resume_skills,
            "missing_skills": [],
            "matched_keywords": sorted(list(verb_matches)),
            "missing_keywords": [],
            "recommendations": recommendations,
            "disclaimer": DISCLAIMER_TEXT,
        }

    # =========================================================================
    # MODE 2: RESUME + JOB DESCRIPTION COMPATIBILITY ANALYSIS
    # =========================================================================
    job_skills = extract_skills_from_text(job_description)
    if not job_skills:
        # Fallback to standard core backend skills if no specific skills were detected in text
        job_skills = ["Python", "SQL", "Git", "REST APIs", "Docker"]

    matched_skills: list[str] = []
    missing_skills: list[str] = []

    for js in job_skills:
        if js.lower() in resume_skills_lower:
            matched_skills.append(resume_skills_lower[js.lower()])
        else:
            missing_skills.append(js)

    # 1. Skill Match Score (0 - 100)
    skill_match_score = round((len(matched_skills) / max(1, len(job_skills))) * 100.0, 1)

    # 2. Experience Match Score (0 - 100)
    req_years = _extract_experience_years_from_text(job_description)
    if req_years is not None and req_years > 0:
        if total_exp_years >= req_years:
            experience_match_score = 100.0
        else:
            experience_match_score = round((total_exp_years / req_years) * 85.0, 1)
    else:
        # If no specific years mentioned, grant a baseline experience score
        experience_match_score = 90.0 if total_exp_years >= 2.0 else (75.0 if total_exp_years > 0 else 60.0)

    # 3. Keyword Match Score (0 - 100)
    jd_keywords = extract_keywords_from_text(job_description)
    resume_keywords = extract_keywords_from_text(resume_raw_text)

    matched_keywords_set = jd_keywords.intersection(resume_keywords)
    missing_keywords_set = jd_keywords.difference(resume_keywords)

    if jd_keywords:
        keyword_match_score = round((len(matched_keywords_set) / len(jd_keywords)) * 100.0, 1)
        # Apply gentle baseline smoothing so that sparse keyword sets don't result in 0%
        keyword_match_score = min(100.0, max(20.0, keyword_match_score * 1.3))
    else:
        keyword_match_score = 80.0

    # 4. Education Match Score (0 - 100)
    jd_lower = job_description.lower()
    requires_bachelor = "bachelor" in jd_lower or "bs " in jd_lower or "b.s." in jd_lower or "degree" in jd_lower or "computer science" in jd_lower
    requires_master = "master" in jd_lower or "ms " in jd_lower or "m.s." in jd_lower

    has_bachelor = any("bachelor" in (e.get("degree", "") + e.get("raw", "")).lower() or "b.s" in (e.get("degree", "") + e.get("raw", "")).lower() or "btech" in (e.get("degree", "") + e.get("raw", "")).lower() or "b.tech" in (e.get("degree", "") + e.get("raw", "")).lower() for e in education_entries)
    has_master = any("master" in (e.get("degree", "") + e.get("raw", "")).lower() or "m.s" in (e.get("degree", "") + e.get("raw", "")).lower() or "mtech" in (e.get("degree", "") + e.get("raw", "")).lower() for e in education_entries)

    if requires_master:
        education_match_score = 100.0 if has_master else (75.0 if has_bachelor else 50.0)
    elif requires_bachelor:
        education_match_score = 100.0 if (has_bachelor or has_master) else 65.0
    else:
        education_match_score = 90.0 if education_entries else 70.0

    breakdown = {
        "skill_match": round(skill_match_score, 1),
        "experience_match": round(experience_match_score, 1),
        "keyword_match": round(keyword_match_score, 1),
        "education_match": round(education_match_score, 1),
        "structure_score": round(structure_score, 1),
    }

    weighted_ats = (
        breakdown["skill_match"] * ATS_WEIGHTS["skill_match"]
        + breakdown["experience_match"] * ATS_WEIGHTS["experience_match"]
        + breakdown["keyword_match"] * ATS_WEIGHTS["keyword_match"]
        + breakdown["education_match"] * ATS_WEIGHTS["education_match"]
        + breakdown["structure_score"] * ATS_WEIGHTS["structure_score"]
    )
    ats_score = int(round(weighted_ats))

    # Targeted Recommendations for Mode 2
    recommendations = []
    if missing_skills:
        top_missing = missing_skills[:3]
        for ms in top_missing:
            recommendations.append(f"Add projects or experience demonstrating '{ms}' to address key job requirements.")

    if req_years and total_exp_years < req_years:
        recommendations.append(f"The job requests ~{int(req_years)} years of experience. Highlight relevant academic projects or internships to demonstrate depth.")

    if len(missing_keywords_set) > 5:
        sample_missing_kw = list(missing_keywords_set)[:4]
        recommendations.append(f"Incorporate key industry phrases from the job description such as: {', '.join(sample_missing_kw)}.")

    if structure_score < 75:
        recommendations.append("Enhance resume readability by adding clear section headings, dates, and bullet points.")

    if not recommendations:
        recommendations.append("Strong match! Your profile aligns closely with the provided job description.")

    return {
        "ats_score": ats_score,
        "mode": "resume_and_job",
        "weights": ATS_WEIGHTS,
        "breakdown": breakdown,
        "matched_skills": sorted(list(dict.fromkeys(matched_skills))),
        "missing_skills": sorted(list(dict.fromkeys(missing_skills))),
        "matched_keywords": sorted(list(matched_keywords_set))[:20],
        "missing_keywords": sorted(list(missing_keywords_set))[:20],
        "recommendations": recommendations,
        "disclaimer": DISCLAIMER_TEXT,
    }
