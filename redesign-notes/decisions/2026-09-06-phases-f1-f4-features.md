# Phases F1-F4 — new-feature build (2026-09-06)

**Status:** ✅ All four done and verified live against a real backend + MongoDB.

Picks up the new-features track from the original redesign plan
(`C:\Users\sodiq\.claude\plans\would-it-be-advisable-refactored-raven.md`)
after R1-R5 (the visual redesign) finished. Scope was already trimmed
by an earlier `ponytail` necessity pass — see that plan file's own
"Ponytail pass" section for the reasoning on what got cut (Settings,
sourced candidates) versus kept (this list).

## F1 — Resume library

**Backend:** `Resume.isActive` renamed to `isDefault` (same DB-level
partial unique index, same meaning — "the one used for matching/
attachments" — just no longer implying "the only one"). New endpoints:
`GET /resumes/mine`, `PATCH /resumes/:id/default`, `DELETE /resumes/:id`.
Capped at 5 resumes per candidate, enforced in the controller (Mongo
has no native "max N docs matching a filter" constraint). Deleting the
last resume is refused; deleting the default one auto-promotes the
next most recent.

**Known limitation, deliberate:** switching or deleting the default
resume repoints `CandidateProfile.resumeId` but does **not** re-parse.
The profile's structured fields (skills, experience, etc.) stay
whatever the most recent upload produced. Full per-resume profile
snapshots would need either a parsed-snapshot-per-resume schema or an
extra ai-service round trip on every switch — not justified for a
library that exists to hold alternate resume *files*, not alternate
profiles.

**Frontend:** `ResumeUpload.jsx` rebuilt as a list view (was a single
"your one resume" card) with make-default/delete actions per resume
and an upload dropzone that disables itself at the cap.

## F2 — Pipeline (stage-advance + bulk)

**Backend:** `Application.status` already existed as an enum but
nothing could change it after creation — this was a real gap, not a
speculative feature. New: `GET /jobs/:jobId/applications`, `PATCH
.../applications/:id/stage`, `PATCH .../applications/bulk-stage`.

**Frontend:** new standalone `Pipeline.jsx`
(`/recruiter/jobs/:jobId/pipeline`, own Nav like `MatchView`) with
board view (4 status columns, per-card stage `<select>`) and table
view (checkboxes + a bulk "move selected" bar). Reused native
`<select>` throughout rather than shadcn's `Select` component, matching
the convention already used everywhere else in the app (`PostJobView`,
`AdminDashboard`, `ContactPage`).

## F3 — Recruiter Analytics

**Backend:** `GET /jobs/analytics`, recruiter-scoped, reusing the same
aggregation shape as `admin.controller.getStats` (applicant funnel by
status + a 4-bucket match-score histogram) filtered to
`createdBy: req.user._id` instead of the whole platform. Registered
before the `/:jobId` wildcard route so `analytics` isn't swallowed as
a job id — same pattern `/my-applications` already used.

**Frontend:** new `Analytics.jsx`, a `RecruiterDashboard` tab (unlike
Pipeline, this is recruiter-wide, not per-job) with stat cards and two
simple bar-chart panels.

## F4 — Self-service account deletion

**Backend:** `DELETE /auth/me` soft-deletes the caller's own account
(same `isDeleted` flag `admin.controller.deactivateUser` uses) and
revokes every refresh token for it. Deliberately not a hard-delete
cascade across Resume/CandidateProfile/Application/MatchResult — that
class of change is much larger and harder to reverse, and wasn't
justified just to make "delete" mean something more literal.

**Frontend:** a trash-icon button in `Nav` (next to Sign out) opens a
confirmation dialog before calling the endpoint and logging out.

## Bugs found and fixed along the way

- **`select.jsx` and `dropdown-menu.jsx`** (shadcn-generated, never
  used before this session) both imported `IconPlaceholder` from a
  Next.js-specific path (`@/app/(create)/components/icon-placeholder`)
  that doesn't exist in this Vite app — the same landmine already
  fixed in `dialog.jsx` during the R1 foundation work. Replaced with
  direct Radix Icons imports in both files before `Pipeline.jsx` could
  need them.
- **`vitest.config.js` was missing the `"@"` path alias** that
  `vite.config.js` has — any test importing a component that pulls in
  `dialog.jsx` (via `Modal`) failed to resolve
  `@/components/ui/shadcn/button`. Added the same alias to both
  configs.
- **Test fixture collision:** `job.test.js`'s `makeRecruiter()` helper
  hardcoded one email, so any test creating two recruiters (needed for
  the new "can't touch another recruiter's job" checks) hit a Mongo
  duplicate-key error. Parameterized it with a default, matching
  `makeCandidate()`'s existing pattern.

## Verification

- Backend: 42 Jest tests (was 25 before this session's F-phase work),
  all passing — new coverage for the resume cap/switch/delete/promote
  logic, cross-recruiter isolation on stage-advance and analytics, and
  self-delete + token revocation.
- Frontend: `npm run build` clean, all Vitest tests passing.
- Live walkthrough against a real local MongoDB (seeded via a
  throwaway script, cleaned up after): logged in as a seeded
  recruiter, moved an applicant through the board view, bulk-moved two
  more via the table view, confirmed Analytics reflected the exact
  resulting funnel counts. Logged in as a seeded candidate, switched
  and deleted resumes in the library (including the "can't delete your
  last one" guard), then deleted the account itself and confirmed a
  subsequent login attempt was rejected with "This account has been
  deactivated."
