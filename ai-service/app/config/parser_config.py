# Central config for all parsers.

# Section keys
SECTION_KEYS: tuple[str] = (
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
    "contact": "contact",
    "personal details": "contact",
    "personal information": "contact",
    "contact details": "contact",
    "contact information": "contact",

    # Summary
    "summary": "summary",
    "professional summary": "summary",
    "professional profile": "summary",
    "profile": "summary",
    "about": "summary",
    "about me": "summary",
    "objective": "summary",
    "career objective": "summary",
    "personal statement": "summary",
    "introduction": "summary",
    "research interests": "summary",

    # Skills
    "skills": "skills",
    "technical skills": "skills",
    "key skills": "skills",
    "core competencies": "skills",
    "competencies": "skills",
    "areas of expertise": "skills",   
    "expertise": "skills",
    "technologies": "skills",
    "tools & technologies": "skills",
    "technical expertise": "skills",

    # Education
    "education": "education",
    "academic background": "education",
    "academic qualifications": "education",
    "educational background": "education",
    "qualifications": "education",
    "coding bootcamp": "education",

    # Experience
    "experience": "experience",
    "work experience": "experience",
    "professional experience": "experience",
    "employment history": "experience",
    "career history": "experience",
    "work history": "experience",      
    "work": "experience",             
    "employment": "experience",
    "professional background": "experience",
    "internship": "experience",         
    "internships": "experience",
    "prior career": "experience",       
    "software development experience": "experience", 

    # Projects
    "projects": "projects",
    "personal projects": "projects",
    "selected projects": "projects",
    "notable projects": "projects",     
    "side projects": "projects",        
    "key projects": "projects",
    "open source": "projects",
    "portfolio": "projects",

    # Certifications
    "certifications": "certifications",
    "certificates": "certifications",
    "licenses": "certifications",
    "licences": "certifications",
    "courses": "certifications",
    "training": "certifications",
    "professional development": "certifications",

    "languages": "other",
    "achievements": "other",
    "awards": "other",
    "honours": "other",
    "honors": "other",
    "publications": "other",
    "selected publications": "other",
    "conference talks & community": "other",
    "references": "other",
    "interests": "other",
    "hobbies": "other",
    "volunteer": "other",
    "volunteering": "other",
    "extracurricular": "other",
    "community": "other",
}

# Experience keywords
EXPERIENCE_ROLE_KEYWORDS: frozenset[str] = frozenset({
    "junior", "mid", "senior", "lead", "principal", "staff", "head",
    "chief", "associate", "graduate",
    "engineer", "developer", "programmer", "architect", "designer",
    "analyst", "scientist", "researcher", "consultant", "specialist",
    "manager", "director", "officer", "coordinator", "administrator",
    "executive", "president", "founder", "co-founder",
    "devops", "sre", "penetration", "tester", "accountant",
    "intern", "internship",
})

# Degree classification — lowest to highest.
DEGREE_PATTERNS: list[tuple[str, str]] = [
    ("olevel",  r"\b(a-level|o-level|waec|neco|ssce|high school|secondary school)\b"),
    ("bachelor", r"\b(bachelor|b\.?sc|b\.?eng|b\.?tech|b\.?a|hnd|undergraduate"
                 r"|first degree|associate)\b"),
    ("master",  r"\b(master|m\.?sc|m\.?eng|m\.?tech|m\.?a|mba|pg diploma"
                 r"|postgraduate)\b"),
    ("phd",     r"\b(phd|ph\.d|doctorate|doctoral|doctor of philosophy)\b"),
]

# Degree level hierachy
DEGREE_HIERARCHY: dict[str, int] = {
    "olevel":   0,
    "bachelor": 1,
    "master":   2,
    "phd":      3,
}

SKILL_STOP_WORDS: frozenset[str] = frozenset({
    "and", "or", "the", "with", "using", "a", "an",
})

SKILL_SKIP_TOKENS: frozenset[str] = frozenset({
    "google docs", "google sheets", "google slides",
    "sheets", "slides", "powerbi", "power bi",
    "microsoft word", "microsoft excel",
    "category", "skills",
})