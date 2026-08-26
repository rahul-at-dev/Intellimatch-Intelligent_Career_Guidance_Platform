"""Market Insights Service for IntelliMatch AI.

Combines live Adzuna employment data, local skill frequency extraction, and candidate
resume skills to produce market overview, trends, salary distribution, employer leaderboard,
regional demand, and explainable Market Alignment & Skill Priorities.
"""
from __future__ import annotations

from typing import Any
from app.services.adzuna_service import adzuna_service
from app.services.skill_normalization import normalize_skill, normalize_skills_list


def calculate_market_alignment(
    candidate_skills: list[str] | dict[str, float] | None,
    market_skills: list[dict[str, Any]],
    target_role: str = "Software Engineer",
) -> dict[str, Any] | None:
    """Deterministic calculation of how well a candidate's skills align with current job market demand.

    Formula:
    alignment_score = (sum of demand % of matched skills / sum of demand % of top market skills) * 100
    """
    if not candidate_skills or not market_skills:
        return None

    # Normalize candidate skill list
    if isinstance(candidate_skills, dict):
        raw_cand_skills = list(candidate_skills.keys())
    else:
        raw_cand_skills = list(candidate_skills)

    norm_cand_skills = normalize_skills_list(raw_cand_skills)
    cand_skill_set = {s.lower(): s for s in norm_cand_skills}

    # Evaluate against top market skills (up to top 15 skills with demand >= 5%)
    top_market = [s for s in market_skills if s.get("demand_percentage", 0) >= 5.0][:15]
    if not top_market:
        top_market = market_skills[:10]

    if not top_market:
        return None

    total_demand_weight = sum(s["demand_percentage"] for s in top_market)
    matched_demand_weight = 0.0

    strong_skills: list[dict[str, Any]] = []
    gap_skills: list[dict[str, Any]] = []

    for item in top_market:
        skill_name = item["skill"]
        demand_pct = item["demand_percentage"]
        canon = normalize_skill(skill_name)
        
        if canon.lower() in cand_skill_set or skill_name.lower() in cand_skill_set:
            matched_demand_weight += demand_pct
            strong_skills.append({
                "skill": canon,
                "demand_percentage": demand_pct,
            })
        else:
            gap_skills.append({
                "skill": canon,
                "demand_percentage": demand_pct,
            })

    if total_demand_weight > 0:
        alignment_score = round((matched_demand_weight / total_demand_weight) * 100, 1)
    else:
        alignment_score = 0.0

    # Build explainable narrative
    strong_names = [s["skill"] for s in strong_skills[:3]]
    gap_names = [s["skill"] for s in gap_skills[:3]]

    if strong_names and gap_names:
        summary = (
            f"Your profile aligns strongly with {', '.join(strong_names)}, "
            f"while {', '.join(gap_names)} represent high-demand gaps for {target_role}."
        )
    elif strong_names:
        summary = f"Your profile demonstrates strong alignment with top market skills: {', '.join(strong_names)}."
    elif gap_names:
        summary = f"High-demand market skills for {target_role} to focus on include {', '.join(gap_names)}."
    else:
        summary = f"Market alignment calculated from {len(top_market)} benchmark skills."

    return {
        "score": alignment_score,
        "strong_skills": strong_skills,
        "gap_skills": gap_skills,
        "summary": summary,
        "matched_count": len(strong_skills),
        "gap_count": len(gap_skills),
        "total_evaluated": len(top_market),
    }


def calculate_skill_priorities(
    candidate_skills: list[str] | dict[str, float] | None,
    market_skills: list[dict[str, Any]],
    target_role: str = "Software Engineer",
) -> list[dict[str, Any]]:
    """Generate market-driven skill learning priorities for gaps in the candidate's profile."""
    if not market_skills:
        return []

    # If no candidate profile is provided, return top overall market priorities
    cand_skill_set = set()
    if candidate_skills:
        if isinstance(candidate_skills, dict):
            raw_cand_skills = list(candidate_skills.keys())
        else:
            raw_cand_skills = list(candidate_skills)
        norm_cand_skills = normalize_skills_list(raw_cand_skills)
        cand_skill_set = {s.lower() for s in norm_cand_skills}

    priorities: list[dict[str, Any]] = []

    for item in market_skills:
        skill_name = item["skill"]
        demand_pct = item.get("demand_percentage", 0.0)
        job_cnt = item.get("job_count", 0)
        canon = normalize_skill(skill_name)

        # If user already has this skill, skip or rank lower
        if canon.lower() in cand_skill_set:
            continue

        if demand_pct >= 45.0:
            priority = "High"
        elif demand_pct >= 20.0:
            priority = "Medium"
        else:
            priority = "Low"

        reason = f"Required in {demand_pct:.0f}% of {target_role} job listings ({job_cnt} postings)."

        priorities.append({
            "skill": canon,
            "demand_percentage": demand_pct,
            "priority": priority,
            "reason": reason,
        })

    # Sort priorities: High first, then highest demand
    prio_map = {"High": 0, "Medium": 1, "Low": 2}
    priorities.sort(key=lambda x: (prio_map.get(x["priority"], 3), -x["demand_percentage"]))

    return priorities[:8]


class MarketInsightsService:
    async def get_insights(
        self,
        role: str = "Software Engineer",
        location: str | None = None,
        country: str = "in",
        candidate_skills: list[str] | dict[str, float] | None = None,
        force_refresh: bool = False,
    ) -> dict[str, Any]:
        """Produce the comprehensive market insights response."""
        bundle = await adzuna_service.get_market_insights_bundle(
            role=role,
            location=location,
            country=country,
            force_refresh=force_refresh,
        )

        market_skills = bundle.get("skills_in_demand", [])

        # Calculate personalized market alignment & priorities
        market_alignment = calculate_market_alignment(
            candidate_skills=candidate_skills,
            market_skills=market_skills,
            target_role=role,
        )

        skill_priorities = calculate_skill_priorities(
            candidate_skills=candidate_skills,
            market_skills=market_skills,
            target_role=role,
        )

        bundle["market_alignment"] = market_alignment
        bundle["skill_priorities"] = skill_priorities

        return bundle

    async def get_live_skill_demand_dict(
        self,
        role: str = "Software Engineer",
        country: str = "in",
    ) -> dict[str, float]:
        """Helper to get a normalized skill -> demand weight (0.0 to 1.0) dictionary for downstream services."""
        bundle = await adzuna_service.get_market_insights_bundle(
            role=role,
            location=None,
            country=country,
            force_refresh=False,
        )
        skills = bundle.get("skills_in_demand", [])
        if not skills:
            return {}

        return {
            normalize_skill(s["skill"]): round(s["demand_percentage"] / 100.0, 3)
            for s in skills
        }


market_insights_service = MarketInsightsService()
