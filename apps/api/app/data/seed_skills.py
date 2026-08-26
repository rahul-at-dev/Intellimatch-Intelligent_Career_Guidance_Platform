"""Canonical skill taxonomy with synonym normalization, loosely aligned to ESCO-style
categorization. Prevents duplicate skill entities (e.g. 'ReactJS'/'React.js' -> 'React')."""

SEED_SKILLS = [
    {"name": "Python", "category": "Language", "synonyms": ["python3", "py"]},
    {"name": "Java", "category": "Language", "synonyms": ["java8", "java11"]},
    {"name": "JavaScript", "category": "Language", "synonyms": ["js", "es6", "ecmascript"]},
    {"name": "TypeScript", "category": "Language", "synonyms": ["ts"]},
    {"name": "Go", "category": "Language", "synonyms": ["golang"]},
    {"name": "C++", "category": "Language", "synonyms": ["cpp", "c plus plus"]},
    {"name": "SQL", "category": "Language", "synonyms": ["postgresql", "mysql query", "structured query language"]},
    {"name": "React", "category": "Frontend", "synonyms": ["reactjs", "react.js", "react js"]},
    {"name": "Next.js", "category": "Frontend", "synonyms": ["nextjs", "next js"]},
    {"name": "Vue.js", "category": "Frontend", "synonyms": ["vuejs", "vue"]},
    {"name": "Tailwind CSS", "category": "Frontend", "synonyms": ["tailwind", "tailwindcss"]},
    {"name": "Node.js", "category": "Backend", "synonyms": ["nodejs", "node"]},
    {"name": "FastAPI", "category": "Backend", "synonyms": ["fast api"]},
    {"name": "Django", "category": "Backend", "synonyms": ["django rest framework", "drf"]},
    {"name": "Spring Boot", "category": "Backend", "synonyms": ["springboot", "spring"]},
    {"name": "REST APIs", "category": "Backend", "synonyms": ["rest", "restful api"]},
    {"name": "GraphQL", "category": "Backend", "synonyms": ["graph ql"]},
    {"name": "Microservices", "category": "Architecture", "synonyms": ["micro-services", "microservice architecture"]},
    {"name": "Docker", "category": "DevOps", "synonyms": ["containerization", "dockerized"]},
    {"name": "Kubernetes", "category": "DevOps", "synonyms": ["k8s"]},
    {"name": "AWS", "category": "Cloud", "synonyms": ["amazon web services"]},
    {"name": "Azure", "category": "Cloud", "synonyms": ["microsoft azure"]},
    {"name": "GCP", "category": "Cloud", "synonyms": ["google cloud platform", "google cloud"]},
    {"name": "Terraform", "category": "DevOps", "synonyms": ["iac", "infrastructure as code"]},
    {"name": "CI/CD", "category": "DevOps", "synonyms": ["continuous integration", "continuous deployment", "jenkins", "github actions"]},
    {"name": "PostgreSQL", "category": "Database", "synonyms": ["postgres"]},
    {"name": "MongoDB", "category": "Database", "synonyms": ["mongo", "nosql document db"]},
    {"name": "Redis", "category": "Database", "synonyms": ["redis cache"]},
    {"name": "Elasticsearch", "category": "Database", "synonyms": ["elastic search", "es"]},
    {"name": "Machine Learning", "category": "AI/ML", "synonyms": ["ml"]},
    {"name": "Deep Learning", "category": "AI/ML", "synonyms": ["dl", "neural networks"]},
    {"name": "PyTorch", "category": "AI/ML", "synonyms": ["torch"]},
    {"name": "TensorFlow", "category": "AI/ML", "synonyms": ["tf"]},
    {"name": "scikit-learn", "category": "AI/ML", "synonyms": ["sklearn"]},
    {"name": "NLP", "category": "AI/ML", "synonyms": ["natural language processing"]},
    {"name": "LLM Engineering", "category": "AI/ML", "synonyms": ["prompt engineering", "llm ops"]},
    {"name": "Data Engineering", "category": "Data", "synonyms": ["etl", "data pipelines"]},
    {"name": "Apache Kafka", "category": "Data", "synonyms": ["kafka"]},
    {"name": "Apache Spark", "category": "Data", "synonyms": ["pyspark", "spark"]},
    {"name": "System Design", "category": "Architecture", "synonyms": ["distributed systems design"]},
    {"name": "Testing", "category": "Quality", "synonyms": ["unit testing", "test automation", "qa"]},
    {"name": "Git", "category": "Tools", "synonyms": ["github", "version control"]},
    {"name": "Agile", "category": "Process", "synonyms": ["scrum", "kanban"]},
    {"name": "Security", "category": "Security", "synonyms": ["appsec", "application security"]},
    {"name": "Product Management", "category": "Product", "synonyms": ["pm"]},
    {"name": "UI/UX Design", "category": "Design", "synonyms": ["ux design", "ui design", "figma"]},
]

# Skill graph edges: (source, relation, target)
SKILL_GRAPH_EDGES = [
    ("Java", "LEADS_TO", "Spring Boot"),
    ("Spring Boot", "LEADS_TO", "REST APIs"),
    ("REST APIs", "LEADS_TO", "Microservices"),
    ("Microservices", "LEADS_TO", "Docker"),
    ("Docker", "LEADS_TO", "Kubernetes"),
    ("Kubernetes", "LEADS_TO", "AWS"),
    ("AWS", "RELATED_TO", "Azure"),
    ("AWS", "RELATED_TO", "GCP"),
    ("Python", "LEADS_TO", "Machine Learning"),
    ("Machine Learning", "LEADS_TO", "Deep Learning"),
    ("Deep Learning", "LEADS_TO", "PyTorch"),
    ("Machine Learning", "RELATED_TO", "scikit-learn"),
    ("NLP", "RELATED_TO", "LLM Engineering"),
    ("JavaScript", "LEADS_TO", "React"),
    ("React", "LEADS_TO", "Next.js"),
    ("Node.js", "RELATED_TO", "REST APIs"),
    ("SQL", "RELATED_TO", "PostgreSQL"),
    ("Data Engineering", "RELATED_TO", "Apache Kafka"),
    ("Data Engineering", "RELATED_TO", "Apache Spark"),
    ("Docker", "PREREQUISITE_OF", "Kubernetes"),
    ("Git", "PREREQUISITE_OF", "CI/CD"),
]


def normalize_skill_name(raw: str) -> str | None:
    raw_lower = raw.strip().lower()
    for s in SEED_SKILLS:
        if raw_lower == s["name"].lower():
            return s["name"]
        if raw_lower in [syn.lower() for syn in s["synonyms"]]:
            return s["name"]
    return None
