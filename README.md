# IntelliMatch AI

**Understand your potential. Match your future.**

Enterprise-grade AI + ML career intelligence platform: Affinda-powered resume parsing, custom transparent ATS scoring engine, skill-gap analysis, hybrid semantic + ML job matching, a skill knowledge graph, career roadmap/simulation, skill ROI, GitHub verification, AI assessments, market intelligence, and a student career assistant.

---

## 1. Overview & Architecture

```mermaid
flowchart LR
    subgraph Frontend
        WEB[Next.js 14 Web App]
    end
    subgraph Backend
        API[FastAPI Backend]
        SVC[Services: resume / affinda / ats / skill / career / growth]
    end
    subgraph External
        AFFINDA[Affinda Resume Parser API]
        CLERK[Clerk Authentication]
        OPENROUTER[LLM via OpenRouter]
    end
    subgraph Data
        PG[(PostgreSQL + Prisma)]
        REDIS[(Redis Cache / Broker)]
        NEO[(Neo4j Knowledge Graph)]
        QD[(Qdrant Vector DB)]
    end
    subgraph ML
        LGBM[LightGBM LambdaMART Reranker]
        ATS[Custom ATS Scoring Engine]
        SG[Deterministic Skill Gap Engine]
    end

    WEB -->|REST + Bearer JWT| API
    API --> SVC
    SVC --> AFFINDA
    SVC --> CLERK
    SVC --> ATS
    SVC --> SG
    SVC --> LGBM
    SVC --> PG
    SVC --> REDIS
    SVC --> NEO
    SVC --> QD
    SVC --> OPENROUTER
```

---

## 2. Resume Intelligence & ATS Scoring Pipeline

```
Candidate Uploads PDF / DOCX (+ Optional Job Description)
      ↓
Affinda Resume Parser API (Extraction Only)
      ↓
Normalized Internal Resume Data Model
      ↓
Custom IntelliMatch ATS Scoring Engine
      ↓
Deterministic Skill Gap Engine
      ↓
Personalized Optimization Recommendations
      ↓
Interactive Resume Analysis Dashboard
```

### Responsibility Split
- **Affinda Parser:** Solely responsible for high-accuracy optical and document parsing (extracting raw name, emails, phone numbers, work experience, education, skills, and dates).
- **IntelliMatch ATS Engine:** Our custom scoring algorithm calculates resume readiness, keyword alignment, and job description compatibility (0–100 scale).
- **IntelliMatch Skill Gap Engine:** Deterministically maps resume skills against target job description requirements, computing gap percentages and prioritized learning targets.

---

## 3. ATS Scoring Formula & Weights

Our ATS engine uses a transparent, configurable multi-factor model:

$$\text{ATS Score} = \sum (\text{Component Score} \times \text{Weight})$$

| Component | Weight | Description |
|---|---|---|
| **Skill Match** | **40%** | Ratio of matched canonical skills to required job skills (or skill depth in resume-only mode). |
| **Experience Match** | **20%** | Alignment between candidate years of experience / seniority and job requirements. |
| **Keyword Match** | **15%** | Overlap of technical terminology, domain keywords, and action verbs. |
| **Education Match** | **15%** | Alignment with required degree levels (e.g. B.S., M.S., Computer Science). |
| **Structure & Readability** | **10%** | Formatting score evaluating contact details, summary, dates, and bullet clarity. |

*Configurable in `apps/api/app/services/ats_engine.py` via `ATS_WEIGHTS`.*

### Two Analysis Modes Supported
1. **Mode 1: Resume-Only Quality Analysis:** Evaluates structural completeness, skill depth, formatting, and general ATS readiness when no job description is provided.
2. **Mode 2: Resume + Job Description Compatibility Analysis:** Computes targeted compatibility, matched/missing skills, missing keywords, experience alignment, and tailored recommendations.

---

## 4. Affinda API Setup Guide

