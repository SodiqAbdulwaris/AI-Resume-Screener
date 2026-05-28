JOB_TITLE_HINTS: frozenset[str] = frozenset({
    "engineer", "developer", "manager", "analyst", "designer",
    "scientist", "consultant", "specialist", "intern", "director",
    "architect", "officer", "lead", "head", "senior", "junior",
})

SECTION_KEYS: tuple[str, ...] = (
    "summary",
    "contact",
    "skills",
    "education",
    "experience",
    "projects",
    "certifications",
    "other",
)

SECTION_ALIASES: dict[str, str] = {
    # Contact
    "contact":                          "contact",
    "personal details":                 "contact",
    "personal information":             "contact",
    "contact details":                  "contact",
    "contact information":              "contact",

    # Summary
    "summary":                          "summary",
    "professional summary":             "summary",
    "professional profile":             "summary",
    "profile":                          "summary",
    "about":                            "summary",
    "about me":                         "summary",
    "objective":                        "summary",
    "career objective":                 "summary",
    "personal statement":               "summary",
    "introduction":                     "summary",
    "research interests":               "summary",

    # Skills
    "skills":                           "skills",
    "technical skills":                 "skills",
    "key skills":                       "skills",
    "core competencies":                "skills",
    "competencies":                     "skills",
    "areas of expertise":               "skills",
    "expertise":                        "skills",
    "technologies":                     "skills",
    "tools & technologies":             "skills",
    "technical expertise":              "skills",

    # Education
    "education":                        "education",
    "academic background":              "education",
    "academic qualifications":          "education",
    "educational background":           "education",
    "qualifications":                   "education",
    "coding bootcamp":                  "education",

    # Experience
    "experience":                       "experience",
    "work experience":                  "experience",
    "professional experience":          "experience",
    "employment history":               "experience",
    "career history":                   "experience",
    "work history":                     "experience",
    "work":                             "experience",
    "employment":                       "experience",
    "professional background":          "experience",
    "internship":                       "experience",
    "internships":                      "experience",
    "prior career":                     "experience",
    "prior experience":                 "experience",
    "previous experience":              "experience",
    "software development experience":  "experience",

    # Projects
    "projects":                         "projects",
    "personal projects":                "projects",
    "selected projects":                "projects",
    "notable projects":                 "projects",
    "side projects":                    "projects",
    "key projects":                     "projects",
    "open source":                      "projects",
    "portfolio":                        "projects",
    "capstone project":                 "projects",

    # Certifications
    "certifications":                   "certifications",
    "certificates":                     "certifications",
    "licenses":                         "certifications",
    "licences":                         "certifications",
    "courses":                          "certifications",
    "training":                         "certifications",
    "professional development":         "certifications",

    # Other
    "languages":                        "other",
    "achievements":                     "other",
    "awards":                           "other",
    "honours":                          "other",
    "honors":                           "other",
    "publications":                     "other",
    "selected publications":            "other",
    "conference talks & community":     "other",
    "references":                       "other",
    "interests":                        "other",
    "hobbies":                          "other",
    "volunteer":                        "other",
    "volunteering":                     "other",
    "extracurricular":                  "other",
    "community":                        "other",
}

# EDUCATION PARSER
# Degree classification — ordered lowest to highest
DEGREE_PATTERNS: list[tuple[str, str]] = [
    ("olevel",   r"\b(a-level|o-level|waec|neco|ssce|high school|secondary school)\b"),
    ("bachelor", r"\b(bachelor|b\.?sc|b\.?eng|b\.?tech|b\.?a|hnd|undergraduate"
                 r"|first degree|associate)\b"),
    ("master",   r"\b(master|m\.?sc|m\.?eng|m\.?tech|m\.?a|mba|pg diploma"
                 r"|postgraduate)\b"),
    ("phd",      r"\b(phd|ph\.d|doctorate|doctoral|doctor of philosophy)\b"),
]

DEGREE_HIERARCHY: dict[str, int] = {
    "olevel":   0,
    "bachelor": 1,
    "master":   2,
    "phd":      3,
}

# SKILLS PARSER
SKILL_STOP_WORDS: frozenset[str] = frozenset({
    "and", "or", "the", "with", "using", "a", "an",
})

SKILL_SKIP_TOKENS: frozenset[str] = frozenset({
    "google docs", "google sheets", "google slides",
    "sheets", "slides", "powerbi", "power bi",
    "microsoft word", "microsoft excel",
    "category", "skills",
})

