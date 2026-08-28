import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "online"


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_cors_preflight_vercel():
    r = client.options(
        "/api/matching/run",
        headers={
            "Origin": "https://intellimatch-intelligent-career-gui.vercel.app",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin") == "https://intellimatch-intelligent-career-gui.vercel.app"


def test_cors_preflight_wildcard_vercel():
    r = client.options(
        "/api/matching/run",
        headers={
            "Origin": "https://random-branch-deploy.vercel.app",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin") == "https://random-branch-deploy.vercel.app"


def test_profile():
    r = client.get("/api/profile")
    assert r.status_code == 200
    assert "skills" in r.json()


def test_resume_analyze_no_file():
    r = client.post("/api/resume/analyze")
    assert r.status_code == 200
    body = r.json()
    assert "skills_found" in body
    assert isinstance(body["skills_found"], list)
    assert body["ats_score"] >= 0


def test_jobs_search():
    r = client.post("/api/jobs/search", json={"query": "Backend"})
    assert r.status_code == 200
    assert r.json()["count"] > 0


def test_job_not_found():
    r = client.get("/api/jobs/does-not-exist")
    assert r.status_code == 404


def test_matching_run():
    r = client.post("/api/matching/run", json={"top_k": 5, "explain": False})
    assert r.status_code == 200
    results = r.json()["results"]
    assert len(results) == 5
    scores = [x["match_score"] for x in results]
    assert scores == sorted(scores, reverse=True)


def test_skill_gap_analysis():
    r = client.post("/api/skills/gap-analysis", json={"target_role": "Senior Backend Engineer"})
    assert r.status_code == 200
    gaps = r.json()["gaps"]
    assert all("importance" in g for g in gaps)


def test_skill_graph():
    r = client.get("/api/skills/graph")
    assert r.status_code == 200
    assert "nodes" in r.json()


def test_career_simulate():
    r = client.post("/api/career/simulate", json={"skills": ["AWS", "Docker"]})
    assert r.status_code == 200
    body = r.json()
    assert "baseline" in body and "projected" in body


def test_skill_roi():
    r = client.post("/api/skill/roi", json={})
    assert r.status_code == 200
    assert len(r.json()["ranked_skills"]) > 0


def test_github_analyze():
    r = client.post("/api/github/analyze", json={"username": "demo-user"})
    assert r.status_code == 200
    assert r.json()["repo_count"] > 0


def test_market_insights():
    r = client.get("/api/market/insights")
    assert r.status_code == 200
    assert "skills_in_demand" in r.json()
    assert "job_count" in r.json()



def test_assistant_chat():
    r = client.post("/api/assistant/chat", json={"message": "what should i learn next"})
    assert r.status_code == 200
    assert r.json()["type"] == "skill_roi_cards"


def test_invalid_assistant_message_rejected():
    r = client.post("/api/assistant/chat", json={"message": ""})
    assert r.status_code == 422  # validation: min_length=1
