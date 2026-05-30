# HireSignal

HireSignal is an AI resume screener for a school project. It gives candidates a place to create an account, upload a PDF or DOCX resume, generate a structured candidate profile, browse jobs, and submit applications. It gives recruiters a dashboard for creating job requirements, viewing jobs, and running AI matching against candidates who have applied to a job.

The system is split into three services. The React/Vite frontend handles authentication, candidate workflows, recruiter workflows, and match visualisation. The Express backend owns users, resumes, candidate profiles, jobs, applications, and persisted match results in MongoDB. The FastAPI AI service owns resume text extraction, section-based parsing, embedding generation, and weighted candidate ranking.

The implementation is intentionally service-oriented: the backend orchestrates business flows and persistence, while the AI service exposes narrow parse and match endpoints. Candidates and recruiters use the same authentication system, but role guards decide which workflows each user can access.

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18.2.0, Vite 5.0.0 | Single-page UI for authentication, candidate dashboards, recruiter dashboards, resume upload, job posting, applications, and match result views. |
| Backend | Node.js, Express 4.18.2 | REST API for auth, resumes, candidates, jobs, applications, and match orchestration. |
| AI service | Python, FastAPI 0.115.5, Uvicorn 0.32.1 | Resume parsing and candidate-to-job matching API. |
| Database | MongoDB, Mongoose 8.0.0 | Stores users, resumes, candidate profiles, job requirements, applications, and match results. |
| Embeddings | sentence-transformers 5.4.1, `all-MiniLM-L6-v2` | Generates normalised vectors for semantic job and candidate similarity. |
| Auth | JSON Web Tokens with `jsonwebtoken` 9.0.3, `bcryptjs` 3.0.3 | Password hashing, stateless bearer-token authentication, and role-based access control. |
| Validation | Mongoose schemas, Pydantic 2.13.4, ObjectId middleware | Validates database fields, AI request/response shapes, route IDs, file size, and supported upload types. |
| File handling | Multer 1.4.5-lts.1, PyMuPDF 1.27.2.3, python-docx 1.2.0 | Keeps uploaded resumes in memory, accepts PDF/DOCX files, and extracts readable text for parsing. |

## Monorepo Structure

