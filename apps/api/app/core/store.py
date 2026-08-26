"""Process-local data store for IntelliMatch AI.

In production, all of this is backed by PostgreSQL via Prisma/SQLAlchemy models
(see prisma/schema.prisma). To guarantee the API runs with zero external services,
routers read/write through this in-memory store, which mirrors the same shapes.
"""
from __future__ import annotations

import time
from typing import Any
from app.data.seed_jobs import SEED_JOBS
from app.data.seed_skills import SEED_SKILLS, SKILL_GRAPH_EDGES
from app.providers.knowledge_graph import seed_graph
from app.providers.embeddings import get_embedding_provider
from app.providers.vector_store import get_vector_store


class DemoStore:
    def __init__(self):
        self.skills = {s["name"]: s for s in SEED_SKILLS}
        self.jobs = {j["id"]: j for j in SEED_JOBS}
        self.user_profiles: dict[str, dict[str, Any]] = {}
        # user_id -> {job_id -> job_dict}
        self.user_saved_jobs: dict[str, dict[str, dict[str, Any]]] = {}
        self.default_profile: dict[str, Any] = {
            "id": "candidate-user",
            "full_name": "Rahul I",
            "email": "rahul.persnl04@gmail.com",
            "current_role": "Backend Engineer",
            "target_role": "Senior Backend Engineer",
            "years_experience": 3.5,
            "location": "Bangalore",
            "bio": "Passionate software engineer focused on distributed systems, modern Python/FastAPI architectures, and intelligent matching.",
            "skills": {
                "Python": 3.8,
                "FastAPI": 3.0,
                "PostgreSQL": 3.2,
                "Docker": 2.0,
                "REST APIs": 3.5,
                "Git": 4.0,
                "System Design": 2.2,
                "Testing": 2.8,
            },
            "resume_text": None,
            "profile_strength": 85,
        }
        self._index_jobs()

    @property
    def candidate_profile(self) -> dict[str, Any]:
        """Backward-compatibility getter for candidate_profile."""
        return self.get_profile("default")

    def _index_jobs(self):
        embedder = get_embedding_provider()
        store = get_vector_store()
        for job in self.jobs.values():
            text = f"{job['title']} {job['description']} {' '.join(job['skills'])}"
            vec = embedder.embed(text)
            store.upsert(job["id"], vec, {"job_id": job["id"]})

    def get_profile(self, user_id: str = "default") -> dict[str, Any]:
        if user_id not in self.user_profiles:
            profile_copy = dict(self.default_profile)
            profile_copy["id"] = user_id
            self.user_profiles[user_id] = profile_copy
        return self.user_profiles[user_id]

    def update_profile(self, user_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        profile = self.get_profile(user_id)
        for k, v in updates.items():
            if v is not None:
                profile[k] = v
        if "skills" in profile and isinstance(profile["skills"], dict):
            profile["profile_strength"] = min(100, int(len(profile["skills"]) * 4 + profile.get("years_experience", 0) * 5))
        return profile

    def set_candidate_skills(self, skills: dict[str, float], user_id: str = "default"):
        profile = self.get_profile(user_id)
        profile["skills"] = skills
        profile["profile_strength"] = min(100, int(len(skills) * 4 + profile.get("years_experience", 0) * 5))

    # ---------- Saved Jobs ----------
    def get_saved_jobs(self, user_id: str) -> list[dict[str, Any]]:
        saved_dict = self.user_saved_jobs.get(user_id, {})
        return list(saved_dict.values())

    def save_job(self, user_id: str, job: dict[str, Any]) -> dict[str, Any]:
        if user_id not in self.user_saved_jobs:
            self.user_saved_jobs[user_id] = {}
        job_id = str(job.get("id"))
        saved_item = dict(job)
        saved_item["saved_at"] = time.time()
        self.user_saved_jobs[user_id][job_id] = saved_item
        return saved_item

    def unsave_job(self, user_id: str, job_id: str) -> bool:
        if user_id in self.user_saved_jobs and str(job_id) in self.user_saved_jobs[user_id]:
            del self.user_saved_jobs[user_id][str(job_id)]
            return True
        return False

    def is_job_saved(self, user_id: str, job_id: str) -> bool:
        return user_id in self.user_saved_jobs and str(job_id) in self.user_saved_jobs[user_id]


demo_store = DemoStore()
seed_graph(SKILL_GRAPH_EDGES)
