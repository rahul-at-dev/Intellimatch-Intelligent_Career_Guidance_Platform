"""Unit and integration tests for OpenRouter AI service and AI-powered endpoints."""
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.services.openrouter_service import (
    OpenRouterService,
    LearningPathPlan,
    AssessmentBatch,
    _extract_and_parse_json,
    _openrouter_cache,
)
from app.services.growth_service import (
    compute_skill_roi,
    evaluate_assessment,
)


client = TestClient(app)


# ---------------------------------------------------------------------------
# 1. JSON Extraction and Parsing Tests
# ---------------------------------------------------------------------------
def test_extract_and_parse_json_raw():
    raw = '{"summary": "Test summary", "estimated_hours": 25}'
    parsed = _extract_and_parse_json(raw)
    assert parsed["summary"] == "Test summary"
    assert parsed["estimated_hours"] == 25


def test_extract_and_parse_json_markdown_block():
    raw = '```json\n{"summary": "Markdown summary", "estimated_hours": 30}\n```'
    parsed = _extract_and_parse_json(raw)
    assert parsed["summary"] == "Markdown summary"
    assert parsed["estimated_hours"] == 30


def test_extract_and_parse_json_with_surrounding_text():
    raw = 'Here is the requested output:\n{"summary": "Surrounded summary", "estimated_hours": 15}\nHope this helps!'
    parsed = _extract_and_parse_json(raw)
    assert parsed["summary"] == "Surrounded summary"
    assert parsed["estimated_hours"] == 15


# ---------------------------------------------------------------------------
# 2. Missing API Key & Error Handling Tests
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_openrouter_missing_api_key_raises_error():
    service = OpenRouterService()
    with patch.object(settings, "openrouter_api_key", None):
        with pytest.raises(RuntimeError) as exc_info:
            await service.call_llm("System", "User")
        assert "AI service is not configured" in str(exc_info.value)


@pytest.mark.asyncio
async def test_openrouter_rate_limit_error_handling():
    service = OpenRouterService()
    with patch.object(settings, "openrouter_api_key", "test-key"), \
         patch("httpx.AsyncClient.post") as mock_post:
        mock_resp = AsyncMock()
        mock_resp.status_code = 429
        mock_post.return_value = mock_resp

        with pytest.raises(RuntimeError) as exc_info:
            await service.call_llm("System", "User")
        assert "rate-limited" in str(exc_info.value)


# ---------------------------------------------------------------------------
# 3. Learning Path Generation Test
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_generate_learning_path_with_real_context():
    service = OpenRouterService()
    _openrouter_cache.clear()

    mock_plan = LearningPathPlan(
        skill="AWS",
        summary="Master cloud architecture for backend systems.",
        estimated_hours=32,
        stages=[
            {
                "name": "Stage 1: Core Compute & Storage",
                "duration_hours": 10,
                "description": "EC2, S3, and IAM basics.",
                "topics": ["IAM Policies", "EC2 Instances", "S3 Buckets"],
                "deliverables": ["Launch EC2 instance", "Configure secure S3 bucket"],
            }
        ],
        project={"title": "Serverless API", "description": "Deploy FastAPI on AWS Lambda."},
        assessment_topics=["IAM", "EC2", "S3", "Lambda"],
    )

    with patch.object(service, "generate_structured", return_value=mock_plan):
        result = await service.generate_learning_path(
            skill="AWS",
            current_level=1.0,
            required_level=4.0,
            gap=3.0,
            market_demand_pct=61.0,
            target_role="Senior Backend Engineer",
            existing_skills=["Python", "PostgreSQL"],
            user_id="user_123",
        )

        assert result["skill"] == "AWS"
        assert result["estimated_hours"] == 32
        assert len(result["stages"]) == 1
        assert "Serverless API" in result["project"]
        assert len(result["assessment_topics"]) == 4


# ---------------------------------------------------------------------------
# 4. Assessment Evaluation Test (Deterministic Scoring)
# ---------------------------------------------------------------------------
def test_evaluate_assessment_deterministic_scoring():
    answers = [
        {"question": "Q1", "user_answer": 0, "correct_answer": 0, "explanation": "Correct answer"},
        {"question": "Q2", "user_answer": 1, "correct_answer": 2, "explanation": "Option C is correct"},
        {"question": "Q3", "user_answer": 3, "correct_answer": 3, "explanation": "Option D is correct"},
        {"question": "Q4", "user_answer": 0, "correct_answer": 0, "explanation": "Option A is correct"},
        {"question": "Q5", "user_answer": 2, "correct_answer": 1, "explanation": "Option B is correct"},
    ]

    # 3 out of 5 correct => exactly 60.0%
    result = evaluate_assessment(answers)
    assert result["score"] == 60.0
    assert result["correct_count"] == 3
    assert result["total_questions"] == 5
    assert result["breakdown"][0]["is_correct"] is True
    assert result["breakdown"][1]["is_correct"] is False


