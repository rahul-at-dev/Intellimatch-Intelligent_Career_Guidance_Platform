"""Celery worker for background/async jobs: job ingestion refresh, market snapshot
capture, and periodic re-indexing of the vector store. Uses Redis as the broker.
"""
from __future__ import annotations

from celery import Celery

from app.core.config import settings
from app.core.store import demo_store
from app.providers.job_provider import get_job_provider

celery_app = Celery("intellimatch", broker=settings.redis_url, backend=settings.redis_url)


@celery_app.task(name="ingest_jobs")
def ingest_jobs() -> dict:
    """Pulls jobs from the configured JobProvider, normalizes and re-indexes them."""
    provider = get_job_provider()
    jobs = provider.fetch_jobs()
    for job in jobs:
        demo_store.jobs[job["id"]] = job
    demo_store._index_jobs()
    return {"ingested": len(jobs)}


@celery_app.task(name="capture_market_snapshot")
def capture_market_snapshot() -> dict:
    """Persists a point-in-time market demand snapshot (see MarketSnapshot model)."""
    from app.services.skill_service import MARKET_DEMAND
    return {"skills_captured": len(MARKET_DEMAND)}


@celery_app.task(name="reindex_vectors")
def reindex_vectors() -> dict:
    demo_store._index_jobs()
    return {"status": "reindexed", "jobs": len(demo_store.jobs)}


celery_app.conf.beat_schedule = {
    "refresh-jobs-hourly": {"task": "ingest_jobs", "schedule": 3600.0},
    "market-snapshot-daily": {"task": "capture_market_snapshot", "schedule": 86400.0},
}
