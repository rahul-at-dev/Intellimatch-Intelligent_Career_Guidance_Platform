"""Career roadmap generation, career prediction, and the 'what-if I learn X' simulator.
Graph relationships + deterministic metrics estimate readiness/effort; OpenRouter writes the guidance narrative."""
from __future__ import annotations

import copy
from typing import Any

from app.core.store import demo_store
from app.data.seed_learning import CAREER_LADDERS
from app.services.matching_service import run_matching
from app.services.skill_service import analyze_skill_gap
from app.services.openrouter_service import openrouter_service


def _readiness_score(gaps: list[dict]) -> float:
    if not gaps:
        return 1.0
    total_gap = sum(g["gap"] for g in gaps)
    return round(max(0.0, 1.0 - total_gap / (len(gaps) * 3.5)), 2)


async def generate_roadmap(
    current_role: str | None = None,
    candidate_profile: dict[str, Any] | None = None,
    user_id: str = "default",
) -> list[dict]:
    profile = candidate_profile or demo_store.candidate_profile
    role = current_role or profile.get("current_role", "Backend Engineer")
    candidate_skills = profile.get("skills", {})

    ladder = CAREER_LADDERS.get(role, ["Senior " + role, "Staff " + role, "Engineering Lead"])

    stages = []
    from_role = role
    for i, to_role in enumerate(ladder, start=1):
        gaps = analyze_skill_gap(to_role, candidate_skills)
        missing = [g["skill"] for g in gaps if g["gap"] > 0]
        readiness = _readiness_score(gaps)
        avg_market_demand = sum(g["market_demand"] for g in gaps) / max(1, len(gaps))

        # Generate realistic guidance with OpenRouter
        explanation = await openrouter_service.generate_career_roadmap_guidance(
            from_role=from_role,
            to_role=to_role,
            missing_skills=missing,
            market_demand_avg=avg_market_demand,
            readiness=readiness,
            user_id=user_id,
        )

        stages.append({
            "stage": i,
            "from_role": from_role,
            "to_role": to_role,
            "readiness": readiness,
            "missing_skills": missing,
            "estimated_effort_months": max(1, int((1.0 - readiness) * 12)),
            "market_demand": round(avg_market_demand, 2),
            "explanation": explanation,
        })
        from_role = to_role
    return stages


async def predict_next_roles(candidate: dict | None = None) -> list[dict]:
    profile = candidate or demo_store.candidate_profile
    matches = await run_matching(profile, top_k=len(demo_store.jobs), explain=False)
    seniority_rank = {"Intern": 0, "Junior": 1, "Mid": 2, "Senior": 3, "Lead": 4}
    current_rank = seniority_rank.get("Mid", 2)

    predictions = {}
    for m in matches:
        rank = seniority_rank.get(m.get("seniority", "Mid"), 2)
        if rank < current_rank:
            continue
        key = m["title"]
        if key not in predictions or m["match_score"] > predictions[key]["match_score"]:
            predictions[key] = m

    output = []
    for title, m in predictions.items():
        output.append({
            "role": title,
            "readiness": round(m["match_score"] / 100, 2),
            "missing_skills": m["missing_skills"],
            "transition_effort": "Low" if m["match_score"] > 75 else "Medium" if m["match_score"] > 50 else "High",
            "is_ml_prediction": True,
            "guidance": f"Estimated based on current skill overlap ({m['match_score']}%) and target requirements.",
        })
    output.sort(key=lambda x: -x["readiness"])
    return output[:6]


async def simulate_skill_addition(
    skill_names: list[str],
    candidate_profile: dict[str, Any] | None = None,
) -> dict:
    baseline_candidate = candidate_profile or demo_store.candidate_profile
    baseline_matches = await run_matching(baseline_candidate, top_k=len(demo_store.jobs), explain=False)
    baseline_opportunities = len([m for m in baseline_matches if m["match_score"] >= 60])
    baseline_avg = sum(m["match_score"] for m in baseline_matches) / max(1, len(baseline_matches))

    projected_candidate = copy.deepcopy(baseline_candidate)
    for skill in skill_names:
        projected_candidate["skills"][skill] = max(projected_candidate["skills"].get(skill, 0), 3.5)

    projected_matches = await run_matching(projected_candidate, top_k=len(demo_store.jobs), explain=False)
    projected_opportunities = len([m for m in projected_matches if m["match_score"] >= 60])
    projected_avg = sum(m["match_score"] for m in projected_matches) / max(1, len(projected_matches))

    unlocked_paths = sorted({m["title"] for m in projected_matches if m["match_score"] >= 60} -
                             {m["title"] for m in baseline_matches if m["match_score"] >= 60})

    return {
        "skills_added": skill_names,
        "baseline": {"avg_match_score": round(baseline_avg, 1), "opportunities": baseline_opportunities},
        "projected": {"avg_match_score": round(projected_avg, 1), "opportunities": projected_opportunities},
        "additional_opportunities": projected_opportunities - baseline_opportunities,
        "career_paths_unlocked": unlocked_paths,
        "estimated_learning_effort_hours": len(skill_names) * 25,
        "disclaimer": "Projected values are calculated estimates based on demonstrated profile skills and live job benchmarks.",
    }

