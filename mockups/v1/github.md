repo: SodiqAbdulwaris/HireSignal
branch: main

## Last sync
date: 2026-08-19T12:26:08Z

### Updated in this project
- Built 14 UI mockups mirroring HireSignal's real screens/flows (candidate + recruiter + auth/settings), restyled in the Industry design system
- Grounded copy, fields, and data model (job requirements, match score breakdown, application statuses) in the actual React source
- Added a Pipeline (kanban) and Analytics screen beyond the current app as extensions of the same flows

## Screen map
| Project screen | Repo source |
|---|---|
| Login / Create account | frontend/src/pages/AuthPage.jsx |
| Browse jobs + job detail/apply modal | frontend/src/components/candidate/CandidateBrowse.jsx, JobCard.jsx, JobDetailModal.jsx, ApplyModal.jsx |
| My applications | frontend/src/components/candidate/CandidateApplications.jsx |
| Candidate profile | frontend/src/components/candidate/CandidateProfile.jsx |
| Resume upload | frontend/src/components/candidate/ResumeUpload.jsx |
| Recruiter dashboard | frontend/src/pages/RecruiterDashboard.jsx |
| My jobs / post a job | frontend/src/components/recruiter/RecruiterJobs.jsx, PostJobView.jsx |
| Candidate matches for a job | frontend/src/components/recruiter/MatchView.jsx |
| Candidate detail + AI report | frontend/src/components/recruiter/MatchResultCard.jsx |
| Nav / role badge | frontend/src/components/layout/Nav.jsx |
| Settings/integrations | new screen, not in repo yet |
| Pipeline, Analytics | new screens, not in repo yet |
