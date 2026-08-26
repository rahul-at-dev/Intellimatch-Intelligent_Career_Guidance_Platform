"""Affinda Resume Parser API integration.

Sends uploaded resume documents (PDF, DOCX) to the Affinda v3 API and normalizes
the response into our internal structured resume representation.
"""
from __future__ import annotations

import io
import mimetypes
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.services.skill_normalization import normalize_skills_list

AFFINDA_API_BASE = "https://api.affinda.com/v3"
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}


def validate_resume_file(file_bytes: bytes, file_name: str) -> None:
    """Validate file extension and size constraints."""
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded resume file is empty.",
        )

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 10MB limit. Please upload a smaller resume file.",
        )

    lower_name = file_name.lower()
    if not any(lower_name.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type for '{file_name}'. Only PDF and DOCX documents are supported.",
        )


def _extract_personal_info(data: dict[str, Any]) -> dict[str, Any]:
    """Extract personal contact and profile info from Affinda data."""
    # Name
    cand_name_obj = data.get("candidateName") or {}
    name = ""
    if isinstance(cand_name_obj, dict):
        name = cand_name_obj.get("raw") or ""
        if not name:
            parsed = cand_name_obj.get("parsed") or {}
            if isinstance(parsed, dict):
                first = parsed.get("firstName", {}).get("parsed") if isinstance(parsed.get("firstName"), dict) else ""
                last = parsed.get("familyName", {}).get("parsed") if isinstance(parsed.get("familyName"), dict) else ""
                name = f"{first} {last}".strip()

    # Emails
    emails: list[str] = []
    for item in (data.get("email") or []):
        if isinstance(item, dict):
            em = item.get("parsed") or item.get("raw")
            if em and isinstance(em, str):
                emails.append(em)

    # Phone Numbers
    phone_numbers: list[str] = []
    for item in (data.get("phoneNumber") or []):
        if isinstance(item, dict):
            p_parsed = item.get("parsed")
            if isinstance(p_parsed, dict):
                phone_numbers.append(p_parsed.get("formattedNumber") or p_parsed.get("rawText") or "")
            elif isinstance(item.get("raw"), str):
                phone_numbers.append(item["raw"])
    phone_numbers = [p for p in phone_numbers if p]

    # Location
    loc_obj = data.get("location") or {}
    location_str = ""
    if isinstance(loc_obj, dict):
        location_str = loc_obj.get("raw") or ""
        if not location_str:
            p = loc_obj.get("parsed") or {}
            if isinstance(p, dict):
                location_str = p.get("formatted") or p.get("city") or ""

    # Websites / Links
    websites: list[str] = []
    for item in (data.get("website") or []):
        if isinstance(item, dict):
            w = item.get("parsed")
            if isinstance(w, dict):
                url = w.get("url")
                if url:
                    websites.append(url)
            elif isinstance(item.get("raw"), str):
                websites.append(item["raw"])

    # Summary
    summary_obj = data.get("summary") or {}
    summary = ""
    if isinstance(summary_obj, dict):
        summary = summary_obj.get("parsed") or summary_obj.get("raw") or ""
    elif isinstance(summary_obj, str):
        summary = summary_obj

    return {
        "name": name,
        "email": emails[0] if emails else "",
        "emails": emails,
        "phone": phone_numbers[0] if phone_numbers else "",
        "phone_numbers": phone_numbers,
        "location": location_str,
        "websites": websites,
        "summary": summary,
    }


