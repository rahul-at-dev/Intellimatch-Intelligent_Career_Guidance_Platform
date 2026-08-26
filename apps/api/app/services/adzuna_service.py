"""Adzuna Jobs API Integration Service for IntelliMatch AI.

Fetches live job listings from the Adzuna API, normalizes job schemas, extracts skills
using our skill normalization engine, and provides rich market analytics (salaries,
trends, distribution, employers, regional demand, and skill demand).
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import re
import time
from typing import Any
import httpx

from app.core.config import settings
from app.services.skill_normalization import extract_skills_from_jd

# In-memory LRU-like job cache: job_id -> normalized_job_dict
_adzuna_job_cache: dict[str, dict[str, Any]] = {}
_MAX_JOB_CACHE_SIZE = 1000

# Market insight cache: cache_key -> (timestamp, data)
_adzuna_market_cache: dict[str, tuple[float, dict[str, Any]]] = {}
_MARKET_CACHE_TTL_SECONDS = 3600  # 1 hour cache TTL

CURRENCY_BY_COUNTRY: dict[str, dict[str, str]] = {
    "in": {"code": "INR", "symbol": "₹", "label": "INR"},
    "gb": {"code": "GBP", "symbol": "£", "label": "GBP"},
    "us": {"code": "USD", "symbol": "$", "label": "USD"},
    "ca": {"code": "CAD", "symbol": "$", "label": "CAD"},
    "au": {"code": "AUD", "symbol": "$", "label": "AUD"},
    "de": {"code": "EUR", "symbol": "€", "label": "EUR"},
    "fr": {"code": "EUR", "symbol": "€", "label": "EUR"},
}


def _clean_html(raw_html: str) -> str:
    """Strip HTML tags from description if present."""
    if not raw_html:
        return ""
    clean = re.sub(r"<[^>]+>", " ", raw_html)
    return re.sub(r"\s+", " ", clean).strip()


def _detect_seniority(title: str) -> str:
    lower = title.lower()
    if any(k in lower for k in ["lead", "principal", "staff", "director", "head", "architect"]):
        return "Lead / Principal"
    if any(k in lower for k in ["senior", "sr.", "sr "]):
        return "Senior"
    if any(k in lower for k in ["junior", "jr.", "jr ", "intern", "trainee", "fresher", "graduate"]):
        return "Entry-level / Junior"
    return "Mid-level"


def _is_remote_job(title: str, location_name: str, desc: str) -> bool:
    blob = f"{title} {location_name} {desc}".lower()
    return any(k in blob for k in ["remote", "work from home", "wfh", "telecommute", "anywhere in india"])


def _extract_job_skills(title: str, description: str, category: str) -> list[str]:
    """Extract skills from job title and description using skill taxonomy."""
    extracted = extract_skills_from_jd(f"{title}\n{description}")
    if extracted:
        return extracted

    # Fallback to smart keyword inference from title
    title_lower = title.lower()
    inferred: list[str] = []
    skill_lookup = {
        "python": "Python",
        "java": "Java",
        "spring": "Spring Boot",
        "react": "React",
        "node": "Node.js",
        "angular": "Angular",
        "golang": "Go",
        "c++": "C++",
        "c#": "C#",
        ".net": ".NET",
        "devops": "DevOps",
        "aws": "AWS",
        "azure": "Azure",
        "data engineer": "Data Engineering",
        "data analyst": "SQL",
        "machine learning": "Machine Learning",
        "frontend": "Frontend Development",
        "backend": "Backend Development",
        "full stack": "Full Stack Development",
        "qa": "QA Testing",
        "testing": "Testing",
    }
    for k, v in skill_lookup.items():
        if k in title_lower and v not in inferred:
            inferred.append(v)

    if not inferred:
        inferred = ["Software Engineering", "Problem Solving", "REST APIs"]

    return inferred


def normalize_adzuna_job(item: dict[str, Any], country: str = "in") -> dict[str, Any]:
    """Transform raw Adzuna item into internal IntelliMatch Job schema."""
    job_id = str(item.get("id") or "")
    title = _clean_html(item.get("title") or "Software Engineer")
    company_dict = item.get("company") or {}
    company = company_dict.get("display_name") or "Confidential"

    loc_dict = item.get("location") or {}
    location = loc_dict.get("display_name") or ("India" if country == "in" else "Global")

    desc = _clean_html(item.get("description") or "No description provided.")
    skills = _extract_job_skills(title, desc, (item.get("category") or {}).get("label", ""))

    remote = _is_remote_job(title, location, desc)
    seniority = _detect_seniority(title)

    sal_min = float(item["salary_min"]) if item.get("salary_min") is not None else None
    sal_max = float(item["salary_max"]) if item.get("salary_max") is not None else None

    currency_info = CURRENCY_BY_COUNTRY.get(country.lower(), {"code": "USD", "symbol": "$", "label": "USD"})

    category = (item.get("category") or {}).get("label") or "IT Jobs"
    redirect_url = item.get("redirect_url") or f"https://www.adzuna.in/land/ad/{job_id}"
    created_at = item.get("created") or ""

    normalized = {
        "id": job_id,
        "title": title,
        "company": company,
        "location": location,
        "remote": remote,
        "seniority": seniority,
        "salary_min": sal_min,
        "salary_max": sal_max,
        "currency": currency_info["code"],
        "description": desc,
        "skills": skills,
        "job_type": item.get("contract_time") or "full_time",
        "category": category,
        "created_at": created_at,
        "redirect_url": redirect_url,
        "source": "Adzuna",
    }

    # Store in global job cache
    if job_id:
        if len(_adzuna_job_cache) >= _MAX_JOB_CACHE_SIZE:
            _adzuna_job_cache.pop(next(iter(_adzuna_job_cache)))
        _adzuna_job_cache[job_id] = normalized

    return normalized


def format_salary_bucket_label(min_val: float, max_val: float | None, country: str = "in") -> str:
    """Format salary histogram bucket in a human-readable format according to currency."""
    c = country.lower()
    symbol = CURRENCY_BY_COUNTRY.get(c, {}).get("symbol", "$")

    if c == "in":
        # Indian Lakhs / Crores
        min_lakh = min_val / 100000
        if max_val is None:
            return f"{symbol}{min_lakh:.0f}L+" if min_lakh.is_integer() else f"{symbol}{min_lakh:.1f}L+"
        max_lakh = max_val / 100000
        min_str = f"{min_lakh:.0f}L" if min_lakh.is_integer() else f"{min_lakh:.1f}L"
        max_str = f"{max_lakh:.0f}L" if max_lakh.is_integer() else f"{max_lakh:.1f}L"
        return f"{symbol}{min_str} – {symbol}{max_str}"
    else:
        # USD/GBP/EUR thousands (k)
        min_k = min_val / 1000
        if max_val is None:
            return f"{symbol}{min_k:.0f}k+" if min_k.is_integer() else f"{symbol}{min_k:.1f}k+"
        max_k = max_val / 1000
        min_str = f"{min_k:.0f}k" if min_k.is_integer() else f"{min_k:.1f}k"
        max_str = f"{max_k:.0f}k" if max_k.is_integer() else f"{max_k:.1f}k"
        return f"{symbol}{min_str} – {symbol}{max_str}"


class AdzunaService:
    def __init__(self):
        self.headers = {
            "User-Agent": "IntelliMatchAI/1.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "application/json",
        }

    async def search_jobs(
        self,
        query: str | None = None,
        location: str | None = None,
        remote_only: bool = False,
        page: int = 1,
        results_per_page: int = 10,
        country: str = "in",
    ) -> list[dict[str, Any]]:
        """Search jobs from Adzuna API."""
        app_id = settings.adzuna_app_id
        app_key = settings.adzuna_app_key

        if not app_id or not app_key:
            return []

        what_query = query.strip() if query else "Software Engineer"
        if remote_only and "remote" not in what_query.lower():
            what_query = f"{what_query} remote"

        url = f"https://api.adzuna.com/v1/api/jobs/{country.lower()}/search/{page}"
        params: dict[str, Any] = {
            "app_id": app_id,
            "app_key": app_key,
            "results_per_page": min(max(results_per_page, 1), 50),
            "what": what_query,
            "content-type": "application/json",
        }
        if location and location.strip():
            params["where"] = location.strip()

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.get(url, params=params, headers=self.headers)
                if resp.status_code != 200:
                    return []
                data = resp.json()
                raw_results = data.get("results") or []

                normalized_jobs = []
                for item in raw_results:
                    job = normalize_adzuna_job(item, country=country)
                    if remote_only and not job["remote"]:
                        continue
                    normalized_jobs.append(job)

                return normalized_jobs
        except Exception:
            return []

    async def get_raw_search_meta(
        self,
        query: str,
        location: str | None = None,
        country: str = "in",
    ) -> dict[str, Any]:
        """Fetch search response metadata including count and mean salary."""
        app_id = settings.adzuna_app_id
        app_key = settings.adzuna_app_key

        if not app_id or not app_key:
            return {"count": 0, "mean": None}

        url = f"https://api.adzuna.com/v1/api/jobs/{country.lower()}/search/1"
        params: dict[str, Any] = {
            "app_id": app_id,
            "app_key": app_key,
            "results_per_page": 1,
            "what": query,
            "content-type": "application/json",
        }
        if location and location.strip():
            params["where"] = location.strip()

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params, headers=self.headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "count": int(data.get("count", 0)),
                        "mean": float(data["mean"]) if data.get("mean") is not None else None,
                    }
        except Exception:
            pass
        return {"count": 0, "mean": None}

    async def get_salary_history(
        self,
        query: str,
        location: str | None = None,
        country: str = "in",
    ) -> list[dict[str, Any]]:
        """Fetch historical average salary trend by month from Adzuna."""
        app_id = settings.adzuna_app_id
        app_key = settings.adzuna_app_key

        if not app_id or not app_key:
            return []

        url = f"https://api.adzuna.com/v1/api/jobs/{country.lower()}/history"
        params: dict[str, Any] = {
            "app_id": app_id,
            "app_key": app_key,
            "what": query,
        }
        if location and location.strip():
            params["where"] = location.strip()

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params, headers=self.headers)
                if resp.status_code != 200:
                    return []
                data = resp.json()
                month_dict: dict[str, float] = data.get("month") or {}
                if not month_dict:
                    return []

                # Sort chronologically by YYYY-MM
                sorted_months = sorted(month_dict.keys())
                trend = []
                for m_key in sorted_months:
                    val = month_dict[m_key]
                    # Format label like 'Aug 2025'
                    try:
                        dt = datetime.strptime(m_key, "%Y-%m")
                        label = dt.strftime("%b %Y")
                    except Exception:
                        label = m_key

                    trend.append({
                        "date": m_key,
                        "label": label,
                        "average_salary": round(float(val), 2),
                    })
                return trend
        except Exception:
            return []

    async def get_salary_histogram(
        self,
        query: str,
        location: str | None = None,
        country: str = "in",
    ) -> list[dict[str, Any]]:
        """Fetch salary histogram distribution from Adzuna."""
        app_id = settings.adzuna_app_id
        app_key = settings.adzuna_app_key

        if not app_id or not app_key:
            return []

        url = f"https://api.adzuna.com/v1/api/jobs/{country.lower()}/histogram"
        params: dict[str, Any] = {
            "app_id": app_id,
            "app_key": app_key,
            "what": query,
        }
        if location and location.strip():
            params["where"] = location.strip()

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params, headers=self.headers)
                if resp.status_code != 200:
                    return []
                data = resp.json()
                raw_hist: dict[str, int] = data.get("histogram") or {}
                if not raw_hist:
                    return []

                # Keys are numeric string lower bounds, e.g. "0", "1000000", "2000000"
                sorted_bounds = sorted([float(k) for k in raw_hist.keys()])
                histogram_list = []
                for i, min_bound in enumerate(sorted_bounds):
                    max_bound = sorted_bounds[i + 1] if i + 1 < len(sorted_bounds) else None
                    cnt = int(raw_hist.get(str(int(min_bound)), raw_hist.get(str(min_bound), 0)))
                    label = format_salary_bucket_label(min_bound, max_bound, country=country)
                    histogram_list.append({
                        "range_label": label,
                        "min_salary": min_bound,
                        "max_salary": max_bound,
                        "count": cnt,
                    })
                return histogram_list
        except Exception:
            return []

    async def get_top_companies(
        self,
        query: str,
        location: str | None = None,
        country: str = "in",
        limit: int = 8,
    ) -> list[dict[str, Any]]:
        """Fetch top hiring companies leaderboard from Adzuna."""
        app_id = settings.adzuna_app_id
        app_key = settings.adzuna_app_key

        if not app_id or not app_key:
            return []

        url = f"https://api.adzuna.com/v1/api/jobs/{country.lower()}/top_companies"
        params: dict[str, Any] = {
            "app_id": app_id,
            "app_key": app_key,
            "what": query,
        }
        if location and location.strip():
            params["where"] = location.strip()

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params, headers=self.headers)
                if resp.status_code != 200:
                    return []
                data = resp.json()
                leaderboard = data.get("leaderboard") or []

                companies = []
                for item in leaderboard[:limit]:
                    name = item.get("canonical_name") or item.get("name") or "Unknown"
                    cnt = int(item.get("count", 0))
                    avg_sal = float(item["average_salary"]) if item.get("average_salary") is not None else None
                    if cnt > 0:
                        companies.append({
                            "name": name,
                            "count": cnt,
                            "average_salary": avg_sal,
                        })
                return companies
        except Exception:
            return []

    async def get_regional_demand(
        self,
        query: str,
        country: str = "in",
        limit: int = 8,
    ) -> list[dict[str, Any]]:
        """Fetch regional/geographical vacancy breakdown from Adzuna."""
        app_id = settings.adzuna_app_id
        app_key = settings.adzuna_app_key

        if not app_id or not app_key:
            return []

        url = f"https://api.adzuna.com/v1/api/jobs/{country.lower()}/geodata"
        params: dict[str, Any] = {
            "app_id": app_id,
            "app_key": app_key,
            "what": query,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params, headers=self.headers)
                if resp.status_code != 200:
                    return []
                data = resp.json()
                loc_list = data.get("locations") or []

                cleaned_regions = []
                for item in loc_list:
                    cnt = int(item.get("count", 0))
                    loc_meta = item.get("location") or {}
                    display_name = loc_meta.get("display_name") or ""
                    area = loc_meta.get("area") or []

                    if len(area) > 1:
                        region_name = area[1]
                    elif display_name:
                        region_name = display_name.split(",")[0].strip()
                    else:
                        region_name = "Global"

                    if cnt > 0:
                        cleaned_regions.append({
                            "location": region_name,
                            "count": cnt,
                        })

                cleaned_regions.sort(key=lambda x: -x["count"])
                return cleaned_regions[:limit]
        except Exception:
            return []

    async def analyze_skill_demand(
        self,
        query: str,
        location: str | None = None,
        country: str = "in",
        target_sample_size: int = 50,
    ) -> dict[str, Any]:
        """Calculate skill demand percentages from real Adzuna job descriptions.

        Formula:
        skill_demand = (jobs mentioning skill / number of jobs analyzed) * 100
        """
        app_id = settings.adzuna_app_id
        app_key = settings.adzuna_app_key

        if not app_id or not app_key:
            return {"skills": [], "sample_size": 0, "analyzed_at": datetime.now(timezone.utc).isoformat()}

        jobs_to_analyze: list[dict[str, Any]] = []
        pages_needed = min(3, max(1, (target_sample_size + 19) // 20))

        for p in range(1, pages_needed + 1):
            page_jobs = await self.search_jobs(
                query=query,
                location=location,
                page=p,
                results_per_page=20,
                country=country,
            )
            if not page_jobs:
                break
            jobs_to_analyze.extend(page_jobs)
            if len(jobs_to_analyze) >= target_sample_size:
                break

        sample_size = len(jobs_to_analyze)
        if sample_size == 0:
            return {
                "skills": [],
                "sample_size": 0,
                "analyzed_at": datetime.now(timezone.utc).isoformat(),
            }

        skill_counts: dict[str, int] = {}
        for job in jobs_to_analyze:
            title = job.get("title", "")
            desc = job.get("description", "")
            combined_text = f"{title}\n{desc}"
            extracted = extract_skills_from_jd(combined_text)
            if not extracted and job.get("skills"):
                extracted = job["skills"]

            unique_job_skills = set(extracted)
            for s in unique_job_skills:
                skill_counts[s] = skill_counts.get(s, 0) + 1

        skills_ranked = []
        for s, count in skill_counts.items():
            demand_pct = round((count / sample_size) * 100, 1)
            skills_ranked.append({
                "skill": s,
                "demand_percentage": demand_pct,
                "job_count": count,
            })

        skills_ranked.sort(key=lambda x: (-x["demand_percentage"], x["skill"]))

        return {
            "skills": skills_ranked,
            "sample_size": sample_size,
            "analyzed_at": datetime.now(timezone.utc).isoformat(),
        }

    async def get_market_insights_bundle(
        self,
        role: str = "Software Engineer",
        location: str | None = None,
        country: str = "in",
        force_refresh: bool = False,
    ) -> dict[str, Any]:
        """Fetch all market insights concurrently with caching."""
        cache_key = f"{country.lower()}:{role.strip().lower()}:{(location or 'all').strip().lower()}"
        now = time.time()

        if not force_refresh and cache_key in _adzuna_market_cache:
            ts, cached_data = _adzuna_market_cache[cache_key]
            if (now - ts) < _MARKET_CACHE_TTL_SECONDS:
                data_copy = dict(cached_data)
                data_copy["is_cached"] = True
                data_copy["cache_age_seconds"] = int(now - ts)
                return data_copy

        (
            meta_res,
            salary_history_res,
            salary_hist_res,
            top_companies_res,
            regional_demand_res,
            skill_demand_res,
        ) = await asyncio.gather(
            self.get_raw_search_meta(query=role, location=location, country=country),
            self.get_salary_history(query=role, location=location, country=country),
            self.get_salary_histogram(query=role, location=location, country=country),
            self.get_top_companies(query=role, location=location, country=country),
            self.get_regional_demand(query=role, country=country),
            self.analyze_skill_demand(query=role, location=location, country=country, target_sample_size=50),
        )

        currency_info = CURRENCY_BY_COUNTRY.get(country.lower(), {"code": "INR", "symbol": "₹", "label": "INR"})
        job_count = meta_res.get("count", 0)
        mean_salary = meta_res.get("mean")

        salary_growth_pct = None
        trend_direction = "stable"
        if len(salary_history_res) >= 2:
            first_val = salary_history_res[0]["average_salary"]
            last_val = salary_history_res[-1]["average_salary"]
            if first_val > 0:
                salary_growth_pct = round(((last_val - first_val) / first_val) * 100, 1)
                if salary_growth_pct > 1.5:
                    trend_direction = "up"
                elif salary_growth_pct < -1.5:
                    trend_direction = "down"

        if mean_salary is None and salary_history_res:
            mean_salary = salary_history_res[-1]["average_salary"]

        result = {
            "role": role,
            "location": location or ("India" if country.lower() == "in" else country.upper()),
            "country": country.lower(),
            "currency": currency_info["code"],
            "currency_symbol": currency_info["symbol"],
            "job_count": job_count,
            "average_salary": round(mean_salary, 2) if mean_salary is not None else None,
            "salary_growth_percentage": salary_growth_pct,
            "trend_direction": trend_direction,
            "salary_trend": salary_history_res,
            "salary_distribution": salary_hist_res,
            "top_companies": top_companies_res,
            "top_locations": regional_demand_res,
            "skills_in_demand": skill_demand_res.get("skills", []),
            "sample_size": skill_demand_res.get("sample_size", 0),
            "data_source": "Adzuna",
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "is_cached": False,
            "cache_age_seconds": 0,
        }

        _adzuna_market_cache[cache_key] = (now, result)
        return result

    def get_cached_job(self, job_id: str) -> dict[str, Any] | None:
        """Retrieve job from in-memory Adzuna cache."""
        return _adzuna_job_cache.get(job_id)

    def cache_job(self, job: dict[str, Any]) -> None:
        """Manually store a job in the cache."""
        if job.get("id"):
            _adzuna_job_cache[str(job["id"])] = job


adzuna_service = AdzunaService()

