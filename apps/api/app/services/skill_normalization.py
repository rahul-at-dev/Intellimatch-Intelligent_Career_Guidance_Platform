"""Skill and keyword normalization engine.

Maps common tech aliases, variations, and Affinda classifier tags (e.g. 'React.js' -> 'React',
'JS' -> 'JavaScript', 'Postgres' -> 'PostgreSQL') to canonical taxonomy names.
"""
from __future__ import annotations

import re
from app.data.seed_skills import SEED_SKILLS, normalize_skill_name

# Common aliases and synonyms map (lowercase -> Canonical Name)
COMMON_ALIASES: dict[str, str] = {
    # Languages
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ecmascript": "JavaScript",
    "es6": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "py": "Python",
    "python3": "Python",
    "python": "Python",
    "golang": "Go",
    "go": "Go",
    "cpp": "C++",
    "c++": "C++",
    "c plus plus": "C++",
    "c#": "C#",
    "c sharp": "C#",
    "sql": "SQL",
    "structured query language": "SQL",
    "java": "Java",
    "java8": "Java",
    "java11": "Java",
    "java17": "Java",

    # Frontend
    "react": "React",
    "react.js": "React",
    "reactjs": "React",
    "react js": "React",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "next js": "Next.js",
    "vue": "Vue.js",
    "vue.js": "Vue.js",
    "vuejs": "Vue.js",
    "angular": "Angular",
    "angularjs": "Angular",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "tailwind css": "Tailwind CSS",
    "html": "HTML5",
    "html5": "HTML5",
    "css": "CSS3",
    "css3": "CSS3",
    "redux": "Redux",

    # Backend & Frameworks
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "express": "Express.js",
    "expressjs": "Express.js",
    "express.js": "Express.js",
    "fastapi": "FastAPI",
    "fast api": "FastAPI",
    "django": "Django",
    "django rest framework": "Django",
    "drf": "Django",
    "flask": "Flask",
    "spring": "Spring Boot",
    "spring boot": "Spring Boot",
    "springboot": "Spring Boot",
    "spring framework": "Spring Boot",
    "rest": "REST APIs",
    "rest api": "REST APIs",
    "rest apis": "REST APIs",
    "restful": "REST APIs",
    "restful api": "REST APIs",
    "restful apis": "REST APIs",
    "graphql": "GraphQL",
    "graph ql": "GraphQL",
    "microservices": "Microservices",
    "micro-services": "Microservices",
    "microservice": "Microservices",

    # Databases
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "psql": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "redis": "Redis",
    "redis cache": "Redis",
    "elasticsearch": "Elasticsearch",
    "elastic search": "Elasticsearch",
    "es": "Elasticsearch",
    "dynamodb": "DynamoDB",
    "cassandra": "Cassandra",
    "sqlite": "SQLite",

    # Cloud & DevOps
    "aws": "AWS",
    "amazon web services": "AWS",
    "amazon elastic container service": "AWS",
    "azure": "Azure",
    "microsoft azure": "Azure",
    "gcp": "GCP",
    "google cloud": "GCP",
    "google cloud platform": "GCP",
    "docker": "Docker",
    "containerization": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "terraform": "Terraform",
    "iac": "Terraform",
    "infrastructure as code": "Terraform",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "continuous integration": "CI/CD",
    "continuous deployment": "CI/CD",
    "jenkins": "Jenkins",
    "github actions": "GitHub Actions",
    "ansible": "Ansible",
    "linux": "Linux",

    # AI / ML / Data
    "machine learning": "Machine Learning",
    "ml": "Machine Learning",
    "deep learning": "Deep Learning",
    "dl": "Deep Learning",
    "neural networks": "Deep Learning",
    "pytorch": "PyTorch",
    "torch": "PyTorch",
    "tensorflow": "TensorFlow",
    "tf": "TensorFlow",
    "scikit-learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "nlp": "NLP",
    "natural language processing": "NLP",
    "llm": "LLM Engineering",
    "llms": "LLM Engineering",
    "llm engineering": "LLM Engineering",
    "prompt engineering": "LLM Engineering",
    "langchain": "LangChain",
    "data engineering": "Data Engineering",
    "kafka": "Apache Kafka",
    "apache kafka": "Apache Kafka",
    "spark": "Apache Spark",
    "apache spark": "Apache Spark",
    "pyspark": "Apache Spark",
    "pandas": "Pandas",
    "numpy": "NumPy",

    # Architecture & Tools & Methods
    "system design": "System Design",
    "systems design": "System Design",
    "distributed systems": "System Design",
    "git": "Git",
    "github": "Git",
    "version control": "Git",
    "testing": "Testing",
    "unit testing": "Testing",
    "test automation": "Testing",
    "qa": "Testing",
    "agile": "Agile",
    "scrum": "Agile",
    "kanban": "Agile",
    "security": "Security",
    "application security": "Security",
    "appsec": "Security",
}

