"""Shared feature pipeline used by both ML training (ml/ranking) and the live
matching API, so train/serve feature computation never drifts apart."""
from __future__ import annotations

import numpy as np

FEATURE_NAMES = [
    "semantic_similarity",
    "skill_coverage",
    "required_skill_coverage",
    "experience_diff",
    "education_match",
    "project_similarity",
    "skill_gap_severity",
    "market_demand",
    "verification_score",
]


def compute_features(candidate: dict, job: dict, semantic_similarity: float) -> dict:
    candidate_skills: dict[str, float] = candidate.get("skills", {})
    job_skills: list[str] = job.get("skills", [])

    matched = [s for s in job_skills if s in candidate_skills]
    skill_coverage = len(matched) / max(1, len(job_skills))

    required_matched = matched  # demo: treat all listed job skills as required
    required_skill_coverage = len(required_matched) / max(1, len(job_skills))

    seniority_years = {"Intern": 0, "Junior": 1, "Mid": 3, "Senior": 6, "Lead": 9}
    job_years = seniority_years.get(job.get("seniority", "Mid"), 3)
    experience_diff = candidate.get("years_experience", 0) - job_years

    education_match = 1.0  # demo default: no strict degree requirement modeled

    project_similarity = min(1.0, skill_coverage * 0.8 + 0.1)

    missing = [s for s in job_skills if s not in candidate_skills]
    skill_gap_severity = len(missing) / max(1, len(job_skills))

    market_demand = float(np.mean([0.6] * len(job_skills))) if job_skills else 0.5

    verified_count = sum(1 for s in matched if candidate.get("verified_skills", {}).get(s))
    verification_score = verified_count / max(1, len(matched)) if matched else 0.0

    return {
        "semantic_similarity": semantic_similarity,
        "skill_coverage": skill_coverage,
        "required_skill_coverage": required_skill_coverage,
        "experience_diff": experience_diff,
        "education_match": education_match,
        "project_similarity": project_similarity,
        "skill_gap_severity": skill_gap_severity,
        "market_demand": market_demand,
        "verification_score": verification_score,
        "_matched_skills": matched,
        "_missing_skills": missing,
    }


def feature_vector(features: dict) -> list[float]:
    return [float(features[name]) for name in FEATURE_NAMES]
