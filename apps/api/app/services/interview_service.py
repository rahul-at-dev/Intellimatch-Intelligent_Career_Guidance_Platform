"""
Service for Company-Specific Interview Preparation Hub supporting 300+ companies,
personalized candidate readiness scoring, categorized question banks, and AI mock interviews.
"""
import json
import logging
from pathlib import Path
from typing import Any, Optional

from app.core.store import demo_store
from app.services.openrouter_service import openrouter_service

logger = logging.getLogger("interview_service")

DATA_DIR = Path(__file__).parent.parent / "data"
COMPANIES_FILE = DATA_DIR / "companies.json"
QUESTIONS_FILE = DATA_DIR / "company_questions.json"

# In-memory storage for saved companies per user: user_id -> set of company_ids
_user_saved_companies: dict[str, set[str]] = {}

# In-memory active mock interview sessions: session_id -> session_dict
_mock_sessions: dict[str, dict[str, Any]] = {}


def _load_companies() -> list[dict[str, Any]]:
    """Load all 300+ company profiles."""
    try:
        if COMPANIES_FILE.exists():
            with open(COMPANIES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.error("Failed to load companies.json: %s", e)
    return []


def _load_questions() -> list[dict[str, Any]]:
    """Load curated question bank."""
    try:
        if QUESTIONS_FILE.exists():
            with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.error("Failed to load company_questions.json: %s", e)
    return []


_ALL_COMPANIES = _load_companies()
_ALL_QUESTIONS = _load_questions()


class InterviewService:
    def __init__(self):
        self.companies = _ALL_COMPANIES
        self.questions = _ALL_QUESTIONS

    def list_companies(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        letter: Optional[str] = None,
        limit: int = 60,
        offset: int = 0,
    ) -> dict[str, Any]:
        """Search and filter 300+ companies with category and alphabet indexes."""
        results = list(self.companies)

        # 1. Query search (name, industry, technical focus)
        if query and query.strip():
            q = query.strip().lower()
            results = [
                c for c in results
                if q in c["name"].lower()
                or q in c.get("industry", "").lower()
                or any(q in cat.lower() for cat in c.get("categories", []))
                or q in c.get("technical_focus", "").lower()
            ]

        # 2. Category filter
        if category and category.strip() and category.lower() != "all":
            cat_lower = category.strip().lower()
            results = [
                c for c in results
                if any(cat_lower in cat.lower() for cat in c.get("categories", []))
            ]

        # 3. Alphabet letter filter (A-Z)
        if letter and letter.strip() and letter.lower() != "all":
            let = letter.strip().upper()
            results = [c for c in results if c["name"].upper().startswith(let)]

        total_count = len(results)
        paginated = results[offset : offset + limit]

        # Extract all unique categories for UI filter tabs
        all_categories = set()
        for c in self.companies:
            for cat in c.get("categories", []):
                all_categories.add(cat)

        return {
            "total": total_count,
            "companies": paginated,
            "categories": sorted(list(all_categories)),
            "limit": limit,
            "offset": offset,
        }

    def get_company_by_id(self, company_id: str) -> Optional[dict[str, Any]]:
        """Retrieve detailed company profile."""
        cid = company_id.lower().strip()
        for c in self.companies:
            if c["id"] == cid or c["name"].lower() == cid:
                return c
        return None

    def get_company_questions(
        self,
        company_id: str,
        category: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        """Retrieve question bank items associated with this company or category."""
        cid = company_id.lower().strip()
        matched = []

        for q in self.questions:
            # Filter by company or include universal items
            is_company_match = cid in [c.lower() for c in q.get("companies", [])] or not q.get("companies")
            if category and category.lower() != "all":
                if q.get("category", "").lower() != category.lower():
                    continue

            if is_company_match:
                matched.append(q)

        # If few company-specific items exist, include universal category patterns
        if len(matched) < 4:
            for q in self.questions:
                if q not in matched:
                    if not category or category.lower() == "all" or q.get("category", "").lower() == category.lower():
                        matched.append(q)

        return matched

    def build_personalized_prep_plan(
        self,
        company_id: str,
        target_role: str = "Senior Backend Engineer",
        candidate_profile: Optional[dict[str, Any]] = None,
        user_id: str = "default",
    ) -> dict[str, Any]:
        """
        Build a Two-Layer Preparation Plan:
        Layer 1: Common company interview focus & rounds
        Layer 2: Personalized candidate skill gaps, readiness score, and priorities
        """
        company = self.get_company_by_id(company_id)
        if not company:
            # Generate fallback company container if slug not found
            company = {
                "id": company_id.lower().strip(),
                "name": company_id.title(),
                "industry": "Technology & Software",
                "categories": ["Product Companies"],
                "difficulty": "High",
                "preparation_areas": ["Data Structures & Algorithms", "System Design", "Role-Specific Engineering", "Behavioral & Leadership"],
                "interview_rounds": ["Technical Phone Screen", "Coding / DSA Onsite (2x)", "System Design Onsite", "Behavioral & Culture Fit"],
                "behavioral_focus": "Ownership, Collaboration, Problem Solving, Culture Fit",
                "technical_focus": "Clean Code, Algorithms, Concurrency, Scalable Cloud Architecture",
                "company_principles": ["Customer focus", "High ownership", "Continuous innovation"],
                "verified_source": "General engineering preparation benchmarks",
            }

        candidate = candidate_profile or demo_store.get_profile(user_id)
        user_skills = candidate.get("skills", {})

        # Evaluate candidate readiness against company focus areas
        strong_skills = []
        missing_gaps = []

        core_prep_areas = company.get("preparation_areas", [])
        tech_focus_words = company.get("technical_focus", "").replace(",", " ").split()

        # Check candidate proficiency in key areas
        dsa_score = min(100.0, max(20.0, user_skills.get("Algorithms", user_skills.get("Python", 2.0)) * 20.0))
        sys_design_score = min(100.0, max(15.0, user_skills.get("System Design", user_skills.get("AWS", 1.5)) * 20.0))
        behavioral_score = 75.0  # Baseline behavioral readiness
        role_fit_score = min(100.0, max(30.0, sum(user_skills.values()) / max(1, len(user_skills)) * 22.0))

        # Overall weighted readiness score
        overall_readiness = round(
            (dsa_score * 0.35) + (sys_design_score * 0.35) + (behavioral_score * 0.15) + (role_fit_score * 0.15),
            1,
        )

        for skill, lvl in user_skills.items():
            if lvl >= 3.0:
                strong_skills.append(skill)
            else:
                missing_gaps.append(skill)

        # Ensure core gap topics are populated
        if "System Design" not in strong_skills and "System Design" not in missing_gaps:
            missing_gaps.append("System Design")
        if "Data Structures & Algorithms" not in strong_skills and "DSA" not in missing_gaps:
            missing_gaps.append("DSA & Graph Algorithms")

        roadmap_stages = [
            {
                "step": "01",
                "title": f"Understand {company['name']} Engineering Culture",
                "focus": company.get("behavioral_focus", "Core values & collaboration"),
                "color": "purple",
                "duration": "~3 hours",
            },
            {
                "step": "02",
                "title": "Master High-Yield DSA & Problem Solving",
                "focus": "Arrays, Trees, Graphs, Dynamic Programming, Heap/Queue",
                "color": "blue",
                "duration": "~15 hours",
            },
            {
                "step": "03",
                "title": f"{company['name']}-Style Machine Coding & LLD",
                "focus": "Clean Object-Oriented Design, Concurrency, Design Patterns",
                "color": "indigo",
                "duration": "~10 hours",
            },
            {
                "step": "04",
                "title": "High-Scale Distributed System Design",
                "focus": company.get("technical_focus", "Microservices, Caching, DB Sharding"),
                "color": "teal",
                "duration": "~12 hours",
            },
            {
                "step": "05",
                "title": "Behavioral Stories & Leadership Principles",
                "focus": f"STAR method stories aligned to {company['name']} principles",
                "color": "amber",
                "duration": "~5 hours",
            },
            {
                "step": "06",
                "title": "Full AI Mock Interview Marathon",
                "focus": f"Simulate real {company['name']} 45-minute technical loop",
                "color": "rose",
                "duration": "~4 hours",
            },
        ]

        checklist = [
            {"id": "c1", "text": f"Read {company['name']} official engineering & interview guide", "completed": False},
            {"id": "c2", "text": f"Review {company['name']} principles / behavioral values", "completed": False},
            {"id": "c3", "text": "Solve 15+ top high-priority company coding problems", "completed": False},
            {"id": "c4", "text": "Design 3 end-to-end distributed systems with trade-offs", "completed": False},
            {"id": "c5", "text": "Prepare 4 STAR stories for leadership/behavioral questions", "completed": False},
            {"id": "c6", "text": f"Complete an AI Mock Interview for {company['name']} {target_role}", "completed": False},
            {"id": "c7", "text": "Prepare 3 thoughtful questions for the interviewer", "completed": False},
        ]

        return {
            "company": company,
            "target_role": target_role,
            "readiness_score": overall_readiness,
            "readiness_breakdown": {
                "dsa": round(dsa_score, 1),
                "system_design": round(sys_design_score, 1),
                "behavioral": round(behavioral_score, 1),
                "role_fit": round(role_fit_score, 1),
            },
            "strong_skills": strong_skills[:5],
            "skill_gaps": missing_gaps[:5],
            "roadmap_stages": roadmap_stages,
            "checklist": checklist,
            "interview_rounds": company.get("interview_rounds", []),
            "company_principles": company.get("company_principles", []),
        }

    async def generate_company_practice(
        self,
        company_id: str,
        target_role: str,
        category: str = "All",
        user_id: str = "default",
    ) -> dict[str, Any]:
        """Generate OpenRouter-grounded practice questions tailored to company & role."""
        company = self.get_company_by_id(company_id)
        company_name = company["name"] if company else company_id.title()
        candidate = demo_store.get_profile(user_id)
        resume_skills = list(candidate.get("skills", {}).keys())

        return await openrouter_service.generate_company_practice_questions(
            company_name=company_name,
            target_role=target_role,
            category=category,
            candidate_skills=resume_skills,
            user_id=user_id,
        )

    # -----------------------------------------------------------------------
    # Interactive AI Mock Interview Methods
    # -----------------------------------------------------------------------
    async def start_mock_interview(
        self,
        company_id: str,
        target_role: str,
        round_type: str = "Technical & System Design",
        user_id: str = "default",
    ) -> dict[str, Any]:
        """Initialize an interactive AI Mock Interview session."""
        company = self.get_company_by_id(company_id)
        company_name = company["name"] if company else company_id.title()

        session_id = f"mock_{user_id}_{company_id}_{hash(target_role) % 10000}"

        initial_prompt = (
            f"Hello! I am your AI Principal Interviewer for **{company_name}**. "
            f"Today we will conduct a focused **{round_type}** interview for the **{target_role}** position. "
            f"I will present realistic scenarios, evaluate your technical depth and problem-solving trade-offs, and provide detailed scoring at the end.\n\n"
            f"To get started, please tell me: **Can you briefly introduce yourself and walk me through the most technically challenging system you have designed or built recently?**"
        )

        _mock_sessions[session_id] = {
            "session_id": session_id,
            "company_name": company_name,
            "target_role": target_role,
            "round_type": round_type,
            "turns_count": 0,
            "messages": [
                {"role": "assistant", "content": initial_prompt}
            ],
            "completed": False,
        }

        return {
            "session_id": session_id,
            "company_name": company_name,
            "target_role": target_role,
            "round_type": round_type,
            "initial_message": initial_prompt,
        }

    async def submit_mock_turn(
        self,
        session_id: str,
        user_answer: str,
        user_id: str = "default",
    ) -> dict[str, Any]:
        """Handle a candidate turn in the mock interview."""
        session = _mock_sessions.get(session_id)
        if not session:
            # Recreate session if expired
            session = {
                "session_id": session_id,
                "company_name": "Target Tech Company",
                "target_role": "Backend Engineer",
                "round_type": "Technical",
                "turns_count": 0,
                "messages": [],
                "completed": False,
            }
            _mock_sessions[session_id] = session

        session["messages"].append({"role": "user", "content": user_answer})
        session["turns_count"] += 1

        company_name = session["company_name"]
        target_role = session["target_role"]
        round_type = session["round_type"]

        # Call OpenRouter for the next question or follow-up
        reply = await openrouter_service.conduct_mock_interview_turn(
            company_name=company_name,
            target_role=target_role,
            round_type=round_type,
            history=session["messages"],
            turns_count=session["turns_count"],
        )

        session["messages"].append({"role": "assistant", "content": reply})

        # Check if interview has reached completion (typically 3-4 turns)
        is_final_turn = session["turns_count"] >= 3

        return {
            "session_id": session_id,
            "message": reply,
            "turns_count": session["turns_count"],
            "can_evaluate": is_final_turn,
        }

    async def evaluate_mock_interview(
        self,
        session_id: str,
        user_id: str = "default",
    ) -> dict[str, Any]:
        """Score the completed mock interview across structured rubrics."""
        session = _mock_sessions.get(session_id)
        if not session or not session.get("messages"):
            return {
                "overall_score": 75.0,
                "rubric_scores": {
                    "technical_accuracy": 78.0,
                    "problem_solving": 80.0,
                    "communication": 72.0,
                    "role_fit": 74.0,
                },
                "strengths": ["Clear technical communication", "Good foundational problem decomposition"],
                "areas_to_improve": ["Deepen distributed database failure-mode analysis", "Quantify trade-offs with latency numbers"],
                "recommended_actions": ["Review System Design scaling patterns in Learning Path", "Practice STAR behavioral responses"],
            }

        company_name = session["company_name"]
        target_role = session["target_role"]

        return await openrouter_service.evaluate_mock_interview(
            company_name=company_name,
            target_role=target_role,
            conversation_history=session["messages"],
        )

    # -----------------------------------------------------------------------
    # Saved Companies Bookmarking
    # -----------------------------------------------------------------------
    def toggle_save_company(self, user_id: str, company_id: str) -> dict[str, Any]:
        cid = company_id.lower().strip()
        saved = _user_saved_companies.setdefault(user_id, set())
        if cid in saved:
            saved.remove(cid)
            is_saved = False
        else:
            saved.add(cid)
            is_saved = True

        return {"company_id": cid, "is_saved": is_saved, "total_saved": len(saved)}

    def get_saved_companies(self, user_id: str) -> list[dict[str, Any]]:
        saved_ids = _user_saved_companies.get(user_id, set())
        return [c for c in self.companies if c["id"] in saved_ids]


interview_service = InterviewService()