# ---------------------------------------------------------------------------
# 5. Deterministic Skill ROI Ranking Test
# ---------------------------------------------------------------------------
def test_deterministic_skill_roi_formula():
    skills = {"Python": 4.0, "SQL": 3.5, "AWS": 0.0}
    roi_rows = compute_skill_roi(skills)

    assert len(roi_rows) > 0
    # Verified: ROI values must be floats between 0 and 10, sorted descending
    for r in roi_rows:
        assert isinstance(r["roi"], float)
        assert r["roi"] >= 0.0
        assert "skill" in r
        assert "demand" in r
        assert "current_gap" in r

    # Must be sorted descending by ROI
    for i in range(len(roi_rows) - 1):
        assert roi_rows[i]["roi"] >= roi_rows[i + 1]["roi"]


# ---------------------------------------------------------------------------
# 6. User Cache Isolation Test
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_user_cache_isolation():
    service = OpenRouterService()
    _openrouter_cache.clear()

    service._set_cache("user_A:learning_path:aws:backend", {"cached_for": "user_A"})
    service._set_cache("user_B:learning_path:aws:backend", {"cached_for": "user_B"})

    assert service._get_cache("user_A:learning_path:aws:backend")["cached_for"] == "user_A"
    assert service._get_cache("user_B:learning_path:aws:backend")["cached_for"] == "user_B"

    # Invalidate user_A only
    service.invalidate_user_cache("user_A")
    assert service._get_cache("user_A:learning_path:aws:backend") is None
    assert service._get_cache("user_B:learning_path:aws:backend") is not None


# ---------------------------------------------------------------------------
# 7. End-to-End API Routes Integration Tests
# ---------------------------------------------------------------------------
def test_api_learning_path_route():
    mock_plan = LearningPathPlan(
        skill="Docker",
        summary="Master container fundamentals.",
        estimated_hours=20,
        stages=[],
        project={"title": "Docker API", "description": "Containerize app."},
        assessment_topics=["Dockerfiles", "Compose"],
    )
    with patch.object(OpenRouterService, "generate_structured", return_value=mock_plan):
        response = client.post("/api/learning/path", json={"skills": ["Docker"]})
        assert response.status_code == 200
        data = response.json()
        assert "paths" in data
        assert len(data["paths"]) > 0
        assert data["paths"][0]["skill"] == "Docker"


def test_api_assessment_evaluate_route():
    response = client.post(
        "/api/assessment/evaluate",
        json={
            "answers": [
                {"question": "Q1", "user_answer": 0, "correct_answer": 0},
                {"question": "Q2", "user_answer": 1, "correct_answer": 1},
            ]
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 100.0
    assert data["correct_count"] == 2


def test_api_career_roadmap_route():
    with patch.object(OpenRouterService, "call_llm", return_value="Transition requires closing core system design gaps."):
        response = client.post("/api/career/roadmap", json={"current_role": "Backend Engineer"})
        assert response.status_code == 200
        data = response.json()
        assert "stages" in data
        assert len(data["stages"]) > 0
        assert "from_role" in data["stages"][0]
        assert "to_role" in data["stages"][0]
        assert "explanation" in data["stages"][0]


def test_api_interview_prep_route():
    with patch.object(OpenRouterService, "generate_structured") as mock_gen:
        from app.services.openrouter_service import InterviewPrepBatch, InterviewQuestion
        mock_gen.return_value = InterviewPrepBatch(
            target_role="Senior Backend Engineer",
            questions=[
                InterviewQuestion(
                    type="Technical Concept",
                    prompt="Explain database indexing B-trees vs LSM trees.",
                    context="Core database internals",
                    suggested_approach="Contrast write throughput vs read latency.",
                )
            ]
        )
        response = client.post("/api/interview/generate", json={"target_role": "Senior Backend Engineer"})
        assert response.status_code == 200
        data = response.json()
        assert "questions" in data
        assert len(data["questions"]) > 0
        assert data["questions"][0]["type"] == "Technical Concept"