```text
.
├── .agents/                         # Agent workflow and Graphify project instructions.
│   ├── rules/
│   │   └── graphify.md              # Graphify rule file.
│   └── workflows/
│       └── graphify.md              # Graphify workflow file.
├── .codex/
│   └── hooks.json                   # Local Codex hook configuration.
├── .qodo/
│   ├── agents/                      # Qodo agent configuration directory.
│   └── workflows/                   # Qodo workflow configuration directory.
├── ai-service/                      # FastAPI resume parsing and matching service.
│   ├── app/
│   │   ├── __init__.py              # Python package marker.
│   │   ├── main.py                  # FastAPI app, router registration, health check, model loading, and exception handlers.
│   │   ├── config/
│   │   │   ├── __init__.py          # Config package marker.
│   │   │   ├── parser_config.py     # Section aliases, degree hierarchy, parser vocabularies, and role/company scoring tokens.
│   │   │   └── settings.py          # Pydantic settings loaded from `ai-service/.env`.
│   │   ├── core/
│   │   │   ├── __init__.py          # Core package marker.
│   │   │   ├── context.py           # Request ID context variable.
│   │   │   ├── exceptions.py        # Service exception classes and error codes.
│   │   │   ├── logger.py            # JSON logger with request ID support.
│   │   │   └── middleware.py        # Request logging middleware.
│   │   ├── embedding-models/        # Local sentence-transformer model cache; ignored by git.
│   │   │   └── all-MiniLM-L6-v2/    # Cached embedding model files.
│   │   ├── parsers/
│   │   │   ├── __init__.py          # Parser package marker.
│   │   │   ├── certification_parser.py # Certification and issuer extraction.
│   │   │   ├── contact_parser.py    # Name, email, phone, and location parsing.
│   │   │   ├── education_parser.py  # Education block parsing and degree-level detection.
│   │   │   ├── experience_parser.py # Experience block parsing, semantic role/company splitting, and years calculation.
│   │   │   ├── links_parser.py      # URL, LinkedIn, GitHub, and domain extraction helper.
│   │   │   ├── project_parser.py    # Project title and technology extraction.
│   │   │   └── skills_parser.py     # Skills section tokenisation, category handling, and normalisation.
│   │   ├── routers/
│   │   │   ├── __init__.py          # Router package marker.
│   │   │   ├── match.py             # `POST /match/` endpoint.
│   │   │   └── parse.py             # `POST /parse/` endpoint.
│   │   ├── schemas/
│   │   │   ├── __init__.py          # Schema package marker.
│   │   │   ├── common.py            # Shared education-level literal.
│   │   │   ├── match.py             # Match request, response, ranked candidate, and score schemas.
│   │   │   ├── orchestration.py     # Parsed-candidate orchestration request schema.
│   │   │   └── resume.py            # Parsed resume and nested resume-field schemas.
│   │   ├── services/
│   │   │   ├── __init__.py          # Service package marker.
│   │   │   ├── ai_parse_service.py  # Optional external AI parser fallback.
│   │   │   ├── embedding_service.py # SentenceTransformer loading, caching, embedding, and cosine similarity.
│   │   │   ├── explanation_service.py # Human-readable match reasons and summaries.
│   │   │   ├── matching_service.py  # Weighted candidate scoring and ranking.
│   │   │   ├── normalization_service.py # ParsedCandidate-to-CandidateInput mapper.
│   │   │   ├── parse_service.py     # Resume extraction, heuristic parsing, fallback decision, and response assembly.
│   │   │   └── parser_service.py    # Re-export wrapper for parse service functions.
│   │   ├── tests/                   # AI parser and matching tests; ignored by git.
│   │   │   ├── fixtures/            # Resume fixtures and extracted/preprocessed text.
│   │   │   └── test_*.py            # Parser, matching, extraction, and preprocessing tests.
│   │   └── utils/
│   │       ├── __init__.py          # Utility package marker.
│   │       ├── extractor.py         # PDF/DOCX byte extraction and text cleaning.
│   │       ├── normalization.py     # Field cleaning, deduplication, and education-level validation.
│   │       ├── pre_processor.py     # Resume line cleaning and section marker injection.
│   │       ├── resume_text_builder.py # Candidate text fallback for matching embeddings.
│   │       ├── section_splitter.py  # Converts marked text into section buckets.
│   │       └── timing.py            # Timing logger context manager.
│   └── requirements.txt             # Python dependency lock-style list.
├── backend/                         # Express API and MongoDB persistence service.
│   ├── .env.local                   # Backend runtime environment variables.
│   ├── README.md                    # Older backend-specific notes; contains stale route examples.
│   ├── package-lock.json            # Backend npm lock file.
│   ├── package.json                 # Backend scripts and dependencies.
│   ├── playground-1.mongodb.js      # MongoDB VS Code playground sample.
│   ├── verify_backend.js            # Older integration verification script; references stale routes.
│   └── src/
│       ├── index.js                 # Express app, CORS, routes, health check, error middleware, and MongoDB connection.
│       ├── config/
│       │   └── env.js               # Loads `backend/.env.local` and parses numeric config.
│       ├── controllers/
│       │   ├── application.controller.js # Candidate application creation and candidate application listing.
│       │   ├── auth.controller.js   # Register, login, logout, password verification, and JWT signing.
│       │   ├── candidate.controller.js # Current candidate profile retrieval.
│       │   ├── job.controller.js    # Job CRUD reads, applications, match triggering, and match result listing.
│       │   └── resume.controller.js # Resume upload, AI parse call, candidate profile upsert, and resume metadata retrieval.
│       ├── mappers/
│       │   └── ai.payload.mapper.js # Backend-to-AI and AI-to-backend payload transformations.
│       ├── middlewares/
│       │   ├── auth.middleware.js   # JWT authentication and role authorisation.
│       │   ├── error.middleware.js  # Multer, AI, validation, timeout, and generic error responses.
│       │   ├── upload.middleware.js # In-memory PDF/DOCX upload handling with size limit.
│       │   └── validateObjectId.middleware.js # Route param ObjectId validation.
│       ├── models/
│       │   ├── Application.js       # Candidate-job application model with unique candidate/job index.
│       │   ├── CandidateProfile.js  # Parsed candidate profile model.
│       │   ├── JobRequirement.js    # Recruiter-created job requirement model.
│       │   ├── MatchResult.js       # Persisted ranked match result model.
│       │   ├── RecruiterProfile.js  # Recruiter profile model; currently not wired to routes.
│       │   ├── Resume.js            # Uploaded resume metadata, active flag, parse status, and raw text.
│       │   └── User.js              # User auth model with password hashing.
│       ├── routes/
│       │   ├── application.routes.js # `/api/v1/applications` routes.
│       │   ├── auth.routes.js       # `/api/v1/auth` routes.
│       │   ├── candidate.routes.js  # `/api/v1/candidates` routes.
│       │   ├── job.routes.js        # `/api/v1/jobs` routes.
│       │   └── resume.routes.js     # `/api/v1/resumes` routes.
│       └── services/
│           ├── ai.client.js         # Axios client for AI parse and match endpoints.
│           └── match.service.js     # Backend match orchestration for applicants and active resumes.
├── docs/
│   ├── AI-Service-Backend-Handoff.docx # Handoff document.
│   └── ai-handoff-render/
│       ├── page-1.png               # Rendered handoff page image.
│       ├── page-2.png               # Rendered handoff page image.
│       ├── page-3.png               # Rendered handoff page image.
│       ├── page-4.png               # Rendered handoff page image.
│       ├── page-5.png               # Rendered handoff page image.
│       ├── page-6.png               # Rendered handoff page image.
│       ├── page-7.png               # Rendered handoff page image.
│       └── page-8.png               # Rendered handoff page image.
├── extras/                          # Ignored planning, prompts, helper scripts, and prototype files.
│   ├── Antigravity_prompt.md        # Prompt notes.
│   ├── API_DOCUMENTATION.md         # Extra API notes.
│   ├── build_ai_backend_handoff_doc.py # Handoff document generation helper.
│   ├── exp_parser_explanation.md    # Experience parser explanation notes.
│   ├── hiresignal-app.jsx           # Prototype React app file.
│   ├── jwt_secret_gen.py            # JWT secret helper.
│   ├── lena_becker.txt              # Sample resume text.
│   ├── LOVABLE_PROMPT.md            # Prompt notes.
│   └── tasks.md                     # Task notes.
├── frontend/                        # React/Vite single-page app.
│   ├── dist/                        # Built frontend assets.
│   │   ├── index.html               # Production build HTML.
│   │   └── assets/
│   │       ├── index-B4xSb_Zx.css   # Built CSS bundle.
│   │       └── index-Dq8eoXd6.js    # Built JS bundle.
│   ├── index.html                   # Vite HTML entry point.
│   ├── package-lock.json            # Frontend npm lock file.
│   ├── package.json                 # Frontend scripts and dependencies.
│   ├── vite.config.js               # Vite React plugin, port 5173, and `/api` proxy to backend port 5000.
│   └── src/
│       ├── App.jsx                  # Auth gate and role-based dashboard switch.
│       ├── main.jsx                 # React root mount and global CSS import.
│       ├── components/
│       │   ├── candidate/
│       │   │   ├── ApplyModal.jsx   # Candidate application confirmation modal.
│       │   │   ├── CandidateApplications.jsx # Candidate application history.
│       │   │   ├── CandidateBrowse.jsx # Job browsing and application flow.
│       │   │   ├── CandidateProfile.jsx # Parsed candidate profile display.
│       │   │   ├── JobCard.jsx      # Job summary card.
│       │   │   ├── JobDetailModal.jsx # Full job detail modal.
│       │   │   └── ResumeUpload.jsx # PDF/DOCX drag-and-drop upload UI.
│       │   ├── layout/
│       │   │   ├── Nav.jsx          # Authenticated top navigation and logout.
│       │   │   └── PageHeader.jsx   # Dashboard heading component.
│       │   ├── recruiter/
│       │   │   ├── MatchResultCard.jsx # Ranked match card with score breakdown and reasoning.
│       │   │   ├── MatchView.jsx    # Match result loading, triggering, and rendering.
│       │   │   ├── PostJobView.jsx  # Recruiter job creation form.
│       │   │   └── RecruiterJobs.jsx # Recruiter job list and match actions.
│       │   └── ui/
│       │       ├── Alert.jsx        # Error/success message.
│       │       ├── Avatar.jsx       # Initials avatar.
│       │       ├── Badge.jsx        # Status badge.
│       │       ├── Btn.jsx          # Button primitive.
│       │       ├── Divider.jsx      # Section divider.
│       │       ├── FormField.jsx    # Label/hint wrapper.
│       │       ├── Modal.jsx        # Escape/overlay dismiss modal.
│       │       ├── ScoreBar.jsx     # Match score bar and score colour helper.
│       │       ├── SkeletonBlock.jsx # Loading skeleton block.
│       │       ├── Spinner.jsx      # CSS spinner.
│       │       ├── StatCard.jsx     # Dashboard stat tile.
│       │       └── Tabs.jsx         # Dashboard tab switcher.
│       ├── constants/
│       │   └── colors.js            # Shared colour constants.
│       ├── context/
│       │   └── AuthContext.jsx      # Local-storage token/user state and session verification.
│       ├── lib/
│       │   ├── api.js               # Backend API wrapper functions.
│       │   └── utils.js             # Date formatting and initials helper.
│       ├── pages/
│       │   ├── AuthPage.jsx         # Login/register UI.
│       │   ├── CandidateDashboard.jsx # Candidate dashboard tabs and data loading.
│       │   └── RecruiterDashboard.jsx # Recruiter dashboard tabs and match view switch.
│       └── styles/
│           ├── designSystem.js      # Shared inline style primitives.
│           └── global.css           # Global CSS, fonts, form styles, and animations.
├── graphify-out/                    # Generated Graphify knowledge graph and reports.
│   ├── graph.json                   # Knowledge graph JSON.
│   ├── graph.html                   # Interactive graph visualisation.
│   ├── GRAPH_REPORT.md              # Graphify report.
│   ├── GRAPH_TREE.html              # Graph tree visualisation.
│   ├── AI-Resume-Screener-callflow.html # Generated call-flow visualisation.
│   ├── manifest.json                # Graphify manifest.
│   ├── step1.ps1                    # Graphify helper script.
│   ├── step2.ps1                    # Graphify helper script.
│   ├── step3_cache.ps1              # Graphify helper script.
│   ├── step3a_ast.ps1               # Graphify helper script.
│   └── cache/                       # Generated Graphify cache files.
├── node_modules/                    # Installed root dependencies; generated.
├── .gitignore                       # Ignores env files, dependencies, generated Python caches, tests, extras, and model cache.
├── AGENTS.md                        # Project-specific agent and Graphify instructions.
├── LICENSE                          # Project licence file.
├── package-lock.json                # Root npm lock file.
├── package.json                     # Root scripts for installing and running all services.
└── README.md                        # This project README.
```

