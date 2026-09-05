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

# EDUCATION PARSER
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

# PROJECTS PARSER — mostly proper nouns/tech names, already language-invariant.
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

# CERTIFICATIONS PARSER — mostly proper nouns (issuers); only the generic
# qualifier words at the end vary by language, and those live in LANG_CONFIGS.
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
})

# ─────────────────────────────────────────────────────────────────────────────
# LANGUAGE-SPECIFIC VOCABULARY
#
# Everything below drives section detection, degree detection, and the
# experience-entry scoring engine — all of it is naturally-occurring-language
# dependent, unlike the proper-noun lists above. Keyed by ISO 639-1 code.
# `get_lang_config` falls back to "en" for any language not in this dict, or
# any key missing from a language's entry (so a partial translation degrades
# gracefully instead of raising).
# ─────────────────────────────────────────────────────────────────────────────

SUPPORTED_LANGUAGES: frozenset[str] = frozenset({"en", "es", "fr", "de", "pt"})

LANG_CONFIGS: dict[str, dict] = {
    "en": {
        "section_aliases": {
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
            "prior experience": "experience",
            "previous experience": "experience",
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
            "capstone project": "projects",
            # Certifications
            "certifications": "certifications",
            "certificates": "certifications",
            "licenses": "certifications",
            "licences": "certifications",
            "courses": "certifications",
            "training": "certifications",
            "professional development": "certifications",
            # Other
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
        },
        "degree_patterns": [
            ("olevel",   r"\b(a-level|o-level|waec|neco|ssce|high school|secondary school)\b"),
            ("bachelor", r"\b(bachelor|b\.?sc|b\.?eng|b\.?tech|b\.?a|hnd|undergraduate"
                         r"|first degree|associate)\b"),
            ("master",   r"\b(master|m\.?sc|m\.?eng|m\.?tech|m\.?a|mba|pg diploma"
                         r"|postgraduate)\b"),
            ("phd",      r"\b(phd|ph\.d|doctorate|doctoral|doctor of philosophy)\b"),
        ],
        "months": r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*",
        "present_words": {"present", "current", "ongoing", "in progress", "now"},
        "role_at_company_word": "at",
        "role_company_separator": r"\s+[—–|·]\s+",
        "level_tokens": frozenset({
            "junior", "mid", "senior", "lead", "principal", "staff",
            "head", "chief", "associate", "graduate", "intern",
        }),
        "noun_tokens": frozenset({
            "engineer", "developer", "programmer", "architect", "designer",
            "analyst", "scientist", "researcher", "consultant", "specialist",
            "manager", "director", "officer", "coordinator", "administrator",
            "executive", "president", "founder", "co-founder", "devops",
            "sre", "accountant", "tester", "internship",
        }),
        "domain_tokens": frozenset({
            "backend", "frontend", "fullstack", "full-stack", "full stack",
            "cloud", "data", "mobile", "embedded", "platform", "infrastructure",
            "security", "ml", "ai", "product", "software", "web", "systems",
        }),
        "role_phrase_anchors": frozenset({
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
        }),
        "company_suffix_pattern_str": (
            r"\b(ltd|limited|inc|llc|gmbh|plc|corp|corporation|group|bank"
            r"|technologies|solutions|consulting|studio|agency|systems|services"
            r"|university|college|institute|ventures|holdings|partners|associates"
            r"|foundation|incorporated|pwc|pricewaterhousecoopers)\b"
        ),
        "self_employed_tokens": frozenset({
            "self-employed", "self employed", "freelance", "contract", "volunteer",
        }),
        "academic_filter_tokens": frozenset({
            "bootcamp", "degree", "university", "college", "bachelor", "master",
            "phd", "diploma", "course", "certification", "graduated", "student", "alumni",
        }),
        "description_starters": frozenset({
            "built", "designed", "design", "developed", "develop", "led", "managed",
            "manage", "implemented", "created", "worked", "collaborated", "maintained",
            "improved", "reduced", "increased", "migrated", "integrated", "automated",
            "delivered", "deployed", "established", "conducted", "performed", "produced",
            "wrote", "architected", "launched", "owned", "drove", "contributed",
            "contributing", "fixed", "fix", "supervised", "rewrote", "added",
            "participated", "resolved", "optimized", "optimised", "refactored",
            "mentored", "reviewed",
        }),
        "skill_label_prefixes": {
            "languages", "programming languages", "other", "tools", "frameworks", "libraries",
            "frameworks & libraries", "libraries/frameworks", "architecture", "design",
            "architecture & design", "frontend", "backend", "databases", "database",
            "web", "mobile", "devops", "cloud", "cloud platforms", "platforms",
            "containers & orchestration", "containers", "orchestration",
            "infrastructure as code", "ci/cd", "monitoring & observability", "monitoring",
            "observability", "networking", "security", "primary", "secondary", "tertiary",
            "testing", "test", "scripting", "scripting languages", "ml frameworks",
            "ml/dl", "ml / dl", "data tools", "data", "big data", "nlp", "mlops",
            "offensive security", "defensive / soc", "defensive", "cloud security",
            "devsecops", "forensics", "soft skills", "concepts", "version control",
            "ios frameworks", "cross-platform", "tooling", "observability tools",
            "tools & devops", "tools & technologies",
        },
        "cert_qualifier_keywords": frozenset({
            "certified", "certificate", "certification", "professional",
            "associate", "specialist", "expert", "foundation",
        }),
    },

    "es": {
        "section_aliases": {
            "contacto": "contact",
            "datos personales": "contact",
            "información de contacto": "contact",
            "informacion de contacto": "contact",
            "resumen": "summary",
            "perfil": "summary",
            "perfil profesional": "summary",
            "sobre mí": "summary",
            "sobre mi": "summary",
            "objetivo": "summary",
            "objetivo profesional": "summary",
            "presentación": "summary",
            "habilidades": "skills",
            "aptitudes": "skills",
            "competencias": "skills",
            "habilidades técnicas": "skills",
            "habilidades tecnicas": "skills",
            "competencias clave": "skills",
            "tecnologías": "skills",
            "tecnologias": "skills",
            "educación": "education",
            "educacion": "education",
            "formación académica": "education",
            "formacion academica": "education",
            "formación": "education",
            "formacion": "education",
            "estudios": "education",
            "experiencia": "experience",
            "experiencia laboral": "experience",
            "experiencia profesional": "experience",
            "historial laboral": "experience",
            "trayectoria profesional": "experience",
            "trabajo": "experience",
            "empleo": "experience",
            "prácticas": "experience",
            "practicas": "experience",
            "proyectos": "projects",
            "proyectos personales": "projects",
            "proyectos destacados": "projects",
            "certificaciones": "certifications",
            "certificados": "certifications",
            "cursos": "certifications",
            "licencias": "certifications",
            "idiomas": "other",
            "logros": "other",
            "premios": "other",
            "publicaciones": "other",
            "referencias": "other",
            "intereses": "other",
            "voluntariado": "other",
        },
        "degree_patterns": [
            ("olevel",   r"\b(bachillerato|educación secundaria|educacion secundaria|escuela secundaria)\b"),
            ("bachelor", r"\b(licenciatura|licenciado|licenciada|grado universitario|ingenierí­a|ingenieria|técnico superior|tecnico superior)\b"),
            ("master",   r"\b(maestrí­a|maestria|máster|master en|postgrado|posgrado|especialización|especializacion)\b"),
            ("phd",      r"\b(doctorado|doctor en|phd)\b"),
        ],
        "months": r"(?:ene|feb|mar|abr|may|jun|jul|ago|sep|sept|oct|nov|dic)[a-z]*",
        "present_words": {"presente", "actual", "actualidad", "en curso", "ahora"},
        "role_at_company_word": "en",
        "role_company_separator": r"\s+[—–|·]\s+",
        "level_tokens": frozenset({
            "junior", "senior", "líder", "lider", "principal", "jefe",
            "asociado", "asociada", "becario", "becaria", "practicante",
        }),
        "noun_tokens": frozenset({
            "ingeniero", "ingeniera", "desarrollador", "desarrolladora", "programador",
            "programadora", "arquitecto", "arquitecta", "diseñador", "diseñadora",
            "analista", "científico", "cientifica", "investigador", "investigadora",
            "consultor", "consultora", "especialista", "gerente", "director",
            "directora", "coordinador", "coordinadora", "administrador", "administradora",
            "ejecutivo", "ejecutiva", "presidente", "fundador", "fundadora",
            "contador", "contadora", "probador", "probadora",
        }),
        "domain_tokens": frozenset({
            "backend", "frontend", "fullstack", "nube", "datos", "móvil", "movil",
            "embebido", "plataforma", "infraestructura", "seguridad", "producto",
            "software", "web", "sistemas",
        }),
        "role_phrase_anchors": frozenset({
            "ingeniero de software", "ingeniera de software", "desarrollador de software",
            "gerente de producto", "científico de datos", "cientifica de datos",
            "analista de datos", "ingeniero de datos", "ingeniero backend",
            "ingeniero frontend", "ingeniero devops", "arquitecto de soluciones",
            "líder técnico", "lider tecnico", "gerente de proyecto",
        }),
        "company_suffix_pattern_str": (
            r"\b(s\.?a\.?|s\.?l\.?|sociedad anónima|sociedad anonima|grupo|banco"
            r"|tecnologías|tecnologias|soluciones|consultoría|consultoria|estudio"
            r"|agencia|sistemas|servicios|universidad|instituto|fundación|fundacion)\b"
        ),
        "self_employed_tokens": frozenset({
            "autónomo", "autonomo", "independiente", "freelance", "contrato", "voluntario", "voluntaria",
        }),
        "academic_filter_tokens": frozenset({
            "bootcamp", "grado", "universidad", "licenciatura", "maestría", "maestria",
            "doctorado", "diplomado", "curso", "certificación", "certificacion",
            "graduado", "graduada", "estudiante", "egresado", "egresada",
        }),
        "description_starters": frozenset({
            "construí", "construi", "diseñé", "disenee", "desarrollé", "desarrolle",
            "lideré", "lidere", "gestioné", "gestione", "implementé", "implemente",
            "creé", "cree", "colaboré", "colabore", "mantuve", "mejoré", "mejore",
            "reduje", "aumenté", "aumente", "migré", "migre", "integré", "integre",
            "automaticé", "automatice", "entregué", "entregue", "desplegué", "desplegue",
            "establecí", "estableci", "realicé", "realice", "escribí", "escribi",
            "lancé", "lance", "contribuí", "contribui", "solucioné", "solucione",
            "optimicé", "optimice", "refactoricé", "refactorice", "revisé", "revise",
        }),
        "skill_label_prefixes": {
            "idiomas", "lenguajes de programación", "lenguajes de programacion", "otros",
            "herramientas", "frameworks", "librerías", "librerias", "arquitectura",
            "diseño", "diseno", "frontend", "backend", "bases de datos", "web", "móvil",
            "movil", "nube", "plataformas", "contenedores", "seguridad", "pruebas",
            "control de versiones",
        },
        "cert_qualifier_keywords": frozenset({
            "certificado", "certificada", "certificación", "certificacion",
            "profesional", "asociado", "asociada", "especialista", "experto", "experta",
        }),
    },

    "fr": {
        "section_aliases": {
            "contact": "contact",
            "coordonnées": "contact",
            "coordonnees": "contact",
            "informations personnelles": "contact",
            "résumé": "summary",
            "resume": "summary",
            "profil": "summary",
            "profil professionnel": "summary",
            "à propos": "summary",
            "a propos": "summary",
            "objectif": "summary",
            "objectif professionnel": "summary",
            "présentation": "summary",
            "presentation": "summary",
            "compétences": "skills",
            "competences": "skills",
            "compétences techniques": "skills",
            "competences techniques": "skills",
            "aptitudes": "skills",
            "technologies": "skills",
            "formation": "education",
            "formation académique": "education",
            "formation academique": "education",
            "études": "education",
            "etudes": "education",
            "diplômes": "education",
            "diplomes": "education",
            "expérience": "experience",
            "experience": "experience",
            "expérience professionnelle": "experience",
            "experience professionnelle": "experience",
            "parcours professionnel": "experience",
            "historique professionnel": "experience",
            "emploi": "experience",
            "stage": "experience",
            "stages": "experience",
            "projets": "projects",
            "projets personnels": "projects",
            "projets sélectionnés": "projects",
            "projets selectionnes": "projects",
            "certifications": "certifications",
            "certificats": "certifications",
            "cours": "certifications",
            "licences": "certifications",
            "langues": "other",
            "réalisations": "other",
            "realisations": "other",
            "récompenses": "other",
            "recompenses": "other",
            "publications": "other",
            "références": "other",
            "references": "other",
            "centres d'intérêt": "other",
            "centres d'interet": "other",
            "bénévolat": "other",
            "benevolat": "other",
        },
        "degree_patterns": [
            ("olevel",   r"\b(baccalauréat|baccalaureat|bac|lycée|lycee|école secondaire|ecole secondaire)\b"),
            ("bachelor", r"\b(licence|bachelor|diplôme universitaire|diplome universitaire|bts|dut)\b"),
            ("master",   r"\b(master|mastère|mastere|diplôme d'ingénieur|diplome d'ingenieur|mba|troisième cycle|troisieme cycle)\b"),
            ("phd",      r"\b(doctorat|docteur|thèse|these|phd)\b"),
        ],
        "months": r"(?:jan|fév|fev|mar|avr|mai|juin|juil|aoû|aou|sep|sept|oct|nov|déc|dec)[a-zéû]*",
        "present_words": {"présent", "present", "actuel", "actuelle", "en cours", "aujourd'hui"},
        "role_at_company_word": "chez",
        "role_company_separator": r"\s+[—–|·]\s+",
        "level_tokens": frozenset({
            "junior", "senior", "responsable", "principal", "chef", "associé",
            "associe", "stagiaire", "diplômé", "diplome",
        }),
        "noun_tokens": frozenset({
            "ingénieur", "ingenieur", "ingénieure", "ingenieure", "développeur",
            "developpeur", "développeuse", "developpeuse", "programmeur", "architecte",
            "designer", "analyste", "scientifique", "chercheur", "chercheuse",
            "consultant", "consultante", "spécialiste", "specialiste", "gestionnaire",
            "directeur", "directrice", "coordinateur", "coordinatrice", "administrateur",
            "administratrice", "cadre", "président", "president", "fondateur",
            "fondatrice", "comptable", "testeur", "testeuse",
        }),
        "domain_tokens": frozenset({
            "backend", "frontend", "cloud", "données", "donnees", "mobile", "embarqué",
            "embarque", "plateforme", "infrastructure", "sécurité", "securite",
            "produit", "logiciel", "web", "systèmes", "systemes",
        }),
        "role_phrase_anchors": frozenset({
            "ingénieur logiciel", "ingenieur logiciel", "développeur logiciel",
            "developpeur logiciel", "chef de produit", "scientifique de données",
            "scientifique de donnees", "analyste de données", "analyste de donnees",
            "ingénieur de données", "ingenieur de donnees", "ingénieur backend",
            "ingenieur backend", "ingénieur frontend", "ingenieur frontend",
            "architecte solutions", "chef de projet", "responsable technique",
        }),
        "company_suffix_pattern_str": (
            r"\b(sarl|sas|sa|groupe|banque|technologies|solutions|conseil|studio"
            r"|agence|systèmes|systemes|services|université|universite|institut"
            r"|fondation)\b"
        ),
        "self_employed_tokens": frozenset({
            "indépendant", "independant", "indépendante", "independante", "freelance",
            "contrat", "bénévole", "benevole",
        }),
        "academic_filter_tokens": frozenset({
            "bootcamp", "diplôme", "diplome", "université", "universite", "licence",
            "master", "doctorat", "cours", "certification", "diplômé", "diplome",
            "étudiant", "etudiant", "ancien élève", "ancien eleve",
        }),
        "description_starters": frozenset({
            "conçu", "concu", "développé", "developpe", "dirigé", "dirige", "géré",
            "gere", "mis en œuvre", "mis en oeuvre", "créé", "cree", "collaboré",
            "collabore", "maintenu", "amélioré", "ameliore", "réduit", "reduit",
            "augmenté", "augmente", "migré", "migre", "intégré", "integre",
            "automatisé", "automatise", "livré", "livre", "déployé", "deploye",
            "établi", "etabli", "réalisé", "realise", "rédigé", "redige", "lancé",
            "lance", "contribué", "contribue", "résolu", "resolu", "optimisé",
            "optimise", "révisé", "revise",
        }),
        "skill_label_prefixes": {
            "langues", "langages de programmation", "autres", "outils", "frameworks",
            "bibliothèques", "bibliotheques", "architecture", "conception", "frontend",
            "backend", "bases de données", "bases de donnees", "web", "mobile",
            "cloud", "plateformes", "conteneurs", "sécurité", "securite", "tests",
            "contrôle de version", "controle de version",
        },
        "cert_qualifier_keywords": frozenset({
            "certifié", "certifie", "certifiée", "certifiee", "certification",
            "professionnel", "professionnelle", "associé", "associe", "spécialiste",
            "specialiste", "expert", "experte",
        }),
    },

    "de": {
        "section_aliases": {
            "kontakt": "contact",
            "persönliche daten": "contact",
            "personliche daten": "contact",
            "kontaktdaten": "contact",
            "zusammenfassung": "summary",
            "profil": "summary",
            "berufsprofil": "summary",
            "über mich": "summary",
            "uber mich": "summary",
            "ziel": "summary",
            "berufsziel": "summary",
            "einleitung": "summary",
            "fähigkeiten": "skills",
            "fahigkeiten": "skills",
            "kenntnisse": "skills",
            "kompetenzen": "skills",
            "technische fähigkeiten": "skills",
            "technische fahigkeiten": "skills",
            "technologien": "skills",
            "ausbildung": "education",
            "bildung": "education",
            "akademischer werdegang": "education",
            "schulbildung": "education",
            "qualifikationen": "education",
            "berufserfahrung": "experience",
            "erfahrung": "experience",
            "arbeitserfahrung": "experience",
            "beruflicher werdegang": "experience",
            "werdegang": "experience",
            "beschäftigung": "experience",
            "beschaftigung": "experience",
            "praktikum": "experience",
            "praktika": "experience",
            "projekte": "projects",
            "persönliche projekte": "projects",
            "personliche projekte": "projects",
            "ausgewählte projekte": "projects",
            "ausgewahlte projekte": "projects",
            "zertifizierungen": "certifications",
            "zertifikate": "certifications",
            "kurse": "certifications",
            "lizenzen": "certifications",
            "sprachen": "other",
            "erfolge": "other",
            "auszeichnungen": "other",
            "veröffentlichungen": "other",
            "veroffentlichungen": "other",
            "referenzen": "other",
            "interessen": "other",
            "ehrenamt": "other",
        },
        "degree_patterns": [
            ("olevel",   r"\b(abitur|realschule|hauptschule|gymnasium|sekundarschule)\b"),
            ("bachelor", r"\b(bachelor|b\.?sc|b\.?eng|b\.?a|grundständiges studium|grundstandiges studium)\b"),
            ("master",   r"\b(master|m\.?sc|m\.?eng|m\.?a|mba|aufbaustudium)\b"),
            ("phd",      r"\b(doktor|promotion|doktortitel|phd)\b"),
        ],
        "months": r"(?:jan|feb|mär|mar|apr|mai|jun|jul|aug|sep|sept|okt|nov|dez)[a-zä]*",
        "present_words": {"heute", "aktuell", "gegenwärtig", "gegenwartig", "laufend", "jetzt"},
        "role_at_company_word": "bei",
        "role_company_separator": r"\s+[—–|·]\s+",
        "level_tokens": frozenset({
            "junior", "senior", "leiter", "leiterin", "principal", "verantwortlich",
            "assoziiert", "praktikant", "praktikantin", "absolvent", "absolventin",
        }),
        "noun_tokens": frozenset({
            "ingenieur", "ingenieurin", "entwickler", "entwicklerin", "programmierer",
            "programmiererin", "architekt", "architektin", "designer", "designerin",
            "analyst", "analystin", "wissenschaftler", "wissenschaftlerin", "forscher",
            "forscherin", "berater", "beraterin", "spezialist", "spezialistin",
            "manager", "managerin", "direktor", "direktorin", "koordinator",
            "koordinatorin", "administrator", "administratorin", "geschäftsführer",
            "geschaftsfuhrer", "gründer", "grunder", "buchhalter", "buchhalterin",
            "tester", "testerin",
        }),
        "domain_tokens": frozenset({
            "backend", "frontend", "cloud", "daten", "mobil", "eingebettet",
            "plattform", "infrastruktur", "sicherheit", "produkt", "software",
            "web", "systeme",
        }),
        "role_phrase_anchors": frozenset({
            "softwareingenieur", "softwareentwickler", "produktmanager",
            "data scientist", "datenanalyst", "dateningenieur", "backend-entwickler",
            "frontend-entwickler", "devops-ingenieur", "lösungsarchitekt",
            "losungsarchitekt", "projektmanager", "technischer leiter",
        }),
        "company_suffix_pattern_str": (
            r"\b(gmbh|ag|kg|ohg|e\.?v\.?|gruppe|bank|technologies|solutions"
            r"|beratung|studio|agentur|systeme|dienstleistungen|universität"
            r"|universitat|institut|stiftung)\b"
        ),
        "self_employed_tokens": frozenset({
            "selbstständig", "selbststandig", "freiberuflich", "freelance",
            "vertrag", "ehrenamtlich",
        }),
        "academic_filter_tokens": frozenset({
            "bootcamp", "abschluss", "universität", "universitat", "bachelor",
            "master", "promotion", "diplom", "kurs", "zertifizierung", "absolvent",
            "absolventin", "student", "studentin", "alumni",
        }),
        "description_starters": frozenset({
            "entwickelte", "entwickelt", "gestaltete", "gestaltet", "leitete",
            "geleitet", "verwaltete", "verwaltet", "implementierte", "implementiert",
            "erstellte", "erstellt", "arbeitete", "gearbeitet", "zusammengearbeitet",
            "gewartet", "verbessert", "reduziert", "erhöht", "erhoht", "migriert",
            "integriert", "automatisiert", "geliefert", "bereitgestellt",
            "etabliert", "durchgeführt", "durchgefuhrt", "geschrieben", "gestartet",
            "beigetragen", "behoben", "beaufsichtigt", "gelöst", "gelost",
            "optimiert", "überarbeitet", "uberarbeitet", "betreut", "überprüft", "uberpruft",
        }),
        "skill_label_prefixes": {
            "sprachen", "programmiersprachen", "sonstiges", "werkzeuge", "frameworks",
            "bibliotheken", "architektur", "design", "frontend", "backend",
            "datenbanken", "web", "mobil", "cloud", "plattformen", "container",
            "sicherheit", "testen", "versionskontrolle",
        },
        "cert_qualifier_keywords": frozenset({
            "zertifiziert", "zertifikat", "zertifizierung", "professionell",
            "assoziiert", "spezialist", "spezialistin", "experte", "expertin",
        }),
    },

    "pt": {
        "section_aliases": {
            "contato": "contact",
            "contacto": "contact",
            "dados pessoais": "contact",
            "informações de contato": "contact",
            "informacoes de contato": "contact",
            "resumo": "summary",
            "perfil": "summary",
            "perfil profissional": "summary",
            "sobre mim": "summary",
            "objetivo": "summary",
            "objetivo profissional": "summary",
            "apresentação": "summary",
            "apresentacao": "summary",
            "habilidades": "skills",
            "competências": "skills",
            "competencias": "skills",
            "habilidades técnicas": "skills",
            "habilidades tecnicas": "skills",
            "tecnologias": "skills",
            "educação": "education",
            "educacao": "education",
            "formação acadêmica": "education",
            "formacao academica": "education",
            "formação": "education",
            "formacao": "education",
            "qualificações": "education",
            "qualificacoes": "education",
            "experiência": "experience",
            "experiencia": "experience",
            "experiência profissional": "experience",
            "experiencia profissional": "experience",
            "histórico profissional": "experience",
            "historico profissional": "experience",
            "trajetória profissional": "experience",
            "trajetoria profissional": "experience",
            "trabalho": "experience",
            "emprego": "experience",
            "estágio": "experience",
            "estagio": "experience",
            "estágios": "experience",
            "estagios": "experience",
            "projetos": "projects",
            "projetos pessoais": "projects",
            "projetos selecionados": "projects",
            "certificações": "certifications",
            "certificacoes": "certifications",
            "certificados": "certifications",
            "cursos": "certifications",
            "licenças": "certifications",
            "licencas": "certifications",
            "idiomas": "other",
            "conquistas": "other",
            "prêmios": "other",
            "premios": "other",
            "publicações": "other",
            "publicacoes": "other",
            "referências": "other",
            "referencias": "other",
            "interesses": "other",
            "voluntariado": "other",
        },
        "degree_patterns": [
            ("olevel",   r"\b(ensino médio|ensino medio|ensino secundário|ensino secundario|escola secundária|escola secundaria)\b"),
            ("bachelor", r"\b(bacharelado|licenciatura|graduação|graduacao|técnico|tecnico|superior)\b"),
            ("master",   r"\b(mestrado|mestre|pós-graduação|pos-graduacao|especialização|especializacao|mba)\b"),
            ("phd",      r"\b(doutorado|doutor|phd)\b"),
        ],
        "months": r"(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-zç]*",
        "present_words": {"presente", "atual", "atualmente", "em andamento", "agora"},
        "role_at_company_word": "na",
        "role_company_separator": r"\s+[—–|·]\s+",
        "level_tokens": frozenset({
            "júnior", "junior", "sênior", "senior", "líder", "lider", "principal",
            "chefe", "associado", "associada", "estagiário", "estagiaria",
        }),
        "noun_tokens": frozenset({
            "engenheiro", "engenheira", "desenvolvedor", "desenvolvedora",
            "programador", "programadora", "arquiteto", "arquiteta", "designer",
            "analista", "cientista", "pesquisador", "pesquisadora", "consultor",
            "consultora", "especialista", "gerente", "diretor", "diretora",
            "coordenador", "coordenadora", "administrador", "administradora",
            "executivo", "executiva", "presidente", "fundador", "fundadora",
            "contador", "contadora", "testador", "testadora",
        }),
        "domain_tokens": frozenset({
            "backend", "frontend", "fullstack", "nuvem", "dados", "móvel", "movel",
            "embarcado", "plataforma", "infraestrutura", "segurança", "seguranca",
            "produto", "software", "web", "sistemas",
        }),
        "role_phrase_anchors": frozenset({
            "engenheiro de software", "engenheira de software",
            "desenvolvedor de software", "gerente de produto",
            "cientista de dados", "analista de dados", "engenheiro de dados",
            "engenheiro backend", "engenheiro frontend", "engenheiro devops",
            "arquiteto de soluções", "arquiteto de solucoes", "gerente de projeto",
            "líder técnico", "lider tecnico",
        }),
        "company_suffix_pattern_str": (
            r"\b(ltda|s\.?a\.?|grupo|banco|tecnologias|soluções|solucoes"
            r"|consultoria|estúdio|estudio|agência|agencia|sistemas|serviços"
            r"|servicos|universidade|instituto|fundação|fundacao)\b"
        ),
        "self_employed_tokens": frozenset({
            "autônomo", "autonomo", "independente", "freelance", "contrato",
            "voluntário", "voluntario",
        }),
        "academic_filter_tokens": frozenset({
            "bootcamp", "graduação", "graduacao", "universidade", "bacharelado",
            "mestrado", "doutorado", "diploma", "curso", "certificação",
            "certificacao", "graduado", "graduada", "estudante", "ex-aluno", "ex-aluna",
        }),
        "description_starters": frozenset({
            "construí", "construi", "projetei", "desenvolvi", "liderei", "gerenciei",
            "implementei", "criei", "colaborei", "mantive", "melhorei", "reduzi",
            "aumentei", "migrei", "integrei", "automatizei", "entreguei", "implantei",
            "estabeleci", "realizei", "escrevi", "lancei", "contribuí", "contribui",
            "resolvi", "otimizei", "refatorei", "revisei",
        }),
        "skill_label_prefixes": {
            "idiomas", "linguagens de programação", "linguagens de programacao",
            "outros", "ferramentas", "frameworks", "bibliotecas", "arquitetura",
            "design", "frontend", "backend", "bancos de dados", "web", "móvel",
            "movel", "nuvem", "plataformas", "contêineres", "conteineres",
            "segurança", "seguranca", "testes", "controle de versão",
            "controle de versao",
        },
        "cert_qualifier_keywords": frozenset({
            "certificado", "certificada", "certificação", "certificacao",
            "profissional", "associado", "associada", "especialista", "especialista",
        }),
    },
}


