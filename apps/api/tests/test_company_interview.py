import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.services.interview_service import interview_service


@pytest.mark.asyncio
async def test_companies_dataset_size_and_schema():
    """Verify that 300+ unique companies are loaded with required schema fields."""
    companies = interview_service.companies
    assert len(companies) >= 300, f"Expected >= 300 companies, got {len(companies)}"

    sample = companies[0]
    required_keys = ["id", "name", "industry", "categories", "difficulty", "preparation_areas", "interview_rounds"]
    for key in required_keys:
        assert key in sample, f"Missing required key '{key}' in company profile"


@pytest.mark.asyncio
async def test_search_and_category_filter():
    """Test searching by company name, category, and A-Z letter."""
    # Search for Google
    google_res = interview_service.list_companies(query="Google")
    assert any(c["name"] == "Google" for c in google_res["companies"])

    # Filter by FAANG / Big Tech
    big_tech = interview_service.list_companies(category="FAANG / Big Tech")
    assert len(big_tech["companies"]) >= 5

    # Filter by letter 'A'
    a_companies = interview_service.list_companies(letter="A")
    assert all(c["name"].upper().startswith("A") for c in a_companies["companies"])


@pytest.mark.asyncio
async def test_api_list_companies_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/interview/companies?query=Amazon")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 1
        assert any(c["name"] == "Amazon" for c in data["companies"])


@pytest.mark.asyncio
async def test_api_company_detail_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/interview/companies/google")
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "Google"
        assert "Data Structures & Algorithms" in data["preparation_areas"]


@pytest.mark.asyncio
async def test_api_company_prep_plan():
    transport = ASGITransport(app=app)
    headers = {"Authorization": "Bearer mock-test-token"}
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/interview/company/plan",
            json={"company_id": "microsoft", "target_role": "Senior Backend Engineer"},
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert "readiness_score" in data
        assert "roadmap_stages" in data
        assert len(data["roadmap_stages"]) == 6
        assert "checklist" in data


@pytest.mark.asyncio
async def test_api_company_question_bank():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/interview/company/questions",
            json={"company_id": "amazon", "category": "DSA"},
        )
        assert res.status_code == 200
        data = res.json()
        assert len(data["questions"]) >= 1
        assert all(q["category"] == "DSA" for q in data["questions"])


@pytest.mark.asyncio
async def test_api_mock_interview_flow():
    transport = ASGITransport(app=app)
    headers = {"Authorization": "Bearer mock-test-token"}
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Start mock session
        start_res = await ac.post(
            "/api/interview/mock/start",
            json={"company_id": "google", "target_role": "Senior Backend Engineer"},
            headers=headers,
        )
        assert start_res.status_code == 200
        start_data = start_res.json()
        session_id = start_data["session_id"]
        assert "initial_message" in start_data

        # Submit answer turn
        turn_res = await ac.post(
            "/api/interview/mock/turn",
            json={"session_id": session_id, "user_answer": "I recently designed a high-throughput microservice in FastAPI with Redis caching and PostgreSQL sharding."},
            headers=headers,
        )
        assert turn_res.status_code == 200
        turn_data = turn_res.json()
        assert "message" in turn_data

        # Evaluate mock session
        eval_res = await ac.post(
            "/api/interview/mock/evaluate",
            json={"session_id": session_id},
            headers=headers,
        )
        assert eval_res.status_code == 200
        eval_data = eval_res.json()
        assert "overall_score" in eval_data
        assert "technical_accuracy" in eval_data or "rubric_scores" in eval_data or "strengths" in eval_data


@pytest.mark.asyncio
async def test_save_company_bookmark_flow():
    transport = ASGITransport(app=app)
    headers = {"Authorization": "Bearer mock-test-token"}
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Save Google
        save_res = await ac.post(
            "/api/interview/save",
            json={"company_id": "google"},
            headers=headers,
        )
        assert save_res.status_code == 200
        assert save_res.json()["is_saved"] is True

        # Get saved
        list_res = await ac.get("/api/interview/saved", headers=headers)
        assert list_res.status_code == 200
        saved_list = list_res.json()["saved_companies"]
        assert any(c["id"] == "google" for c in saved_list)

        # Toggle unsave
        unsave_res = await ac.post(
            "/api/interview/save",
            json={"company_id": "google"},
            headers=headers,
        )
        assert unsave_res.status_code == 200
        assert unsave_res.json()["is_saved"] is False