## Getting Started

### Prerequisites

| Tool | Version Source | Requirement |
|---|---|---|
| Node.js | No `engines.node` field is declared in any `package.json`. | Install a Node.js version compatible with Vite 5 and the listed npm packages. |
| npm | Lock files are present for root, backend, and frontend packages. | Required for installing and running the JavaScript services. |
| Python | No Python version is declared in `requirements.txt` or a project config file. | Install a Python version compatible with the pinned requirements. The local bytecode cache in this workspace was generated with CPython 3.14, but that is not a declared requirement. |
| pip | `ai-service/requirements.txt` is used directly. | Required for installing FastAPI, sentence-transformers, PyMuPDF, python-docx, and related AI-service dependencies. |
| MongoDB | `MONGODB_URI=mongodb://localhost:27017/ai-resume-screener` in `backend/.env.local`. | Run a local MongoDB server or provide a MongoDB connection string. |

### Environment Variables

The backend reads `backend/.env.local` through `backend/src/config/env.js`. The AI service reads `ai-service/.env` through `app/config/settings.py`. There is no root `.env.local` file in the repository.

```env
# backend/.env.local
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-resume-screener
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TIMEOUT_MS=30000
JWT_SECRET=supersecuresecretkeyshouldbechangedinprod
MAX_FILE_SIZE_BYTES=5242880
```