def get_lang_config(lang: str) -> dict:
    """Returns the vocab dict for `lang`, falling back to English for any
    unsupported language or any key missing from a partial translation."""
    base = LANG_CONFIGS["en"]
    override = LANG_CONFIGS.get(lang, {})
    return {**base, **override}


# ─────────────────────────────────────────────────────────────────────────────
# Backward-compatible module-level English defaults — kept so any code that
# hasn't been threaded with a `lang` parameter yet still works unchanged.
# ─────────────────────────────────────────────────────────────────────────────
_EN = LANG_CONFIGS["en"]
SECTION_ALIASES: dict[str, str] = _EN["section_aliases"]
DEGREE_PATTERNS: list[tuple[str, str]] = _EN["degree_patterns"]
LEVEL_TOKENS: frozenset[str] = _EN["level_tokens"]
NOUN_TOKENS: frozenset[str] = _EN["noun_tokens"]
DOMAIN_TOKENS: frozenset[str] = _EN["domain_tokens"]
ROLE_PHRASE_ANCHORS: frozenset[str] = _EN["role_phrase_anchors"]
COMPANY_SUFFIX_PATTERN_STR: str = _EN["company_suffix_pattern_str"]
SELF_EMPLOYED_TOKENS: frozenset[str] = _EN["self_employed_tokens"]
EXPERIENCE_ACADEMIC_FILTER_TOKENS: frozenset[str] = _EN["academic_filter_tokens"]
EXPERIENCE_DESCRIPTION_STARTERS: frozenset[str] = _EN["description_starters"]
