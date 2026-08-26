"""Unit and integration tests for Adzuna Market Insights module."""
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.services.adzuna_service import (
    AdzunaService,
    format_salary_bucket_label,
    normalize_adzuna_job,
    _adzuna_market_cache,
)
from app.services.market_insights_service import (
    calculate_market_alignment,
    calculate_skill_priorities,
    market_insights_service,
)
from app.services.skill_service import analyze_skill_gap, get_market_demand


client = TestClient(app)


# ---------------------------------------------------------------------------
# 1. Salary Bucket Formatting Tests
# ---------------------------------------------------------------------------
def test_format_salary_bucket_label_inr():
    assert format_salary_bucket_label(0, 1000000, country="in") == "₹0L – ₹10L"
    assert format_salary_bucket_label(1000000, 2000000, country="in") == "₹10L – ₹20L"
    assert format_salary_bucket_label(5000000, None, country="in") == "₹50L+"


def test_format_salary_bucket_label_usd():
    assert format_salary_bucket_label(0, 50000, country="us") == "$0k – $50k"
    assert format_salary_bucket_label(100000, 150000, country="us") == "$100k – $150k"
    assert format_salary_bucket_label(200000, None, country="us") == "$200k+"


# ---------------------------------------------------------------------------
# 2. Normalization Tests
# ---------------------------------------------------------------------------
def test_normalize_adzuna_job():
    raw_item = {
        "id": "123456",
        "title": "<strong>Senior Python Developer</strong>",
        "company": {"display_name": "Tech Corp"},
        "location": {"display_name": "Bangalore, India"},
        "description": "We are seeking a Python and AWS backend developer with Docker experience.",
        "salary_min": 1500000,
        "salary_max": 2500000,
        "contract_time": "full_time",
        "category": {"label": "IT Jobs"},
        "created": "2026-08-01T00:00:00Z",
    }
    job = normalize_adzuna_job(raw_item, country="in")

    assert job["id"] == "123456"
    assert job["title"] == "Senior Python Developer"
    assert job["company"] == "Tech Corp"
    assert job["location"] == "Bangalore, India"
    assert job["seniority"] == "Senior"
    assert job["currency"] == "INR"
    assert job["salary_min"] == 1500000.0
    assert job["salary_max"] == 2500000.0
    assert "Python" in job["skills"]
    assert "AWS" in job["skills"]
    assert "Docker" in job["skills"]


# ---------------------------------------------------------------------------
# 3. Deterministic Skill Demand Calculation Test
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_deterministic_skill_demand_calculation():
    """Verify that skill demand percentage is computed exactly from sample JDs."""
    service = AdzunaService()

    # Generate 100 mock job postings
    mock_jobs = []
    for i in range(100):
        skills_in_job = []
        if i < 78:
            skills_in_job.append("Python")
        if i < 61:
            skills_in_job.append("AWS")
        if i < 54:
            skills_in_job.append("Docker")
        if i < 30:
            skills_in_job.append("Kubernetes")

        desc = f"Looking for developer skilled in {', '.join(skills_in_job)}."
        mock_jobs.append({
            "id": f"job-{i}",
            "title": "Software Engineer",
            "description": desc,
            "skills": skills_in_job,
        })

    with patch.object(service, "search_jobs", return_value=mock_jobs):
        result = await service.analyze_skill_demand(query="Software Engineer", target_sample_size=100)

        assert result["sample_size"] == 100
        skills = {s["skill"]: s["demand_percentage"] for s in result["skills"]}

        assert skills.get("Python") == 78.0
        assert skills.get("AWS") == 61.0
        assert skills.get("Docker") == 54.0
        assert skills.get("Kubernetes") == 30.0