| Variable | Service | Purpose | Example |
|---|---|---|---|
| `PORT` | Backend | Express server port. Defaults to `5000` if empty or invalid. | `5000` |
| `MONGODB_URI` | Backend | MongoDB connection string. Required by Mongoose connection code. | `mongodb://localhost:27017/ai-resume-screener` |
| `AI_SERVICE_URL` | Backend | Base URL for AI parse and match calls. Defaults to `http://localhost:8000`. | `http://localhost:8000` |
| `AI_SERVICE_TIMEOUT_MS` | Backend | Axios timeout for AI-service requests. Defaults to `30000`. | `30000` |
| `JWT_SECRET` | Backend | Secret used to sign and verify JWTs. Required for auth to work safely. | `replace-with-a-long-random-secret` |
| `MAX_FILE_SIZE_BYTES` | Backend | Multer upload size limit in bytes. Defaults to 5 MB. | `5242880` |
| `MONGO_URI` | AI service | MongoDB URI declared in settings. The current AI code does not use it directly, but Pydantic settings require it. | `mongodb://localhost:27017/ai-resume-screener` |
| `AI_SERVICE_PORT` | AI service | Port returned by AI `/health`; defaults to `8000`. | `8000` |
| `AI_SERVICE_URL` | AI service | Service URL setting; defaults to `http://localhost:8000`. | `http://localhost:8000` |
| `MAX_FILE_SIZE_MB` | AI service | Upload size limit for `POST /parse/`; defaults to `5`. | `5` |
| `EMBEDDING_MODEL` | AI service | SentenceTransformer model name; defaults to `all-MiniLM-L6-v2`. | `all-MiniLM-L6-v2` |
| `MODEL_CACHE_DIR` | AI service | Local embedding model cache directory; defaults to `app/embedding-models`. | `app/embedding-models` |
| `HF_TOKEN` | AI service | Optional Hugging Face token used before model loading. | `hf_xxx` |
| `PARSER_AI_ENABLED` | AI service | Enables optional external AI parser fallback; defaults to `False`. | `false` |
| `PARSER_AI_URL` | AI service | Optional external parser endpoint called when heuristic parsing misses important fields. | `https://parser.example.com/parse` |
| `PARSER_AI_API_KEY` | AI service | Optional bearer token for the external parser endpoint. | `parser-api-key` |
| `PARSER_AI_TIMEOUT_SECONDS` | AI service | Timeout for optional parser fallback calls; defaults to `20.0`. | `20` |
| `VITE_API_BASE_URL` | Frontend | Optional frontend API base URL. If omitted, the frontend uses `http://localhost:5000/api/v1`. | `http://localhost:5000/api/v1` |

