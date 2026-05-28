# Graph Report - AI-Resume-Screener  (2026-05-28)

## Corpus Check
- 74 files · ~59,328 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 475 nodes · 821 edges · 47 communities (38 shown, 9 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 99 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b4e0e9dd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
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
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]

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
- `ParsedCandidate` --uses--> `AppException`  [INFERRED]
  ai-service/app/services/parse_service.py → ai-service/app/core/exceptions.py
- `str` --uses--> `AppException`  [INFERRED]
  ai-service/app/services/parse_service.py → ai-service/app/core/exceptions.py

## Communities (47 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (34): Request, Exception, Request, float, ndarray, Request, str, float (+26 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (20): float, str, UploadFile, str, UploadFile, str, bytes, AppException (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (24): author, bugs, url, dependencies, mongodb, description, devDependencies, concurrently (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.26
Nodes (24): bool, float, int, str, best(), block_has_date(), calculate_years_of_experience(), classify_line() (+16 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (34): EmbeddingService, ParsedCandidate, str, CandidateInput, ParsedCandidate, str, ParsedCandidate, str (+26 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (20): dependencies, axios, bcryptjs, dotenv, express, form-data, jsonwebtoken, mongoose (+12 more)

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

### Community 13 - "Community 13"
Cohesion: 0.16
Nodes (13): createJob(), getJobMatches(), JobRequirement, MatchResult, runJobMatch(), { runMatch }, jobRequirementSchema, mongoose (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.42
Nodes (11): bool, int, str, extract_best_name(), extract_location(), extract_name_candidate(), is_location(), looks_like_headline() (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.27
Nodes (11): str, _dedupe_preserve_order(), normalize_all_fields(), _normalize_project_name(), _normalize_string_list(), Strip and return the project name as-is.     We do not call .title() — it destr, Normalise and clean all parsed resume fields in place.      By the time this r, Remove duplicates from a list while preserving original order.     Case-insensi (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.20
Nodes (12): AI_TO_BACKEND_EDUCATION, aiRankedCandidateToMatchResult(), BACKEND_TO_AI_EDUCATION, backendEducationToAi(), candidateToAiInput(), jobToAiInput(), normalizeSkills(), aiClient (+4 more)

### Community 17 - "Community 17"
Cohesion: 0.47
Nodes (9): bool, str, alias_match(), classify_line(), clean(), infer_sections(), inject_markers(), is_body() (+1 more)

### Community 18 - "Community 18"
Cohesion: 0.24
Nodes (5): matchResultSchema, mongoose, scoreBreakdownSchema, mongoose, resumeSchema

### Community 19 - "Community 19"
Cohesion: 0.16
Nodes (13): aiClient, CandidateProfile, getResume(), { parsedCandidateToBackend }, Resume, uploadResume(), aiEducationToBackend(), parsedCandidateToBackend() (+5 more)

### Community 20 - "Community 20"
Cohesion: 0.57
Nodes (6): bool, str, clean_cert_name(), looks_like_certification(), parse_certifications(), split_line()

### Community 21 - "Community 21"
Cohesion: 0.48
Nodes (6): bool, int, str, extract_links(), is_email_adjacent_match(), normalise()

### Community 22 - "Community 22"
Cohesion: 0.50
Nodes (3): str, get_logger(), JsonFormatter

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (3): BaseSettings, get_settings(), Settings

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (5): candidateProfileSchema, educationEntrySchema, experienceEntrySchema, mongoose, projectSchema

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (12): CandidateProfile, getProfile(), authenticate(), authorise(), config, jwt, User, { authenticate } (+4 more)

### Community 43 - "Community 43"
Cohesion: 0.05
Nodes (35): config, dotenv, envLocalPath, path, config, jwt, login(), signToken() (+27 more)

### Community 44 - "Community 44"
Cohesion: 0.32
Nodes (7): axios, buildAiError(), client, config, FormData, matchCandidates(), parseResume()

## Knowledge Gaps
- **152 isolated node(s):** `name`, `version`, `description`, `main`, `install:all` (+147 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `build_heuristic_candidate()` connect `Community 5` to `Community 4`, `Community 9`, `Community 10`, `Community 11`, `Community 14`, `Community 15`, `Community 20`?**
  _High betweenness centrality (0.161) - this node is a cross-community bridge._
- **Why does `FastAPI` connect `Community 0` to `Community 1`, `Community 5`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `parse_experience()` connect `Community 4` to `Community 5`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `EmbeddingService` (e.g. with `Exception` and `Request`) actually correct?**
  _`EmbeddingService` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `build_heuristic_candidate()` (e.g. with `parse_certifications()` and `parse_contact()`) actually correct?**
  _`build_heuristic_candidate()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `ParsedCandidate` (e.g. with `EmbeddingService` and `UploadFile`) actually correct?**
  _`ParsedCandidate` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `AppException` (e.g. with `Request` and `ParsedCandidate`) actually correct?**
  _`AppException` has 6 INFERRED edges - model-reasoned connections that need verification._