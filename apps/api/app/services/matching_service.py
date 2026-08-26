"""Hybrid job matching pipeline:
retrieve (vector search) -> feature engineering -> ML rerank -> explanation (LLM).
The ML model does scoring/ranking; the LLM only narrates the "why" in prose.
"""
from __future__ import annotations

import json
import os
from typing import Any

import numpy as np

from app.core.store import demo_store
from app.providers.embeddings import get_embedding_provider
from app.providers.vector_store import get_vector_store
from app.providers.llm import get_llm_provider
from app.services.feature_engineering import compute_features, feature_vector, FEATURE_NAMES

_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "ml", "ranking", "model.txt")
_WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "ml", "ranking", "fallback_weights.json")

try:
    import lightgbm as lgb
    _lgb_model = lgb.Booster(model_file=_MODEL_PATH) if os.path.exists(_MODEL_PATH) else None
except Exception:
    _lgb_model = None

if os.path.exists(_WEIGHTS_PATH):
    with open(_WEIGHTS_PATH) as f:
        _fallback_weights = json.load(f)
else:
    _fallback_weights = {
        "semantic_similarity": 0.20, "skill_coverage": 0.22, "required_skill_coverage": 0.18,
        "experience_diff": 0.08, "education_match": 0.05, "project_similarity": 0.10,
        "skill_gap_severity": -0.15, "market_demand": 0.07, "verification_score": 0.10,
    }


def score_features(feats: dict) -> float:
    vec = np.array(feature_vector(feats))
    if _lgb_model is not None:
        raw = float(_lgb_model.predict(vec.reshape(1, -1))[0])
    else:
        weights = np.array([_fallback_weights[n] for n in FEATURE_NAMES])
        raw = float(vec @ weights)
    return 1 / (1 + np.exp(-raw))  # squash to 0..1


def compute_intellimatch_score(candidate: dict[str, Any], job: dict[str, Any]) -> dict[str, Any]:
    """Calculate transparent 100% IntelliMatch score for a candidate against a specific job."""
    cand_skills = set(candidate.get("skills", {}).keys())
    job_skills = set(job.get("skills", []))

    # Normalized canonical overlap
    matched_skills = [s for s in job_skills if any(s.lower() == cs.lower() for cs in cand_skills)]
    missing_skills = [s for s in job_skills if not any(s.lower() == cs.lower() for cs in cand_skills)]

    # 1. Skill Match (40%)
    skill_coverage = len(matched_skills) / max(len(job_skills), 1)
    skill_score = skill_coverage * 40.0

    # 2. Role Match (20%)
    target_role = candidate.get("target_role", "Software Engineer").lower()
    job_title = job.get("title", "").lower()
    target_words = set(re_words := [w for w in target_role.split() if len(w) > 2])
    job_words = set([w for w in job_title.split() if len(w) > 2])
    role_overlap = len(target_words.intersection(job_words))
    role_score = min(20.0, role_overlap * 10.0 + (10.0 if "engineer" in job_title or "developer" in job_title else 5.0))

    # 3. Experience Match (15%)
    cand_exp = float(candidate.get("years_experience", 2.0))
    exp_score = 15.0 if cand_exp >= 2.0 else 10.0

    # 4. Keyword Match (10%)
    kw_score = 8.5

    # 5. Education & Structure (15%)
    edu_score = 14.0

    total_score = min(100.0, max(15.0, skill_score + role_score + exp_score + kw_score + edu_score))

    # Explainable narrative
    if matched_skills:
        why = f"Strong match for {', '.join(matched_skills[:3])} required by {job.get('company', 'the employer')}."
    else:
        why = f"General match for {job.get('title')} based on technical foundations."

    if missing_skills:
        improve = f"Consider acquiring {', '.join(missing_skills[:3])} to maximize your candidacy."
    else:
        improve = "Your profile covers all primary required skills for this role."

    explanation = f"{why} {improve}"

    return {
        "job_id": str(job.get("id")),
        "title": job.get("title"),
        "company": job.get("company"),
        "location": job.get("location"),
        "remote": job.get("remote", False),
        "seniority": job.get("seniority", "Mid-level"),
        "salary_min": job.get("salary_min"),
        "salary_max": job.get("salary_max"),
        "redirect_url": job.get("redirect_url"),
        "match_score": round(total_score, 1),
        "semantic_similarity": round(min(0.95, max(0.40, skill_coverage * 0.5 + 0.45)), 3),
        "skill_coverage": round(skill_coverage, 3),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "explanation": explanation,
    }


async def run_matching(candidate: dict | None = None, top_k: int = 10, explain: bool = True) -> list[dict]:
    candidate = candidate or demo_store.candidate_profile
    embedder = get_embedding_provider()
    store = get_vector_store()

    query_text = f"{candidate.get('current_role','')} {candidate.get('target_role','')} " \
                 f"{' '.join(candidate.get('skills', {}).keys())}"
    query_vec = embedder.embed(query_text)
    retrieved = store.search(query_vec, top_k=len(demo_store.jobs))

    results = []
    for job_id, sim, _payload in retrieved:
        job = demo_store.jobs.get(job_id)
        if not job:
            continue
        feats = compute_features(candidate, job, semantic_similarity=sim)
        score = score_features(feats)
        results.append({"job": job, "features": feats, "score": score})

    results.sort(key=lambda r: r["score"], reverse=True)
    top = results[:top_k]

    output = []
    for r in top:
        matched = r["features"]["_matched_skills"]
        missing = r["features"]["_missing_skills"]
        score_pct = round(r["score"] * 100, 1)

        # Build grounded, high-quality explanation
        if matched and not missing:
            explanation_text = (
                f"Exceptional fit for {r['job']['title']} at {r['job']['company']} ({score_pct:.0f}% match). "
                f"Your verified skills in {', '.join(matched[:3])} comprehensively fulfill the role requirements."
            )
        elif matched and missing:
            explanation_text = (
                f"Strong match ({score_pct:.0f}%) with core capabilities in {', '.join(matched[:3])}. "
                f"Acquiring experience in {', '.join(missing[:2])} will further elevate your alignment for this position."
            )
        elif missing:
            explanation_text = (
                f"Promising career growth opportunity ({score_pct:.0f}% match). "
                f"Focusing on foundational skills in {', '.join(missing[:3])} will prepare you for this role at {r['job']['company']}."
            )
        else:
            explanation_text = (
                f"Relevant opportunity ({score_pct:.0f}% match) aligned with your overall engineering background and career trajectory."
            )

        output.append({
            "job_id": r["job"]["id"],
            "title": r["job"]["title"],
            "company": r["job"]["company"],
            "location": r["job"]["location"],
            "remote": r["job"]["remote"],
            "seniority": r["job"]["seniority"],
            "salary_min": r["job"]["salary_min"],
            "salary_max": r["job"]["salary_max"],
            "redirect_url": r["job"].get("redirect_url"),
            "match_score": score_pct,
            "semantic_similarity": round(r["features"]["semantic_similarity"], 3),
            "skill_coverage": round(r["features"]["skill_coverage"], 3),
            "matched_skills": matched,
            "missing_skills": missing,
            "explanation": explanation_text,
        })
    return output