Create `ai-service/.env` with at least the required `MONGO_URI`:

```env
MONGO_URI=mongodb://localhost:27017/ai-resume-screener
AI_SERVICE_PORT=8000
AI_SERVICE_URL=http://localhost:8000
MAX_FILE_SIZE_MB=5
EMBEDDING_MODEL=all-MiniLM-L6-v2
MODEL_CACHE_DIR=app/embedding-models
PARSER_AI_ENABLED=false
```

### Installation

From a fresh clone:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
pip install -r ai-service/requirements.txt
```

If the Python environment blocks system package installation, use:

```bash
pip install -r ai-service/requirements.txt --break-system-packages
```

The root install helper combines the service installs:

```bash
npm run install:all
```

Start all services with the root command as configured:

```bash
npm run dev
```

Current limitation: the root `frontend` script runs `npm start --prefix frontend`, but `frontend/package.json` only defines `dev`, `build`, and `preview`. Until the root script is changed, start the services individually:

```bash
npm run dev --prefix backend
npm run dev --prefix frontend
python -m uvicorn main:app --reload --app-dir ai-service
```

Expected local URLs:

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend health | `http://localhost:5000/health` |
| AI health | `http://localhost:8000/health` |

## API Reference

All backend routes are mounted under `/api/v1`.

### Auth