# ---------------------------------------------------------------------------
# 4. Market Alignment Calculation Test
# ---------------------------------------------------------------------------
def test_calculate_market_alignment():
    candidate_skills = ["Python", "Java", "SQL", "Spring Boot"]
    market_skills = [
        {"skill": "Python", "demand_percentage": 78.0},
        {"skill": "Java", "demand_percentage": 72.0},
        {"skill": "SQL", "demand_percentage": 69.0},
        {"skill": "AWS", "demand_percentage": 61.0},
        {"skill": "Docker", "demand_percentage": 54.0},
        {"skill": "Kubernetes", "demand_percentage": 38.0},
    ]

    alignment = calculate_market_alignment(
        candidate_skills=candidate_skills,
        market_skills=market_skills,
        target_role="Software Engineer",
    )

    assert alignment is not None
    # Matched skills: Python (78) + Java (72) + SQL (69) = 219
    # Total top market demand: 78 + 72 + 69 + 61 + 54 + 38 = 372
    # Alignment: (219 / 372) * 100 ≈ 58.9%
    assert alignment["score"] == pytest.approx(58.9, abs=0.2)

    strong_names = [s["skill"] for s in alignment["strong_skills"]]
    assert "Python" in strong_names
    assert "Java" in strong_names
    assert "SQL" in strong_names

    gap_names = [s["skill"] for s in alignment["gap_skills"]]
    assert "AWS" in gap_names
    assert "Docker" in gap_names
    assert "Kubernetes" in gap_names

    assert "Python" in alignment["summary"]
    assert "AWS" in alignment["summary"]


# ---------------------------------------------------------------------------
# 5. Skill Priority Calculation Test
# ---------------------------------------------------------------------------
def test_calculate_skill_priorities():
    candidate_skills = ["Python", "SQL"]
    market_skills = [
        {"skill": "Python", "demand_percentage": 78.0, "job_count": 78},
        {"skill": "AWS", "demand_percentage": 61.0, "job_count": 61},
        {"skill": "Docker", "demand_percentage": 54.0, "job_count": 54},
        {"skill": "Kubernetes", "demand_percentage": 38.0, "job_count": 38},
        {"skill": "Rust", "demand_percentage": 10.0, "job_count": 10},
    ]

    priorities = calculate_skill_priorities(
        candidate_skills=candidate_skills,
        market_skills=market_skills,
        target_role="Backend Developer",
    )

    # Python should be skipped since candidate has it
    prio_skills = [p["skill"] for p in priorities]
    assert "Python" not in prio_skills
    assert prio_skills[0] in ["AWS", "Docker"]
    assert priorities[0]["priority"] == "High"
    assert "Kubernetes" in prio_skills


# ---------------------------------------------------------------------------
# 6. Cache Behavior Test
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_adzuna_market_cache():
    service = AdzunaService()
    _adzuna_market_cache.clear()

    mock_bundle = {
        "count": 1000,
        "mean": 1200000.0,
    }

    with patch.object(service, "get_raw_search_meta", return_value=mock_bundle), \
         patch.object(service, "get_salary_history", return_value=[]), \
         patch.object(service, "get_salary_histogram", return_value=[]), \
         patch.object(service, "get_top_companies", return_value=[]), \
         patch.object(service, "get_regional_demand", return_value=[]), \
         patch.object(service, "analyze_skill_demand", return_value={"skills": [], "sample_size": 20}):

        res1 = await service.get_market_insights_bundle("Data Engineer", country="in", force_refresh=False)
        assert res1["is_cached"] is False

        # Second call should hit the cache
        res2 = await service.get_market_insights_bundle("Data Engineer", country="in", force_refresh=False)
        assert res2["is_cached"] is True


# ---------------------------------------------------------------------------
# 7. Integration with Skill Gap Engine Test
# ---------------------------------------------------------------------------
def test_skill_gap_with_market_insights():
    # Inject cached market insights with real values
    _adzuna_market_cache["in:senior backend engineer:all"] = (
        9999999999.0,
        {
            "skills_in_demand": [
                {"skill": "System Design", "demand_percentage": 75.0},
                {"skill": "AWS", "demand_percentage": 65.0},
                {"skill": "Kubernetes", "demand_percentage": 45.0},
            ]
        },
    )

    demand_aws = get_market_demand("AWS", role="Senior Backend Engineer", country="in")
    assert demand_aws == 0.65

    gaps = analyze_skill_gap("Senior Backend Engineer", candidate_skills={"AWS": 2.0})
    aws_gap = next((g for g in gaps if g["skill"] == "AWS"), None)
    assert aws_gap is not None
    assert aws_gap["market_demand"] == 0.65


# ---------------------------------------------------------------------------
# 8. API Endpoint GET /api/market/insights Test
# ---------------------------------------------------------------------------
def test_api_market_insights_endpoint():
    response = client.get("/api/market/insights?role=Software%20Engineer&country=in")
    assert response.status_code == 200
    data = response.json()

    assert "role" in data
    assert "job_count" in data
    assert "currency" in data
    assert "salary_trend" in data
    assert "salary_distribution" in data
    assert "top_companies" in data
    assert "top_locations" in data
    assert "skills_in_demand" in data
    assert data["data_source"] == "Adzuna"