# PROJECTS PARSER
PROJECT_TECHNOLOGIES: frozenset[str] = frozenset({
    "python", "fastapi", "flask", "django", "sqlalchemy", "pydantic",
    "node", "nodejs", "express", "graphql", "rest", "grpc",
    "java", "spring", "kotlin", "go", "rust", "c++", "c#",
    "react", "vue", "angular", "nextjs", "svelte",
    "html", "css", "javascript", "typescript", "tailwind",
    "swift", "swiftui", "uikit", "flutter", "dart", "react native",
    "postgresql", "mysql", "sqlite", "mongodb", "redis",
    "supabase", "firebase", "dynamodb", "cassandra",
    "docker", "kubernetes", "terraform", "ansible", "helm",
    "aws", "gcp", "azure", "vercel", "heroku", "nginx",
    "github actions", "gitlab ci", "jenkins", "argocd",
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch",
    "langchain", "faiss", "hugging face", "spark", "airflow",
    "jwt", "oauth", "rbac", "websocket", "kafka", "celery",
    "git", "gitlab", "postman", "figma",
    "stripe", "paystack", "twilio",
})

# CERTIFICATIONS PARSER
CERT_ISSUER_KEYWORDS: frozenset[str] = frozenset({
    "aws", "amazon", "azure", "microsoft", "google", "gcp",
    "oracle", "ibm", "alibaba",
    "hashicorp", "kubernetes", "cka", "ckad", "cks", "linux foundation",
    "redhat", "red hat",
    "comptia", "ec-council", "ceh", "cissp", "cism", "giac", "offensive security",
    "oscp", "isc2", "(isc)²",
    "cisco", "ccna", "ccnp", "juniper",
    "tensorflow", "databricks", "snowflake", "tableau", "sas",
    "pmi", "pmp", "prince2", "scrum", "agile", "safe",
    "coursera", "udemy", "udacity", "edx", "pluralsight",
    "linkedin learning", "deeplearning.ai", "freecodecamp",
    "apple", "android", "google play",
    "certified", "certificate", "certification", "professional",
    "associate", "specialist", "expert", "foundation",
})

# EXPERIENCE PARSER
LEVEL_TOKENS: frozenset[str] = frozenset({
    "junior", "mid", "senior", "lead", "principal", "staff",
    "head", "chief", "associate", "graduate", "intern",
})


NOUN_TOKENS: frozenset[str] = frozenset({
    "engineer", "developer", "programmer", "architect", "designer",
    "analyst", "scientist", "researcher", "consultant", "specialist",
    "manager", "director", "officer", "coordinator", "administrator",
    "executive", "president", "founder", "co-founder", "devops",
    "sre", "accountant", "tester", "internship",
})

DOMAIN_TOKENS: frozenset[str] = frozenset({
    "backend", "frontend", "fullstack", "full-stack", "full stack",
    "cloud", "data", "mobile", "embedded", "platform", "infrastructure",
    "security", "ml", "ai", "product", "software", "web", "systems",
})

ROLE_PHRASE_ANCHORS: frozenset[str] = frozenset({
    "software engineer", "software developer", "product manager",
    "data scientist", "data analyst", "data engineer",
    "machine learning engineer", "ml engineer", "ai engineer",
    "backend engineer", "frontend engineer", "full stack engineer",
    "full stack developer", "backend developer", "frontend developer",
    "devops engineer", "site reliability engineer", "platform engineer",
    "security engineer", "qa engineer", "test engineer",
    "solutions architect", "cloud architect", "engineering manager",
    "technical lead", "tech lead", "scrum master", "project manager",
    "graduate accountant", "senior accountant", "junior developer",
    "freelance developer", "junior accountant",
})

COMPANY_SUFFIX_PATTERN_STR: str = (
    r"\b(ltd|limited|inc|llc|gmbh|plc|corp|corporation|group|bank"
    r"|technologies|solutions|consulting|studio|agency|systems|services"
    r"|university|college|institute|ventures|holdings|partners|associates"
    r"|foundation|incorporated|pwc|pricewaterhousecoopers)\b"
)

SELF_EMPLOYED_TOKENS: frozenset[str] = frozenset({
    "self-employed", "self employed", "freelance", "contract", "volunteer",
})

EXPERIENCE_ACADEMIC_FILTER_TOKENS: frozenset[str] = frozenset({
    "bootcamp", "degree", "university", "college", "bachelor", "master",
    "phd", "diploma", "course", "certification", "graduated", "student", "alumni",
})

EXPERIENCE_DESCRIPTION_STARTERS: frozenset[str] = frozenset({
    "built", "designed", "design", "developed", "develop", "led", "managed",
    "manage", "implemented", "created", "worked", "collaborated", "maintained",
    "improved", "reduced", "increased", "migrated", "integrated", "automated",
    "delivered", "deployed", "established", "conducted", "performed", "produced",
    "wrote", "architected", "launched", "owned", "drove", "contributed",
    "contributing", "fixed", "fix", "supervised", "rewrote", "added",
    "participated", "resolved", "optimized", "optimised", "refactored",
    "mentored", "reviewed",
})