| Method + Path | Auth Required | Request | Response Shape |
|---|---|---|---|
| `POST /auth/register` | No | JSON body: `fullName`, `email`, `password`, `role` where role is `candidate` or `recruiter`. | `201 { success: true, message: "Registered successfully", data: null }`. Does not return a token. |
| `POST /auth/login` | No | JSON body: `email`, `password`. | `200 { success: true, message: "Login successful", data: { token, user: { _id, fullName, email, role } } }`. |
| `POST /auth/logout` | No | No body. | `200 { success: true, message: "Logged out successfully. Please clear token from client storage.", data: null }`. |

### Resumes

| Method + Path | Auth Required | Request | Response Shape |
|---|---|---|---|
| `POST /resumes` | Yes, `candidate` | `multipart/form-data` with `file`. File must be PDF or DOCX and within `MAX_FILE_SIZE_BYTES`. | `201 { success: true, message, data: { resumeId, candidateProfileId, parseStatus } }`. Existing active resumes for the candidate are marked inactive before the new resume is created. |
| `GET /resumes/:resumeId` | Yes, `recruiter` | Path param `resumeId`. | `200 { success: true, message, data: resume }` or `404` if missing. There is no ownership check beyond the recruiter role guard. |

### Candidates

| Method + Path | Auth Required | Request | Response Shape |
|---|---|---|---|
| `GET /candidates/me` | Yes, `candidate` | No body. Uses `req.user._id`. | `200 { success: true, message, data: candidateProfile }` or `404` if no profile exists. |

### Jobs

| Method + Path | Auth Required | Request | Response Shape |
|---|---|---|---|
| `POST /jobs` | Yes, `recruiter` | JSON body: `title`, `description`, optional `requiredSkills`, `preferredSkills`, `requiredEducationLevel`, `requiredExperienceYears`. | `201 { success: true, message, data: job }`. Defaults education to `any`, experience to `0`, skills to empty arrays. |
| `GET /jobs` | Yes, any authenticated user | No body. | `200 { success: true, message, data: jobs }`, where jobs are all open jobs sorted newest first. |
| `GET /jobs/my-applications` | Yes, `candidate` | No body. | `200 { success: true, message, data: applications }`, populated with selected job fields. |
| `GET /jobs/:jobId` | Yes, any authenticated user | Path param `jobId`, validated as a MongoDB ObjectId. | `200 { success: true, message, data: job }` or `404` if missing. |
| `POST /jobs/:jobId/apply` | Yes, `candidate` | Path param `jobId`, validated as a MongoDB ObjectId. Candidate must have a parsed profile. | `201 { success: true, message, data: application }`. Duplicate applications are blocked by the model's unique index. |
| `POST /jobs/:jobId/match` | Yes, `recruiter` | Path param `jobId`, validated as a MongoDB ObjectId. | `200 { success: true, message, data: { matchCount, results } }`. Matches only candidates who applied to the job. |
| `GET /jobs/:jobId/matches` | Yes, `recruiter` | Path param `jobId`, optional query `shortlisted=true`. | `200 { success: true, message, data: { count, matches } }`, sorted by `totalScore` descending and populated with candidate fields. |

### Applications

These routes duplicate functionality that also exists under `/jobs`.

| Method + Path | Auth Required | Request | Response Shape |
|---|---|---|---|
| `POST /applications/jobs/:jobId/apply` | Yes, `candidate` | Path param `jobId`. This route does not run the ObjectId validation middleware. Candidate must have a profile. | `201 { success: true, message, data: application }`. |
| `GET /applications/my` | Yes, `candidate` | No body. | `200 { success: true, message, data: applications }`, populated with selected job fields. |

## AI Service

### How It Works

`POST /parse/` accepts a single uploaded resume file as `multipart/form-data`. The router reads the file to enforce the `MAX_FILE_SIZE_MB` limit, then passes the upload to `parse_resume_service`. The service extracts text from PDF files with PyMuPDF or DOCX files with python-docx, cleans the text, preprocesses it into section markers, splits those markers into canonical sections, and runs specialised parsers for contact details, skills, education, experience, projects, and certifications. The response is a `ParsedCandidate` object containing structured fields plus the cleaned `raw_text`.

