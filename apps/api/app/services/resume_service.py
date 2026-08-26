"""Resume intelligence service.

Orchestrates Affinda resume parsing, internal normalization, our custom ATS scoring engine,
and deterministic skill-gap analysis.
"""
from __future__ import annotations

import io
import re
from typing import Any

import fitz  # PyMuPDF fallback for raw text extraction if needed

from app.core.store import demo_store
from app.services.affinda_service import parse_resume_with_affinda, validate_resume_file
from app.services.ats_engine import calculate_ats_score
from app.services.skill_gap_engine import analyze_skill_gap_against_job
from app.services.skill_normalization import extract_skills_from_text, normalize_skills_list


def _fallback_local_parse(file_bytes: bytes, file_name: str) -> dict[str, Any]:
    """Lightweight local fallback parser when testing with sample text or no API access."""
    text = ""
    if file_bytes and file_name.lower().endswith(".pdf"):
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            text = "\n".join(page.get_text() for page in doc)
            doc.close()
        except Exception:
            text = ""

    if not text.strip():
        text = (
            "Backend Engineer with 3+ years experience in Python, FastAPI, PostgreSQL, "
            "Docker, REST APIs, Git, system design and testing. Built projects using React and Next.js."
        )

    skills = extract_skills_from_text(text)

    # Basic sections
    sections = []
    lower = text.lower()
    for sec in ["experience", "education", "skills", "summary", "projects", "certifications"]:
        if sec in lower:
            sections.append(sec.capitalize())

    return {
        "personal_info": {
            "name": "Candidate",
            "email": "candidate@intellimatch.ai",
            "phone": "+1-555-0199",
            "location": "Bangalore",
            "websites": [],
            "summary": text[:200],
        },
        "skills": skills,
        "education": [{"institution": "University", "degree": "Bachelor of Science", "dates": "2018 - 2022"}],
        "experience": [{"title": "Software Engineer", "company": "Tech Corp", "dates": "2022 - Present", "description": text[:300]}],
        "projects": [],
        "certifications": [],
        "languages": ["English"],
        "total_experience_years": 3.0,
        "raw_text": text,
    }


async def analyze_resume(
    file_bytes: bytes,
    file_name: str,
    job_description: str | None = None,
    target_role: str | None = None,
) -> dict[str, Any]:
    """Analyze a resume document with Affinda and compute ATS score + skill gap.

    Args:
        file_bytes: Raw file bytes (PDF or DOCX).
        file_name: Name of uploaded file.
        job_description: Optional target job description text for Mode 2 ATS match.
        target_role: Optional target role name.
    """
    # 1. Parse via Affinda (or fallback if empty test bytes)
    if file_bytes:
        try:
            structured_data = await parse_resume_with_affinda(file_bytes, file_name)
        except Exception as e:
            # If Affinda throws HTTPException (like auth error, validation, etc.), re-raise
            raise e
    else:
        structured_data = _fallback_local_parse(file_bytes, file_name)

    # 2. Update demo store candidate profile
    skills_found = structured_data.get("skills") or []
    demo_store.candidate_profile["resume_text"] = structured_data.get("raw_text", "")[:1200]
    if structured_data.get("personal_info", {}).get("name"):
        demo_store.candidate_profile["full_name"] = structured_data["personal_info"]["name"]
    if structured_data.get("total_experience_years"):
        demo_store.candidate_profile["years_experience"] = structured_data["total_experience_years"]

    new_skills = {s: demo_store.candidate_profile["skills"].get(s, 3.5) for s in skills_found}
    demo_store.set_candidate_skills({**demo_store.candidate_profile["skills"], **new_skills})

    # 3. Compute ATS compatibility score & breakdown
    ats_result = calculate_ats_score(structured_data, job_description=job_description)

    # 4. Compute Skill Gap Analysis
    target_for_gap = job_description if (job_description and job_description.strip()) else (target_role or "Senior Backend Engineer")
    skill_gap_result = analyze_skill_gap_against_job(
        resume_skills=skills_found,
        job_skills_or_text=target_for_gap,
        target_role=target_role,
    )

    # 5. Detect missing information
    missing_info = []
    p_info = structured_data.get("personal_info") or {}
    if not p_info.get("summary"):
        missing_info.append("Professional Summary")
    if not p_info.get("phone"):
        missing_info.append("Contact Phone Number")
    if len(skills_found) < 5:
        missing_info.append("Expanded Skills Section")
    if not structured_data.get("experience"):
        missing_info.append("Work Experience Entries")

    # Detect sections
    sections_detected = []
    if p_info.get("summary"):
        sections_detected.append("Summary")
    if skills_found:
        sections_detected.append("Skills")
    if structured_data.get("experience"):
        sections_detected.append("Experience")
    if structured_data.get("education"):
        sections_detected.append("Education")
    if structured_data.get("certifications"):
        sections_detected.append("Certifications")
    if structured_data.get("projects"):
        sections_detected.append("Projects")
    if structured_data.get("languages"):
        sections_detected.append("Languages")

    profile_strength = min(100, int(ats_result["ats_score"] * 0.7 + len(skills_found) * 2.5))

    return {
        "file_name": file_name,
        "ats_score": ats_result["ats_score"],
        "mode": ats_result["mode"],
        "breakdown": ats_result["breakdown"],
        "weights": ats_result["weights"],
        "structured_data": structured_data,
        "skills_found": skills_found,
        "matched_skills": ats_result["matched_skills"],
        "missing_skills": ats_result["missing_skills"],
        "matched_keywords": ats_result.get("matched_keywords", []),
        "missing_keywords": ats_result.get("missing_keywords", []),
        "skill_gap": skill_gap_result,
        "recommendations": ats_result["recommendations"],
        "missing_information": missing_info,
        "profile_strength": profile_strength,
        "raw_text_preview": structured_data.get("raw_text", "")[:1200],
        "sections_detected": sections_detected,
        "disclaimer": ats_result["disclaimer"],
    }
