"""Job ingestion provider abstraction."""
from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod

from app.core.config import settings
from app.data.seed_jobs import SEED_JOBS
from app.services.adzuna_service import adzuna_service


class JobProvider(ABC):
    @abstractmethod
    def fetch_jobs(self) -> list[dict]: ...


class MockJobProvider(JobProvider):
    def fetch_jobs(self) -> list[dict]:
        return SEED_JOBS


class AdzunaJobProvider(JobProvider):
    """Real Adzuna job ingestion provider."""

    def __init__(self, app_id: str, app_key: str):
        self.app_id = app_id
        self.app_key = app_key

    def fetch_jobs(self) -> list[dict]:
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # In running loop
                task = adzuna_service.search_jobs(query="Software Engineer", results_per_page=20)
                # If sync caller in async context
                import nest_asyncio
                nest_asyncio.apply()
                return loop.run_until_complete(task)
            else:
                return asyncio.run(adzuna_service.search_jobs(query="Software Engineer", results_per_page=20))
        except Exception:
            return []


def get_job_provider() -> JobProvider:
    if settings.adzuna_app_id and settings.adzuna_app_key:
        return AdzunaJobProvider(settings.adzuna_app_id, settings.adzuna_app_key)
    return MockJobProvider()
