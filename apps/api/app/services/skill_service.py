"""Skill gap analysis + proficiency estimation. Proficiency is estimated (not measured)
from multiple weak-supervision evidence signals; always labeled as an estimate."""
from __future__ import annotations

from app.core.store import demo_store
from app.providers.knowledge_graph import get_graph_provider
from app.services.adzuna_service import _adzuna_market_cache


def get_market_demand(skill: str, role: str = "Software Engineer", country: str = "in") -> float:
    """Retrieve real market demand percentage from cached Adzuna employment intelligence."""
    skill_lower = skill.lower()
    # Check exact cache key
    cache_key = f"{country.lower()}:{role.strip().lower()}:all"
    if cache_key in _adzuna_market_cache:
        _, data = _adzuna_market_cache[cache_key]
        for s in data.get("skills_in_demand", []):
            if s.get("skill", "").lower() == skill_lower:
                return round(s.get("demand_percentage", 0.0) / 100.0, 2)

    # Check any available cached Adzuna dataset
    for _, (_, data) in _adzuna_market_cache.items():
        for s in data.get("skills_in_demand", []):
            if s.get("skill", "").lower() == skill_lower:
                return round(s.get("demand_percentage", 0.0) / 100.0, 2)

    return 0.0


def estimate_proficiency(skill: str, evidence: dict) -> float:
    """evidence: {resume_mentions, years, project_evidence, github_evidence, assessment_score, certified}"""
    base = 0.0
    base += min(2.0, evidence.get("years", 0) * 0.4)
    base += 0.8 if evidence.get("resume_mentions") else 0
    base += 0.6 if evidence.get("project_evidence") else 0
    base += 0.7 if evidence.get("github_evidence") else 0
    base += (evidence.get("assessment_score", 0) / 100) * 1.2
    base += 0.5 if evidence.get("certified") else 0
    return round(min(5.0, base), 1)


def analyze_skill_gap(target_role: str, candidate_skills: dict[str, float] | None = None, country: str = "in") -> list[dict]:
    candidate_skills = candidate_skills or demo_store.candidate_profile["skills"]
    target_job = next((j for j in demo_store.jobs.values() if j["title"] == target_role), None)
    required_skills = target_job["skills"] if target_job else ["System Design", "AWS", "Kubernetes", "Microservices"]

    gaps = []
    for skill in required_skills:
        current = candidate_skills.get(skill, 0.0)
        required_level = 3.5
        gap = max(0.0, required_level - current)
        demand = get_market_demand(skill, role=target_role, country=country)
        if gap >= 2.5:
            importance = "Critical"
        elif gap >= 1.5:
            importance = "High"
        elif gap > 0:
            importance = "Medium"
        else:
            importance = "Low"
        gaps.append({
            "skill": skill,
            "current_level": current,
            "required_level": required_level,
            "gap": round(gap, 1),
            "importance": importance,
            "market_demand": demand,
        })
    gaps.sort(key=lambda g: (-{"Critical": 3, "High": 2, "Medium": 1, "Low": 0}[g["importance"]], -g["market_demand"]))
    return gaps


def get_skill_graph(root_skill: str | None = None) -> dict:
    graph = get_graph_provider()
    nodes, edges = set(), []
    roots = [root_skill] if root_skill else list(demo_store.candidate_profile["skills"].keys())
    for r in roots:
        nodes.add(r)
        for rel, tgt in graph["neighbors"](r):
            nodes.add(tgt)
            edges.append({"source": r, "relation": rel, "target": tgt})
    return {"nodes": [{"id": n} for n in nodes], "edges": edges}

