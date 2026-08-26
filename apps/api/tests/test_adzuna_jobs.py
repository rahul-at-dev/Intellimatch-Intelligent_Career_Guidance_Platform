"""Tests for Adzuna Jobs Integration, Normalization, IntelliMatch Scoring, and Saved Jobs."""
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.services.adzuna_service import normalize_adzuna_job, adzuna_service
from app.services.matching_service import compute_intellimatch_score

client = TestClient(app)

SAMPLE_ADZUNA_RAW_JOB = {
    "id": "5846723249",
    "title": "Senior Java Developer",
    "contract_time": "full_time",
    "description": "Building cloud microservices with Java, Spring Boot, and PostgreSQL in Bangalore. Remote work available.",
    "redirect_url": "https://www.adzuna.in/land/ad/5846723249",
    "location": {
        "display_name": "Bangalore, Karnataka",
        "area": ["India", "Karnataka", "Bangalore"],
    },
    "company": {
        "display_name": "Acme Tech Solutions",
    },
    "category": {
        "label": "IT Jobs",
        "tag": "it-jobs",
    },
    "salary_min": 1200000.0,
    "salary_max": 1800000.0,
    "created": "2026-08-18T18:03:36Z",
}


def test_normalize_adzuna_job():
    """Ensure raw Adzuna payload normalizes into internal IntelliMatch Job model."""
    job = normalize_adzuna_job(SAMPLE_ADZUNA_RAW_JOB, country="in")
    assert job["id"] == "5846723249"
    assert job["title"] == "Senior Java Developer"
    assert job["company"] == "Acme Tech Solutions"
    assert job["location"] == "Bangalore, Karnataka"
    assert job["remote"] is True
    assert job["seniority"] == "Senior"
    assert job["salary_min"] == 1200000.0
    assert job["salary_max"] == 1800000.0
    assert job["currency"] == "INR"
    assert job["source"] == "Adzuna"
    assert job["redirect_url"] == "https://www.adzuna.in/land/ad/5846723249"
    assert "Java" in job["skills"] or "Spring Boot" in job["skills"] or "PostgreSQL" in job["skills"]


def test_compute_intellimatch_score():
    """Ensure IntelliMatch score calculates 0-100% with matched and missing skills."""
    candidate = {
        "full_name": "Rahul I",
        "target_role": "Senior Java Developer",
        "years_experience": 4.0,
        "skills": {"Java": 4.0, "Spring Boot": 3.5, "PostgreSQL": 3.0},
    }
    job = normalize_adzuna_job(SAMPLE_ADZUNA_RAW_JOB, country="in")
    # Add a required skill candidate doesn't have
    job["skills"] = ["Java", "Spring Boot", "Docker", "AWS"]

    match = compute_intellimatch_score(candidate, job)
    assert match["job_id"] == "5846723249"
    assert match["match_score"] > 50.0
    assert "Java" in match["matched_skills"]
    assert "Spring Boot" in match["matched_skills"]
    assert "Docker" in match["missing_skills"]
    assert "AWS" in match["missing_skills"]
    assert len(match["explanation"]) > 10


def test_api_jobs_search_mocked():
    """Ensure /api/jobs/search endpoint invokes Adzuna service and returns results."""
    mock_jobs = [
        normalize_adzuna_job(SAMPLE_ADZUNA_RAW_JOB, country="in"),
    ]
    with patch.object(adzuna_service, "search_jobs", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = mock_jobs
        r = client.post("/api/jobs/search", json={"query": "Java", "remote_only": False})
        assert r.status_code == 200
        body = r.json()
        assert body["count"] == 1
        assert body["jobs"][0]["title"] == "Senior Java Developer"
        assert body["jobs"][0]["company"] == "Acme Tech Solutions"


def test_api_job_detail_and_match():
    """Ensure single job detail and match calculation work via API."""
    job = normalize_adzuna_job(SAMPLE_ADZUNA_RAW_JOB, country="in")
    adzuna_service.cache_job(job)

    # 1. Get job details
    r_detail = client.get("/api/jobs/5846723249")
    assert r_detail.status_code == 200
    assert r_detail.json()["id"] == "5846723249"

    # 2. Get match score
    r_match = client.get("/api/jobs/5846723249/match")
    assert r_match.status_code == 200
    match_body = r_match.json()
    assert match_body["job_id"] == "5846723249"
    assert "match_score" in match_body
    assert "matched_skills" in match_body


def test_api_saved_jobs_flow():
    """Ensure saving, listing, and unsaving jobs works per user."""
    job = normalize_adzuna_job(SAMPLE_ADZUNA_RAW_JOB, country="in")
    adzuna_service.cache_job(job)

    # 1. Save job
    r_save = client.post("/api/jobs/saved/5846723249", json=job)
    assert r_save.status_code == 200
    assert r_save.json()["status"] == "saved"

    # 2. List saved jobs
    r_list = client.get("/api/jobs/saved")
    assert r_list.status_code == 200
    saved_jobs = r_list.json()["jobs"]
    assert any(j["id"] == "5846723249" for j in saved_jobs)

    # 3. Unsave job
    r_del = client.delete("/api/jobs/saved/5846723249")
    assert r_del.status_code == 200
    assert r_del.json()["status"] == "removed"
