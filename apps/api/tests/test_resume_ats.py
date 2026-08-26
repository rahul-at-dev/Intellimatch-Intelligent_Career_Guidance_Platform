"""Comprehensive unit and integration tests for Resume Analysis, Affinda Normalization,
ATS Scoring Engine, and Skill Gap Engine.
"""
import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException

from app.main import app
from app.services.affinda_service import normalize_affinda_response, validate_resume_file
from app.services.ats_engine import calculate_ats_score, ATS_WEIGHTS
from app.services.skill_gap_engine import analyze_skill_gap_against_job
from app.services.skill_normalization import (
    clean_skill_string,
    extract_keywords_from_text,
    extract_skills_from_text,
    normalize_skill,
    normalize_skills_list,
)

client = TestClient(app)


# ---------------------------------------------------------------------------
# 1. Skill Normalization Tests
# ---------------------------------------------------------------------------
def test_skill_normalization_aliases():
    """Verify common tech aliases map to canonical skill names."""
    assert normalize_skill("JS") == "JavaScript"
    assert normalize_skill("js") == "JavaScript"
    assert normalize_skill("React.js") == "React"
    assert normalize_skill("reactjs") == "React"
    assert normalize_skill("Postgres") == "PostgreSQL"
    assert normalize_skill("postgresql") == "PostgreSQL"
    assert normalize_skill("py") == "Python"
    assert normalize_skill("k8s") == "Kubernetes"
    assert normalize_skill("aws") == "AWS"
    assert normalize_skill("springboot") == "Spring Boot"
    assert normalize_skill("ts") == "TypeScript"
    assert normalize_skill("golang") == "Go"


def test_affinda_taxonomy_tag_cleanup():
    """Verify Affinda category suffixes are cleanly stripped."""
    assert clean_skill_string("Python (Programming Language)") == "Python"
    assert clean_skill_string("Docker (Software)") == "Docker"
    assert clean_skill_string("Django (Web Framework)") == "Django"
    assert clean_skill_string("Git (Version Control System)") == "Git"

    # Normalized versions
    assert normalize_skill("Python (Programming Language)") == "Python"
    assert normalize_skill("Docker (Software)") == "Docker"
    assert normalize_skill("Git (Version Control System)") == "Git"
    assert normalize_skill("Amazon Web Services") == "AWS"


def test_extract_skills_from_jd():
    """Verify skill extraction from unstructured Job Description text."""
    jd_text = """
    We are seeking a Senior Backend Engineer proficient in Python, FastAPI, and PostgreSQL.
    Experience with Docker containerization, AWS cloud, and Git CI/CD is required.
    Familiarity with React or Next.js is a plus.
    """
    extracted = extract_skills_from_text(jd_text)
    assert "Python" in extracted
    assert "FastAPI" in extracted
    assert "PostgreSQL" in extracted
    assert "Docker" in extracted
    assert "AWS" in extracted
    assert "Git" in extracted
    assert "React" in extracted


# ---------------------------------------------------------------------------
# 2. Deterministic Benchmark Test (From Specification)
# ---------------------------------------------------------------------------
def test_deterministic_sample_skill_gap():
    """Deterministic prompt specification:
    Resume skills: Java, Spring Boot, SQL, Git
    Job skills: Java, Spring Boot, SQL, Docker, AWS, Git
    Expected:
      Matched = Java, Spring Boot, SQL, Git
      Missing = Docker, AWS
      Skill match = 4/6 (66.7%)
    """
    resume_skills = ["Java", "Spring Boot", "SQL", "Git"]
    job_skills = ["Java", "Spring Boot", "SQL", "Docker", "AWS", "Git"]

    result = analyze_skill_gap_against_job(resume_skills, job_skills)

    matched = sorted(result["matched_skills"])
    missing = sorted(result["missing_skills"])

    assert matched == ["Git", "Java", "SQL", "Spring Boot"]
    assert missing == ["AWS", "Docker"]
    assert result["skill_gap_percentage"] == round((2 / 6) * 100, 1)  # 33.3%

    # Priority check
    missing_skill_names = [p["skill"] for p in result["priority_skills"]]
    assert "AWS" in missing_skill_names
    assert "Docker" in missing_skill_names


