# Variant 1 — Claude / teal light+dark

**Branch:** `redesign/claude-teal` (= `main` as of this session's teal-theme commits)
**Built by:** me, directly, across several turns this session
**Status:** ✅ Done and verified in-browser

## Direction

Light-default theme with a genuine dark mode (toggle in `Nav`, persisted per-viewer via `localStorage`, defaulting to system `prefers-color-scheme` on first visit). Teal accent family throughout, replacing an earlier dark-indigo carryover the user reviewed and said they didn't like.

## Source of the palette

Light-mode tokens came from the `ui-ux-pro-max` skill's `--design-system` / `--domain color` search — the "Productivity Tool" match (recruiting/hiring SaaS, teal family) — not hand-invented. Full reasoning and the two deliberate deviations from that source data (contrast fix on `--primary-foreground`, desaturated `--border`) are in [../decisions/2026-09-05-ui-skills-repo-reversal.md](../decisions/2026-09-05-ui-skills-repo-reversal.md).

Dark-mode tokens are my own derivation (no verified dark-teal match existed) — same hue family, values chosen by me.

Typography: kept the existing self-hosted Geist Variable rather than switching to the tool's top typography match (Plus Jakarta Sans) — no clear win to justify the churn, already integrated and working.

## What was actually built (Phase R1-R2 of the earlier redesign plan)

- Tailwind v4 + shadcn/ui foundation (Vite plugin, Radix base, Radix Icons as the icon library)
- Full light/dark CSS custom-property token set in `frontend/src/styles/global.css`
- `ThemeContext` + toggle button in `Nav`
- All shared `ui/*` primitives (Btn, Badge, Modal, Tabs, ScoreBar, Avatar, Divider, FormField, Alert, SkeletonBlock) rewritten on top of shadcn components, keeping their existing prop APIs
- Auth pages (`AuthPage`, `VerifyEmailPage`, `ForgotPasswordPage`, `ResetPasswordPage`) converted to a shared `AuthLayout` component
- Every emoji-as-icon and the italic-reading `Instrument Serif` heading font removed app-wide (this was the specific complaint that kicked off the whole redesign)
- `constants/colors.js` repointed at the CSS custom properties so screens not yet converted to Tailwind classes are still theme-aware

## Verification

Live browser walkthrough (recruiter dashboard, candidate browse/apply flow, JobDetailModal dialog) in both light and dark mode, against real backend data, zero console errors. Screenshots taken during the session (not saved to disk, but described in the conversation transcript if this needs re-verifying).

## Known non-issues

One React console warning ("Function components cannot be given refs") from a React 18 + latest `radix-ui` package version mismatch inside the generated `dialog.jsx` — cosmetic, Dialog works correctly, not worth a React 19 upgrade to silence.

## Update — Phases R3-R5 completed, live-verified (2026-09-06)

Picked back up after the user woke up and said to keep going. Finished what the previous update left open:

- Converted every remaining screen from inline `COLORS.*`/`s.*` styles to Tailwind classes: all candidate screens (JobCard, JobDetailModal, ApplyModal, CandidateBrowse, CandidateApplications, CandidateProfile, ResumeUpload) and their dashboard shell (R3); all recruiter screens (RecruiterJobs, PostJobView, MatchView, MatchResultCard) and their shell (R4); AdminDashboard's stats grid, users/jobs tables, and settings form (R5); plus the pages that didn't fit neatly into R1-R5 (ContactPage, ContactSupport, PageHeader, ErrorBoundary, App.jsx's loading screen).
- **Deleted `constants/colors.js` and `styles/designSystem.js`** — once every screen was converted, nothing imported either file anymore. Dead code removed rather than left around.
- **Made the app responsive** (explicit user ask this round): Nav's right-side cluster was overflowing horizontally below ~640px instead of wrapping (Sign out was pushed off-screen with no way to reach it). Fixed with `flex-wrap` plus hiding the "Contact Us" label and name/email block at narrow widths (avatar + role badge still identify the account). Verified live at 375px, 768px, and desktop. Grids across the app already used `auto-fit`/`auto-fill` `minmax()` patterns from earlier work, so most of them collapsed to one column for free; PostJobView's and AdminDashboard's two-column form/table grids got explicit `sm:grid-cols-2` treatment, and admin's data tables scroll horizontally on narrow screens instead of overflowing the page.
- **Bugs found and fixed while converting:**
  - `Spinner`'s ring color was hardcoded `border-white/15` — invisible on the light theme's white cards. Changed to `border-current/15` so it adapts to whatever text color it's rendered against.
  - `Btn`'s `className` prop was silently overwritten by the `fullWidth`-derived class instead of merging with it.
  - Two Vitest files (`MatchView.test.jsx`, `AdminDashboard.test.jsx`) broke because they render `<Nav>`, which now calls `useTheme()` — neither test wrapped its tree in `ThemeProvider`. Fixed both, and stubbed `window.matchMedia` in the shared test setup (jsdom doesn't implement it, and `ThemeProvider` reads it for the `prefers-color-scheme` fallback).

**Verification:** full live walkthrough against a real backend + local MongoDB (registered a recruiter and a candidate test account, since the dev DB was empty — email verification was bypassed by flipping `isVerified` directly in Mongo, since no email backend is configured locally). Posted a real job, viewed it as both roles, opened `JobDetailModal` as a `Dialog`-based modal, toggled dark mode. Zero console errors. `npm run build` and `npm test` (6/6) both pass. Test data cleared from the dev DB afterward; backend server stopped.

**Remaining after this round:** the other 4 variant branches/worktrees (`redesign/opencode-bigpickle`, `redesign/cursor-agent`, `redesign/agy-antigravity`, `redesign/ollama-local`) are untouched and still available for comparison — none deleted. The F1-F4 new-feature phases (resume library, pipeline, recruiter analytics, account deletion) from the original plan were never started; only the visual redesign phases (R1-R5) were in scope for this pass.