### Step 1: Create an Affinda Account
1. Go to [https://affinda.com](https://affinda.com) and click **Start Free** or **Sign In**.
2. Sign up with your email or Google account to access the Affinda Workspace Portal.

### Step 2: Obtain your API Key
1. In the Affinda portal, navigate to **Settings** > **API Keys** (or [https://app.affinda.com/settings/api-keys](https://app.affinda.com/settings/api-keys)).
2. Click **Create API Key**, enter a name (e.g. `IntelliMatch-Dev`), and copy the key (starts with `aff_...`).

### Step 3: Obtain Workspace ID & Document Type ID
1. In the Affinda portal, go to your **Workspace** (e.g. `My Organization`).
2. The URL or Workspace settings displays your Workspace identifier (e.g. `pgnqNFIr`).
3. Under Document Types or Collections, select the **Resume Parser** extractor. Its identifier is your Document Type ID (e.g. `oiBgDiDF`).

---

## 5. Environment Variables Configuration

Create `.env` in `apps/api/` and `.env.local` in `apps/web/`:

### Backend (`apps/api/.env`)
```bash
# App Mode
DEMO_MODE=true

# Affinda Resume Parser API
AFFINDA_API_KEY=your_affinda_api_key_here
AFFINDA_WORKSPACE_ID=your_workspace_id_here
AFFINDA_DOCUMENT_TYPE=your_document_type_id_here

# Clerk Authentication (JWT verification)
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# Database & Cache (Optional / Docker)
DATABASE_URL=postgresql://intellimatch:intellimatch@localhost:5432/intellimatch
REDIS_URL=redis://localhost:6379/0
QDRANT_URL=http://localhost:6333
NEO4J_URL=bolt://localhost:7687

CORS_ORIGINS=["http://localhost:3000"]
```

### Frontend (`apps/web/.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

---

## 6. Installation & Running

### 1. Install Backend Dependencies
```bash
cd apps/api
# Recommended: create virtual environment
python -m venv .venv
.\.venv\Scripts\activate  # Windows
# source .venv/bin/activate # Linux/Mac

pip install -r requirements.txt
```

### 2. Start the Backend API
```bash
cd apps/api
uvicorn app.main:app --reload --port 8000
```
*The FastAPI backend will start at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.*

### 3. Install Frontend Dependencies & Start Web App
```bash
cd apps/web
npm install --legacy-peer-deps
npm run dev
```
*The Next.js frontend will start at `http://localhost:3000`.*

---

## 7. API Examples

### Resume Analysis Endpoint: `POST /api/resume/analyze`

**Request:** `multipart/form-data`
- `file`: `resume.pdf` (binary file)
- `job_description`: (optional string) `"Seeking Backend Engineer with Python, FastAPI, Docker, and AWS."`

**Example Response:**
```json
{
  "file_name": "resume.pdf",
  "ats_score": 82,
  "mode": "resume_and_job",
  "breakdown": {
    "skill_match": 85.0,
    "experience_match": 80.0,
    "keyword_match": 80.0,
    "education_match": 90.0,
    "structure_score": 75.0
  },
  "structured_data": {
    "personal_info": {
      "name": "Alex Rivera",
      "email": "alex.rivera@example.com",
      "phone": "+1-555-0199",
      "location": "San Francisco, CA",
      "summary": "Backend Engineer with 4 years building scalable systems."
    },
    "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Git"],
    "education": [
      {
        "institution": "University of California, Berkeley",
        "degree": "Bachelor of Science",
        "dates": "2016 - 2020"
      }
    ],
    "experience": [
      {
        "title": "Senior Backend Engineer",
        "company": "CloudScale Inc.",
        "dates": "2022 - Present",
        "description": "Architected microservices in Python, FastAPI, and PostgreSQL."
      }
    ],
    "total_experience_years": 4.0
  },
  "matched_skills": ["Docker", "FastAPI", "Python"],
  "missing_skills": ["AWS"],
  "skill_gap": {
    "matched_skills": ["Docker", "FastAPI", "Python"],
    "missing_skills": ["AWS"],
    "skill_gap_percentage": 25.0,
    "priority_skills": [
      {
        "skill": "AWS",
        "priority": "High",
        "reason": "Primary cloud infrastructure platform heavily sought after by top engineering teams."
      }
    ]
  },
  "recommendations": [
    "Add projects or experience demonstrating 'AWS' to address key job requirements."
  ],
  "disclaimer": "This ATS score is an IntelliMatch compatibility estimate based on deterministic heuristics and semantic matching. It is not an official vendor ATS certification."
}
```

---

## 8. Running Automated Tests

```bash
# Run backend test suite
cd apps/api
.\.venv\Scripts\python.exe -m pytest -v

# Run frontend type check and build
cd apps/web
npx tsc --noEmit
npm run build
```

---

## 9. Responsible AI & Ethics

- **No Sensitive Attributes:** No demographic attributes (gender, race, age) are used in ATS scoring or ranking.
- **Explainable Scores:** Every score provides a 5-metric breakdown and transparent weight factors.
- **Clear Disclaimers:** All compatibility projections are explicitly identified as model estimates.
- **Human in the Loop:** *"AI assists decisions. Humans remain responsible for final career and hiring choices."*