# ---------------------------------------------------------------------------
# 3. ATS Scoring Engine Tests
# ---------------------------------------------------------------------------
def test_ats_mode_1_resume_only():
    """Test Mode 1: ATS evaluation with only resume data (no job description)."""
    resume_doc = {
        "personal_info": {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "phone": "+1-555-0100",
            "location": "Seattle, WA",
            "summary": "Experienced Full Stack Software Engineer with 5 years building scalable web applications and REST APIs.",
        },
        "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "AWS", "Git", "SQL", "Redis"],
        "education": [{"degree": "Bachelor of Science in Computer Science", "institution": "University of Washington"}],
        "experience": [
            {
                "title": "Software Engineer",
                "company": "TechCorp",
                "dates": "2021 - Present",
                "description": "Architected microservices in Python and FastAPI, reducing latency by 40%.",
            }
        ],
        "total_experience_years": 4.0,
        "raw_text": "Jane Doe Software Engineer Python FastAPI React PostgreSQL Docker AWS Git SQL Redis developed built engineered",
    }

    result = calculate_ats_score(resume_doc)
    assert result["mode"] == "resume_only"
    assert 0 <= result["ats_score"] <= 100
    assert "breakdown" in result
    assert result["breakdown"]["structure_score"] > 70
    assert result["breakdown"]["skill_match"] > 70
    assert len(result["recommendations"]) > 0
    assert "disclaimer" in result


def test_ats_mode_2_with_job_description():
    """Test Mode 2: ATS evaluation comparing resume against target Job Description."""
    resume_doc = {
        "personal_info": {
            "name": "Alex Smith",
            "email": "alex@example.com",
            "phone": "+1-555-0122",
            "location": "Austin, TX",
            "summary": "Backend developer with expertise in Java, Spring Boot, SQL, and Git.",
        },
        "skills": ["Java", "Spring Boot", "SQL", "Git"],
        "education": [{"degree": "B.S. in Computer Science", "institution": "UT Austin"}],
        "experience": [
            {
                "title": "Junior Developer",
                "company": "AppCo",
                "dates": "2022 - 2024",
                "description": "Implemented database queries in SQL and built REST APIs with Spring Boot.",
            }
        ],
        "total_experience_years": 2.0,
        "raw_text": "Alex Smith Java Spring Boot SQL Git Bachelor of Science Computer Science REST APIs",
    }

    job_description = """
    Looking for a Backend Engineer with 3+ years of experience.
    Requirements:
    - Proficiency in Java, Spring Boot, SQL, Git
    - Hands-on experience with Docker and AWS
    - Bachelor's degree in Computer Science or related field
    """

    result = calculate_ats_score(resume_doc, job_description=job_description)
    assert result["mode"] == "resume_and_job"
    assert 0 <= result["ats_score"] <= 100

    breakdown = result["breakdown"]
    assert "skill_match" in breakdown
    assert "experience_match" in breakdown
    assert "keyword_match" in breakdown
    assert "education_match" in breakdown
    assert "structure_score" in breakdown

    # Matched & Missing
    assert "Java" in result["matched_skills"]
    assert "Spring Boot" in result["matched_skills"]
    assert "Docker" in result["missing_skills"]
    assert "AWS" in result["missing_skills"]

    # Recommendations should suggest missing skills
    rec_text = " ".join(result["recommendations"])
    assert "Docker" in rec_text or "AWS" in rec_text


# ---------------------------------------------------------------------------
# 4. Affinda Normalization & Validation Tests
# ---------------------------------------------------------------------------
def test_validate_resume_file_invalid_type():
    """Ensure invalid file extensions are rejected with 400 Bad Request."""
    with pytest.raises(HTTPException) as exc:
        validate_resume_file(b"some content", "image.png")
    assert exc.value.status_code == 400
    assert "Unsupported file type" in exc.value.detail


