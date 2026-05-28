# AI Resume Screener — Backend

Express + MongoDB backend that wraps the AI resume parsing and candidate matching service.

## Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your MongoDB URI and AI service URL
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `MONGODB_URI` | `mongodb://localhost:27017/ai-resume-screener` | MongoDB connection string |
| `AI_SERVICE_URL` | `http://localhost:8000` | Base URL of the AI service |
| `AI_SERVICE_TIMEOUT_MS` | `30000` | Timeout for AI service calls in milliseconds |
| `MAX_FILE_SIZE_BYTES` | `5242880` | Maximum resume upload size in bytes |
| `JWT_SECRET` | development fallback | Secret used to sign auth tokens |

## API Endpoints

### Resumes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/resumes` | Upload a resume (multipart, field name: `file`) |
| `GET` | `/api/resumes/:resumeId` | Get resume metadata and parse status |

**Upload example:**
```bash
curl -X POST http://localhost:3000/api/resumes \
  -F "file=@resume.pdf"
```

**Response:**
```json
{
  "success": true,
  "resumeId": "...",
  "candidateProfileId": "...",
  "parseStatus": "done"
}
```

### Candidate Profiles

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/candidate-profiles/:profileId` | Get a parsed candidate profile |

### Jobs

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/jobs` | Create a job requirement |
| `POST` | `/api/jobs/:jobId/match` | Run AI matching for a job |
| `GET` | `/api/jobs/:jobId/matches` | Get ranked match results |

**Create job example:**
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Backend Engineer",
    "description": "We are looking for...",
    "requiredSkills": ["node.js", "mongodb"],
    "preferredSkills": ["redis"],
    "experienceYears": 3,
    "educationLevel": "bachelor"
  }'
```

**Run match example:**
```bash
curl -X POST http://localhost:3000/api/jobs/<jobId>/match
```

**Get matches (shortlisted only):**
```bash
curl http://localhost:3000/api/jobs/<jobId>/matches?shortlisted=true
```

## Project Structure

```
src/
├── index.js                    # App entry point
├── controllers/
│   ├── resumeController.js     # Upload + get resume
│   ├── candidateController.js  # Get candidate profile
│   └── jobController.js        # Create job, run match, get matches
├── mappers/
│   └── aiPayloadMapper.js      # All field transforms between backend ↔ AI
├── middlewares/
│   ├── upload.js               # Multer config (PDF/DOCX, configurable size limit)
│   └── errorHandler.js         # Global error handler
├── models/
│   ├── Resume.js
│   ├── CandidateProfile.js
│   ├── JobRequirement.js
│   └── MatchResult.js
├── routes/
│   ├── resumeRoutes.js
│   ├── candidateRoutes.js
│   └── jobRoutes.js
└── services/
    ├── aiClient.js             # HTTP client for AI service calls
    └── matchService.js         # Matching orchestration logic
```

## Key Design Decisions

- **Scores stored as 0–100**: AI returns 0–1 floats; the mapper multiplies by 100 before persisting.
- **Education levels**: Both sides use the same lowercase literals (`olevel`, `bachelor`, `master`, `phd`). `any` on the backend becomes `null` for the AI.
- **raw_text forwarding**: Every match request includes `raw_text` from `Resume.parsedText` for richer AI embeddings.
- **Upsert on `{jobId, candidateId}`**: Re-running a match updates existing results rather than duplicating rows.
- **One adapter module**: All field renames live in `mappers/aiPayloadMapper.js`. Controllers never transform AI fields directly.
