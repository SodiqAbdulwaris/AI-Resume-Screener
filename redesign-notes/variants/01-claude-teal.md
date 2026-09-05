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

## Remaining work on this variant (not done this session)

Phases R3-R5 of the original redesign plan (candidate screens, recruiter screens, admin dashboard + nav) were still using inline `COLORS.*` styles rather than full Tailwind conversion when the multi-variant branch-out began — they render correctly and are theme-aware (via the `colors.js` → CSS-variable indirection) but aren't yet using shadcn components directly the way the auth pages and shared primitives are.