If the heuristic parser misses key fields such as name, contact info, skills, experience, or education, `parse_service.py` can call an optional external AI parser through `ai_parse_service.py`. That fallback only runs when `PARSER_AI_ENABLED=true` and `PARSER_AI_URL` is configured. If the external parser fails or returns an invalid schema, the service logs the failure and returns the heuristic result.

`POST /match/` accepts a job object and a list of candidate objects. The matching service builds a job embedding from the job description or required skills, builds candidate embeddings from `raw_text` or structured candidate fields, calculates semantic similarity, evaluates skills, experience, and education, then returns ranked candidates with total scores, score breakdowns, matched skills, missing skills, reasons, and a readable summary.

### Scoring Model

| Dimension | Weight | Method |
|---|---:|---|
| Skills | 0.40 | Lowercases candidate, required, and preferred skills. Required skill coverage contributes 60%, preferred skill coverage contributes 40%, and missing required skills apply a 30% penalty before clamping to 0-1. |
| Experience | 0.30 | If required years are `0`, score is `1.0`; otherwise candidate years are divided by required years and capped at `1.0`. |
| Semantic | 0.20 | Uses normalised sentence-transformer embeddings and dot product, equivalent to cosine similarity for L2-normalised vectors. |
| Education | 0.10 | Maps education levels to ordinal ranks from `olevel` through `phd`; candidates at or above the required rank score `1.0`, lower ranks score proportionally. |

### Parser Architecture

The parser starts in `extractor.py`, where PDF and DOCX files are converted to plain text and cleaned. `pre_processor.py` removes zero-width characters, normalises Unicode, detects section headings using exact and fuzzy aliases, injects markers such as `##SECTION:skills##`, and treats text before the first strong section heading as contact content. `section_splitter.py` converts the marked text into canonical buckets: `summary`, `contact`, `skills`, `education`, `experience`, `projects`, `certifications`, and `other`.

Each parser owns one field family. Contact parsing extracts names, email addresses, phone numbers, and locations. Skills parsing handles labels, tables, wrapped lines, comma/semicolon tokenisation, stop words, skip tokens, and simple synonyms. Education parsing groups degree and institution blocks, detects years and GPA, and derives the highest canonical education level. Projects and certifications use curated vocabularies and issuer/technology signals.

The experience parser has the most complex semantic scoring. It classifies lines as dates, bullets, descriptions, role headers, company headers, or inline role/company headers. It scores role candidates using role phrases, noun tokens, seniority tokens, domain tokens, casing density, and description/date penalties. It scores company candidates using company suffixes, self-employed terms, casing density, and role-token penalties. When a line does not contain a clear separator, `semantic_split` tests possible split points and chooses the best role/company split if both sides pass minimum thresholds.

## Architecture Decisions

| Decision | Implementation | Reasoning From Code |
|---|---|---|
| Auth token storage | `AuthContext.jsx` stores `hs_token` and `hs_user` in `localStorage`, sends the token as a bearer token, and removes both on logout or failed session verification. | The backend is stateless and `logout` tells the client to clear the token. The frontend verifies a stored token by calling `GET /jobs`. |
| Register flow | `register` creates the user and returns `data: null`; the frontend switches back to the login tab after successful registration. | Registration and login are separate flows. Tokens are issued only in `login`. |
| FastAPI exposure policy | The AI service exposes only `/parse/`, `/match/`, and `/health`; backend calls are routed through `ai.client.js`. | The AI service is narrow and task-specific. Persistence and user-facing workflow ownership remain in Express. |
| Match orchestration ownership | `backend/src/services/match.service.js` loads job applications, profiles, active resumes, builds AI payloads, calls `/match/`, and upserts `MatchResult` rows. | The AI service calculates scores; the backend decides which candidates are eligible and persists rankings. |
| One active resume policy | `uploadResume` sets all existing active resumes for the candidate to `isActive: false` before creating the new active resume. | Matching fetches active resumes only, so each candidate has one resume source for `raw_text`. |
| Education normalisation | Backend maps `any` to `null` for AI input, AI uses canonical `olevel`, `bachelor`, `master`, `phd`, and backend maps AI education values back to the same lowercase literals. | Both services avoid mixing display labels with scoring values. `any` means no education requirement during matching. |
| CORS configuration | Express enables CORS for `http://localhost:5173` with credentials before route registration. | The frontend dev server runs on port 5173 and calls the backend on port 5000. The origin is hardcoded for local development. |