# Regex to strip common parser taxonomy suffix tags like "(Programming Language)"
AFFINDA_TAG_PATTERN = re.compile(
    r"\s*\((?:programming language|software|web framework|version control system|database|framework|library|cloud service)\)",
    re.IGNORECASE,
)


def clean_skill_string(raw: str) -> str:
    """Strip Affinda taxonomy suffixes and clean whitespace."""
    cleaned = AFFINDA_TAG_PATTERN.sub("", raw).strip()
    # Normalize multiple whitespaces
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned


def normalize_skill(raw: str) -> str:
    """Normalize a raw skill string into its canonical title.

    Handles case variations, synonyms, and taxonomy normalization.
    If no alias is found, returns clean title-cased string.
    """
    cleaned = clean_skill_string(raw)
    lower = cleaned.lower()

    # 1. Check direct aliases map
    if lower in COMMON_ALIASES:
        return COMMON_ALIASES[lower]

    # 2. Check canonical taxonomy normalizer from seed_skills
    canon = normalize_skill_name(cleaned)
    if canon:
        return canon

    # 3. Clean fallback
    # Preserve acronyms like AWS, SQL, API, CI/CD, NLP
    if lower in {"aws", "sql", "api", "rest", "ci/cd", "nlp", "gcp", "k8s", "ml", "dl", "db"}:
        return cleaned.upper()

    return cleaned.strip()


def normalize_skills_list(skills: list[str]) -> list[str]:
    """Normalize a list of skill strings and remove duplicates while preserving order."""
    seen = set()
    result = []
    for s in skills:
        if not s or not isinstance(s, str):
            continue
        norm = normalize_skill(s)
        if norm and norm.lower() not in seen:
            seen.add(norm.lower())
            result.append(norm)
    return result


def extract_skills_from_text(text: str) -> list[str]:
    """Extract known technical skills and canonical terms from arbitrary text (e.g. Job Description)."""
    if not text:
        return []

    found = set()
    lower_text = text.lower()

    # Match all aliases and seed skills
    # 1. Check all canonical skills and their synonyms
    for s in SEED_SKILLS:
        canon_name = s["name"]
        # Search for canonical name
        pattern = r"(?<![a-z0-9\+\#])" + re.escape(canon_name.lower()) + r"(?![a-z0-9\+\#])"
        if re.search(pattern, lower_text):
            found.add(canon_name)
            continue
        for syn in s["synonyms"]:
            syn_pattern = r"(?<![a-z0-9\+\#])" + re.escape(syn.lower()) + r"(?![a-z0-9\+\#])"
            if re.search(syn_pattern, lower_text):
                found.add(canon_name)
                break

    # 2. Check common aliases
    for alias_key, canon_name in COMMON_ALIASES.items():
        if canon_name not in found:
            alias_pattern = r"(?<![a-z0-9\+\#])" + re.escape(alias_key) + r"(?![a-z0-9\+\#])"
            if re.search(alias_pattern, lower_text):
                found.add(canon_name)

    return sorted(found)


# Alias for backwards and explicit semantic compatibility
extract_skills_from_jd = extract_skills_from_text



def extract_keywords_from_text(text: str) -> set[str]:
    """Extract domain keywords, technical terms, and action phrases for ATS keyword matching."""
    if not text:
        return set()

    # Basic stopwords to exclude
    stopwords = {
        "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with",
        "by", "about", "against", "between", "into", "through", "during", "before",
        "after", "above", "below", "from", "up", "down", "is", "are", "was", "were",
        "be", "been", "being", "have", "has", "had", "do", "does", "did", "can",
        "could", "should", "would", "may", "might", "must", "will", "shall", "of",
        "as", "if", "each", "how", "all", "any", "both", "few", "more", "most",
        "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
        "than", "too", "very", "s", "t", "just", "don", "shouldn", "now", "we",
        "you", "your", "they", "their", "our", "my", "he", "she", "it", "this",
        "that", "these", "those", "am", "i", "me", "him", "her", "us", "them",
        "role", "job", "responsibilities", "requirements", "candidate", "looking",
        "work", "experience", "years", "team", "company", "ability", "strong",
        "proven", "knowledge", "skills", "understanding", "working", "preferred",
    }

    tokens = re.findall(r"\b[a-zA-Z0-9\+\#\.\-]{2,30}\b", text.lower())
    keywords = set()
    for tok in tokens:
        clean_tok = tok.strip(".-")
        if len(clean_tok) >= 2 and clean_tok not in stopwords and not clean_tok.isdigit():
            keywords.add(clean_tok)

    return keywords