def test_validate_resume_file_empty():
    """Ensure empty file bytes are rejected with 400 Bad Request."""
    with pytest.raises(HTTPException) as exc:
        validate_resume_file(b"", "resume.pdf")
    assert exc.value.status_code == 400
    assert "empty" in exc.value.detail


def test_normalize_affinda_mock_data():
    """Verify internal normalization of Affinda response schema."""
    affinda_raw = {
        "data": {
            "candidateName": {"raw": "John Doe"},
            "email": [{"raw": "john@doe.com"}],
            "phoneNumber": [{"parsed": {"formattedNumber": "+1 234 567 8900"}}],
            "location": {"raw": "New York, NY"},
            "website": [{"parsed": {"url": "https://github.com/johndoe"}}],
            "summary": {"parsed": "Senior Software Engineer"},
            "skill": [
                {"parsed": {"name": "Python (Programming Language)"}},
                {"parsed": {"name": "Docker (Software)"}},
                {"parsed": {"name": "Postgres"}},
            ],
            "education": [
                {
                    "parsed": {
                        "educationOrganization": {"parsed": "MIT"},
                        "educationAccreditation": {"raw": "Bachelor of Science"},
                        "educationDates": {"raw": "2016 - 2020"},
                    }
                }
            ],
            "workExperience": [
                {
                    "parsed": {
                        "workExperienceJobTitle": {"parsed": "Lead Developer"},
                        "workExperienceOrganization": {"parsed": "Acme Corp"},
                        "workExperienceDates": {"raw": "2020 - Present"},
                        "workExperienceDescription": {"parsed": "Built high performance microservices in Python."},
                    }
                }
            ],
            "totalYearsExperience": {"parsed": 4.5},
            "language": [{"parsed": {"languageName": {"parsed": {"label": "English"}}}}],
            "rawText": "John Doe Senior Software Engineer Python Docker Postgres MIT Acme Corp",
        }
    }

    normalized = normalize_affinda_response(affinda_raw)

    assert normalized["personal_info"]["name"] == "John Doe"
    assert normalized["personal_info"]["email"] == "john@doe.com"
    assert normalized["personal_info"]["phone"] == "+1 234 567 8900"
    assert normalized["skills"] == ["Python", "Docker", "PostgreSQL"]
    assert normalized["total_experience_years"] == 4.5
    assert len(normalized["education"]) == 1
    assert normalized["education"][0]["institution"] == "MIT"
    assert len(normalized["experience"]) == 1
    assert normalized["experience"][0]["title"] == "Lead Developer"


# ---------------------------------------------------------------------------
# 5. API Router Integration Tests
# ---------------------------------------------------------------------------
def test_api_resume_analyze_fallback():
    """Verify POST /api/resume/analyze succeeds with default or empty upload."""
    r = client.post("/api/resume/analyze")
    assert r.status_code == 200
    body = r.json()
    assert "ats_score" in body
    assert "breakdown" in body
    assert "skills_found" in body
    assert "recommendations" in body
    assert "structured_data" in body


def test_api_resume_ats_score_endpoint():
    """Verify POST /api/resume/ats-score direct scoring."""
    payload = {
        "resume_text": "Experienced engineer with Python, FastAPI, PostgreSQL, and Docker.",
        "resume_skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "job_description": "Seeking Python engineer with Docker and AWS experience.",
    }
    r = client.post("/api/resume/ats-score", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "ats_score" in body
    assert "breakdown" in body
    assert "Python" in body["matched_skills"]
    assert "AWS" in body["missing_skills"]


def test_api_resume_skill_gap_endpoint():
    """Verify POST /api/resume/skill-gap direct gap analysis."""
    payload = {
        "resume_skills": ["Java", "Spring Boot", "SQL", "Git"],
        "job_description": "Requirements: Java, Spring Boot, SQL, Docker, AWS, Git",
    }
    r = client.post("/api/resume/skill-gap", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "matched_skills" in body
    assert "missing_skills" in body
    assert "skill_gap_percentage" in body
    assert "AWS" in body["missing_skills"]
    assert "Docker" in body["missing_skills"]
