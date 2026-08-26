"""GitHub skill-evidence provider. Real GitHub API when a token is configured,
otherwise a deterministic mock profile so verification flows still work."""
from __future__ import annotations

import httpx

from app.core.config import settings


async def analyze_github(username: str) -> dict:
    if settings.github_token:
        async with httpx.AsyncClient(timeout=15) as client:
            headers = {"Authorization": f"token {settings.github_token}"}
            try:
                repos_resp = await client.get(
                    f"https://api.github.com/users/{username}/repos", headers=headers
                )
                repos_resp.raise_for_status()
                repos = repos_resp.json()
                languages = {r["language"] for r in repos if r.get("language")}
                return _build_result(username, repos, list(languages), source="github_api")
            except httpx.HTTPError:
                pass  # fall through to mock on any failure

    mock_repos = [
        {"name": "distributed-task-queue", "language": "Python", "topics": ["celery", "redis", "docker"]},
        {"name": "react-dashboard-kit", "language": "TypeScript", "topics": ["react", "nextjs", "tailwind"]},
        {"name": "ml-ranking-experiments", "language": "Python", "topics": ["lightgbm", "scikit-learn"]},
    ]
    return _build_result(username, mock_repos, ["Python", "TypeScript"], source="mock")


def _build_result(username: str, repos: list[dict], languages: list[str], source: str) -> dict:
    evidence_topics = set()
    for r in repos:
        evidence_topics.update(r.get("topics", []))

    skill_map = {}
    for lang in languages:
        skill_map[lang] = "Verified"
    for topic in evidence_topics:
        skill_map[topic] = "Partial Evidence"

    return {
        "username": username,
        "source": source,
        "repo_count": len(repos),
        "languages": languages,
        "repos": repos,
        "skill_map": skill_map,
        "disclaimer": "GitHub activity is supporting evidence, not proof of skill mastery.",
    }
