# Graph Report - AI-Resume-Screener  (2026-05-27)

## Corpus Check
- 76 files · ~57,297 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 461 nodes · 800 edges · 43 communities (37 shown, 6 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 99 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0b0df53b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]

## God Nodes (most connected - your core abstractions)
1. `EmbeddingService` - 20 edges
2. `str` - 19 edges
3. `build_heuristic_candidate()` - 17 edges
4. `ParsedCandidate` - 15 edges
5. `AppException` - 14 edges
6. `str` - 13 edges
7. `str` - 13 edges
8. `ResumeParsingError` - 12 edges
9. `parse_block()` - 12 edges
10. `str` - 12 edges

## Surprising Connections (you probably didn't know these)
- `FastAPI` --uses--> `AppException`  [INFERRED]
  ai-service/app/main.py → ai-service/app/core/exceptions.py
- `Request` --uses--> `AppException`  [INFERRED]
  ai-service/app/main.py → ai-service/app/core/exceptions.py
- `AppException` --uses--> `AppException`  [INFERRED]
  ai-service/app/main.py → ai-service/app/core/exceptions.py
- `build_heuristic_candidate()` --calls--> `parse_certifications()`  [INFERRED]
  ai-service/app/services/parse_service.py → ai-service/app/parsers/certification_parser.py
- `build_heuristic_candidate()` --calls--> `parse_contact()`  [INFERRED]
  ai-service/app/services/parse_service.py → ai-service/app/parsers/contact_parser.py

## Communities (43 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (34): Request, Exception, Request, float, ndarray, Request, str, float (+26 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (34): float, str, UploadFile, ParsedCandidate, str, UploadFile, str, UploadFile (+26 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (29): app, connectDB, env, express, env, mongoose, envSchema, parsed (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (24): author, bugs, url, dependencies, mongodb, description, devDependencies, concurrently (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.26
Nodes (24): bool, float, int, str, best(), block_has_date(), calculate_years_of_experience(), classify_line() (+16 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (20): EmbeddingService, ParsedCandidate, str, CandidateInput, ParsedCandidate, str, BaseModel, EvaluateParsedRequest (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (17): CandidateProfile, getProfile(), candidateProfileSchema, educationEntrySchema, experienceEntrySchema, mongoose, projectSchema, express (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (16): dependencies, axios, dotenv, express, form-data, mongoose, multer, description (+8 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (16): AI Resume Screener — Backend, API Endpoints, Candidate Profiles, code:bash (npm install), code:bash (curl -X POST http://localhost:3000/api/resumes \), code:json ({), code:bash (curl -X POST http://localhost:3000/api/jobs \), code:bash (curl -X POST http://localhost:3000/api/jobs/<jobId>/match) (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.37
Nodes (16): bool, int, str, clean_institution_name(), contains_open_ended_marker(), degree_level(), degree_rank(), edu_years() (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.38
Nodes (15): bool, str, classify(), clean_line(), clean_title(), extract_inline_stack(), extract_title(), is_project_heading() (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.41
Nodes (14): bool, str, is_labeled_line(), is_table_row(), merge_wrapped_lines(), normalize_label(), normalize_skill_token(), parse_skills() (+6 more)

### Community 12 - "Community 12"
Cohesion: 0.19
Nodes (11): aiClient, CandidateProfile, getResume(), { parsedCandidateToBackend }, uploadResume(), aiEducationToBackend(), parsedCandidateToBackend(), express (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.23
Nodes (10): createJob(), getJobMatches(), JobRequirement, MatchResult, runJobMatch(), { runMatch }, { createJob, runJobMatch, getJobMatches }, express (+2 more)

### Community 14 - "Community 14"
Cohesion: 0.42
Nodes (11): bool, int, str, extract_best_name(), extract_location(), extract_name_candidate(), is_location(), looks_like_headline() (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.27
Nodes (11): str, _dedupe_preserve_order(), normalize_all_fields(), _normalize_project_name(), _normalize_string_list(), Strip and return the project name as-is.     We do not call .title() — it destr, Normalise and clean all parsed resume fields in place.      By the time this r, Remove duplicates from a list while preserving original order.     Case-insensi (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.20
Nodes (7): matchResultSchema, mongoose, resumeSchema, aiClient, CandidateProfile, { jobToAiInput, candidateToAiInput, aiRankedCandidateToMatchResult }, MatchResult

### Community 17 - "Community 17"
Cohesion: 0.47
Nodes (9): bool, str, alias_match(), classify_line(), clean(), infer_sections(), inject_markers(), is_body() (+1 more)

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (7): AI_TO_BACKEND_EDUCATION, aiRankedCandidateToMatchResult(), BACKEND_TO_AI_EDUCATION, backendEducationToAi(), candidateToAiInput(), jobToAiInput(), normalizeSkills()

### Community 19 - "Community 19"
Cohesion: 0.32
Nodes (7): axios, buildAiError(), client, FormData, matchCandidates(), parseResume(), TIMEOUT

### Community 20 - "Community 20"
Cohesion: 0.57
Nodes (6): bool, str, clean_cert_name(), looks_like_certification(), parse_certifications(), split_line()

### Community 21 - "Community 21"
Cohesion: 0.48
Nodes (6): bool, int, str, extract_links(), is_email_adjacent_match(), normalise()

### Community 22 - "Community 22"
Cohesion: 0.50
Nodes (3): str, get_logger(), JsonFormatter

### Community 23 - "Community 23"
Cohesion: 0.40
Nodes (4): ALLOWED_MIME_TYPES, multer, storage, upload

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (3): BaseSettings, get_settings(), Settings

## Knowledge Gaps
- **139 isolated node(s):** `name`, `version`, `description`, `main`, `install:all` (+134 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `build_heuristic_candidate()` connect `Community 1` to `Community 4`, `Community 9`, `Community 10`, `Community 11`, `Community 14`, `Community 15`, `Community 20`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **Why does `FastAPI` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `parse_experience()` connect `Community 4` to `Community 1`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `EmbeddingService` (e.g. with `Exception` and `Request`) actually correct?**
  _`EmbeddingService` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `build_heuristic_candidate()` (e.g. with `parse_certifications()` and `parse_contact()`) actually correct?**
  _`build_heuristic_candidate()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `ParsedCandidate` (e.g. with `EmbeddingService` and `UploadFile`) actually correct?**
  _`ParsedCandidate` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `AppException` (e.g. with `Request` and `ParsedCandidate`) actually correct?**
  _`AppException` has 6 INFERRED edges - model-reasoned connections that need verification._