def _extract_work_experience(data: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract and normalize work experience entries from Affinda data."""
    work_list: list[dict[str, Any]] = []
    for exp in (data.get("workExperience") or []):
        if not isinstance(exp, dict):
            continue
        p = exp.get("parsed") or {}
        raw = exp.get("raw") or ""

        # Title
        job_title = ""
        title_obj = p.get("workExperienceJobTitle") or {}
        if isinstance(title_obj, dict):
            job_title = title_obj.get("parsed") or title_obj.get("raw") or ""

        # Company / Organization
        org = ""
        org_obj = p.get("workExperienceOrganization") or {}
        if isinstance(org_obj, dict):
            org = org_obj.get("parsed") or org_obj.get("raw") or ""

        # Dates
        dates_str = ""
        dates_obj = p.get("workExperienceDates") or {}
        if isinstance(dates_obj, dict):
            dates_str = dates_obj.get("raw") or ""
            if not dates_str:
                dp = dates_obj.get("parsed") or {}
                if isinstance(dp, dict):
                    start = dp.get("start", {}).get("date") if isinstance(dp.get("start"), dict) else ""
                    end = "Present" if dp.get("end", {}).get("isCurrent") else (dp.get("end", {}).get("date") if isinstance(dp.get("end"), dict) else "")
                    dates_str = f"{start} - {end}".strip(" -")

        # Location
        loc = ""
        loc_obj = p.get("workExperienceLocation") or {}
        if isinstance(loc_obj, dict):
            loc = loc_obj.get("raw") or ""

        # Description
        desc = ""
        desc_obj = p.get("workExperienceDescription") or {}
        if isinstance(desc_obj, dict):
            desc = desc_obj.get("parsed") or desc_obj.get("raw") or ""

        if job_title or org or desc:
            work_list.append({
                "title": job_title,
                "company": org,
                "dates": dates_str,
                "location": loc,
                "description": desc,
                "raw": raw,
            })

    return work_list


def _extract_education(data: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract and normalize education entries from Affinda data."""
    edu_list: list[dict[str, Any]] = []
    for edu in (data.get("education") or []):
        if not isinstance(edu, dict):
            continue
        p = edu.get("parsed") or {}
        raw = edu.get("raw") or ""

        # Organization / School
        org = ""
        org_obj = p.get("educationOrganization") or {}
        if isinstance(org_obj, dict):
            org = org_obj.get("parsed") or org_obj.get("raw") or ""

        # Degree / Accreditation
        degree = ""
        acc_obj = p.get("educationAccreditation") or {}
        if isinstance(acc_obj, dict):
            degree = acc_obj.get("raw") or ""
            if not degree:
                dp = acc_obj.get("parsed") or {}
                if isinstance(dp, dict):
                    degree = dp.get("education") or dp.get("input") or ""

        # Dates
        dates_str = ""
        dates_obj = p.get("educationDates") or {}
        if isinstance(dates_obj, dict):
            dates_str = dates_obj.get("raw") or ""

        # Grade / GPA
        grade_str = ""
        grade_obj = p.get("educationGrade") or {}
        if isinstance(grade_obj, dict):
            grade_str = grade_obj.get("raw") or ""

        if org or degree:
            edu_list.append({
                "institution": org,
                "degree": degree,
                "dates": dates_str,
                "grade": grade_str,
                "raw": raw,
            })

    return edu_list


def _extract_skills(data: dict[str, Any]) -> list[str]:
    """Extract, clean, and normalize skills from Affinda data."""
    raw_skills = []
    for s in (data.get("skill") or []):
        if isinstance(s, dict):
            parsed_val = s.get("parsed")
            if isinstance(parsed_val, dict):
                name = parsed_val.get("name")
                if name:
                    raw_skills.append(name)
            elif isinstance(parsed_val, str):
                raw_skills.append(parsed_val)
            elif s.get("raw"):
                raw_skills.append(s["raw"])
        elif isinstance(s, str):
            raw_skills.append(s)

    return normalize_skills_list(raw_skills)


def _extract_certifications(data: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract certification / achievement entries from Affinda data."""
    certs = []
    # Check certification list
    for c in (data.get("certification") or data.get("achievement") or []):
        if isinstance(c, dict):
            name = c.get("raw") or ""
            p = c.get("parsed")
            if isinstance(p, dict):
                name = p.get("name") or name
            if name:
                certs.append({"name": name, "issuer": "", "dates": ""})
        elif isinstance(c, str):
            certs.append({"name": c, "issuer": "", "dates": ""})
    return certs


def _extract_projects(data: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract project entries from Affinda data."""
    projects = []
    for p_item in (data.get("project") or []):
        if isinstance(p_item, dict):
            title = p_item.get("raw") or ""
            desc = ""
            p = p_item.get("parsed")
            if isinstance(p, dict):
                title = p.get("projectTitle", {}).get("parsed") if isinstance(p.get("projectTitle"), dict) else title
                desc = p.get("projectDescription", {}).get("parsed") if isinstance(p.get("projectDescription"), dict) else ""
            if title or desc:
                projects.append({"name": title, "description": desc, "skills": []})
        elif isinstance(p_item, str):
            projects.append({"name": p_item, "description": "", "skills": []})
    return projects


def _extract_languages(data: dict[str, Any]) -> list[str]:
    """Extract language proficiencies from Affinda data."""
    langs = []
    for l_item in (data.get("language") or []):
        if isinstance(l_item, dict):
            p = l_item.get("parsed")
            if isinstance(p, dict):
                name_obj = p.get("languageName") or {}
                if isinstance(name_obj, dict):
                    parsed_lang = name_obj.get("parsed")
                    if isinstance(parsed_lang, dict):
                        l_name = parsed_lang.get("label")
                        if l_name:
                            langs.append(l_name)
                            continue
            raw = l_item.get("raw")
            if raw:
                langs.append(raw.split("(")[0].strip())
        elif isinstance(l_item, str):
            langs.append(l_item.split("(")[0].strip())
    # deduplicate
    return list(dict.fromkeys(langs))


def normalize_affinda_response(resp_json: dict[str, Any]) -> dict[str, Any]:
    """Transform Affinda v3 raw JSON into our canonical internal resume structure."""
    data = resp_json.get("data") or {}

    personal_info = _extract_personal_info(data)
    skills = _extract_skills(data)
    education = _extract_education(data)
    experience = _extract_work_experience(data)
    certifications = _extract_certifications(data)
    projects = _extract_projects(data)
    languages = _extract_languages(data)

    # Total experience years
    total_exp = 0.0
    exp_obj = data.get("totalYearsExperience")
    if isinstance(exp_obj, dict):
        val = exp_obj.get("parsed")
        if isinstance(val, (int, float)):
            total_exp = float(val)
    elif isinstance(exp_obj, (int, float)):
        total_exp = float(exp_obj)

    if total_exp == 0.0 and experience:
        total_exp = float(len(experience) * 1.5)

    raw_text = data.get("rawText") or ""

    return {
        "personal_info": personal_info,
        "skills": skills,
        "education": education,
        "experience": experience,
        "projects": projects,
        "certifications": certifications,
        "languages": languages,
        "total_experience_years": round(total_exp, 1),
        "raw_text": raw_text,
    }


async def parse_resume_with_affinda(file_bytes: bytes, file_name: str) -> dict[str, Any]:
    """Upload resume to Affinda v3 API and return normalized structured data.

    Validates file, checks environment credentials, and handles API errors.
    """
    validate_resume_file(file_bytes, file_name)

    api_key = settings.affinda_api_key
    workspace_id = settings.affinda_workspace_id
    doc_type = settings.affinda_document_type

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Affinda API Key is not configured. Please set AFFINDA_API_KEY in the server environment.",
        )

    headers = {"Authorization": f"Bearer {api_key}"}

    # Guess MIME type
    mime_type, _ = mimetypes.guess_type(file_name)
    if not mime_type:
        mime_type = "application/pdf" if file_name.lower().endswith(".pdf") else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    form_data = {
        "wait": "true",
    }
    if workspace_id:
        form_data["workspace"] = workspace_id
    if doc_type:
        form_data["documentType"] = doc_type

    files = {
        "file": (file_name, file_bytes, mime_type),
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{AFFINDA_API_BASE}/documents",
                headers=headers,
                data=form_data,
                files=files,
            )

        if resp.status_code in (200, 201):
            return normalize_affinda_response(resp.json())

        if resp.status_code in (401, 403):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Affinda API authentication failed. Please verify your AFFINDA_API_KEY in .env.",
            )

        if resp.status_code == 429:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Affinda API rate limit reached. Please try again shortly.",
            )

        if resp.status_code in (400, 422):
            error_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
            detail_msg = error_data.get("detail") or error_data.get("message") or "Affinda was unable to parse the document format."
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Resume parsing error: {detail_msg}",
            )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Affinda API returned error code {resp.status_code}.",
        )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The resume parsing service timed out. Please try again or upload a smaller file.",
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Network error communicating with Affinda API: {str(exc)}",
        )