## Project Status

### Feature Completion

| Feature | Status |
|---|---|
| Candidate registration and login | Implemented. |
| Recruiter registration and login | Implemented. |
| JWT bearer authentication | Implemented. |
| Role-based route guards | Implemented. |
| Candidate resume upload | Implemented for PDF and DOCX. |
| One active resume per candidate | Implemented. |
| Resume parsing into candidate profile | Implemented. |
| Candidate profile retrieval | Implemented. |
| Candidate job browsing | Implemented. |
| Candidate application submission | Implemented. |
| Candidate application history | Implemented. |
| Recruiter job creation | Implemented. |
| Recruiter job listing | Partially implemented: the route returns all open jobs, not jobs scoped to the recruiter. |
| Match triggering | Implemented for recruiters. |
| Match persistence | Implemented with upsert per job/candidate profile. |
| Match result display | Implemented. |
| Shortlisting | Data field exists on `MatchResult`, and `GET /jobs/:jobId/matches?shortlisted=true` filters it, but no route updates `shortlisted`. |
| Recruiter profile | Model exists, but no route or frontend flow uses it. |
| Swagger documentation | Dependencies and comments exist, but `src/index.js` does not mount Swagger UI. |
| Backend automated tests | No current backend test script is defined. `verify_backend.js` references stale routes and response shapes. |
| AI parser tests | Test files and fixtures exist under `ai-service/app/tests`, but the directory is ignored by git. |

### Known Limitations / Ceilings

| Limitation | Evidence |
|---|---|
| Root `npm run dev` is currently broken for the frontend. | Root `package.json` runs `npm start --prefix frontend`, but `frontend/package.json` has no `start` script. |
| Candidate dashboard tries to fetch resume metadata but the backend only allows recruiters to read resumes. | `CandidateDashboard.jsx` calls `getResume`; `resume.routes.js` guards `GET /:resumeId` with `authorise('recruiter')`. |
| Recruiter dashboard label says "My Jobs", but the backend returns all open jobs. | `RecruiterDashboard.jsx` calls `getJobs`; `getAllJobs` filters only `{ isOpen: true }`. |
| Resume ownership is not checked on `GET /resumes/:resumeId`. | Controller calls `Resume.findById(req.params.resumeId)` and only the route role guard is applied. |
| Application endpoints are duplicated. | `job.routes.js` and `application.routes.js` both expose apply/history flows. |
| Duplicate application errors are not converted into a friendly response. | The unique `{ candidate, job }` index exists, but the global error handler does not handle Mongo duplicate-key errors specially. |
| AI service requires `MONGO_URI` even though current AI code does not use MongoDB directly. | `Settings` declares `MONGO_URI: str` with no default. |
| Scanned/image-only PDFs are not OCRed. | `extract_pdf_text` logs that OCR fallback is needed and leaves a comment for later. |
| Parser confidence depends on section detection and known vocabularies. | Parsers use aliases, regexes, fuzzy heading matching, curated skill/project/certification vocabularies, and role/company scoring tokens. |
| Experience is capped at 30 years. | `parse_experience` and normalisation cap total years at `30.0`. |
| Matching only considers applicants for a job. | `runMatch` loads `Application.find({ job: job._id })`; candidates who have not applied are excluded. |
| Shortlist state cannot currently be changed through the API. | `MatchResult.shortlisted` exists and match listing can filter it, but no update route exists. |
| Frontend has no client-side route library. | `App.jsx` switches views by auth state and role; dashboards use local tab state. |

## Team

| Person | Role | Owns |
|---|---|---|
| S.A | AI service | Python/FastAPI resume parsing, parser architecture, embeddings, and matching logic. |
| Teammate | Backend | Node.js/Express API, MongoDB models, authentication, applications, jobs, resume persistence, and AI orchestration. |
| Frontend | React/Vite | Candidate and recruiter interfaces, authentication state, dashboards, upload flow, job flow, and match result views. |
