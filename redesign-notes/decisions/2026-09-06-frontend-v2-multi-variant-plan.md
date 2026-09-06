# Frontend v2 — 18-variant plan (2026-09-06)

**Why this exists:** the user reviewed the first 5 variants and correctly
called them out — they were the same layout and components with different
colors, not genuinely different designs. This round fixes that by pairing
a real visual-philosophy skill with a real, different component library
per variant, and scoping each to representative screens instead of a full
14-screen rebuild, so 18 of them is actually tractable.

## What changed from round 1

- Round 1 (5 variants, `redesign/*` branches, still on disk, not deleted):
  same shadcn/Tailwind component base every time, different color tokens.
  User's verdict: not what they wanted.
- Round 2 (this plan): different **component library** per variant
  (shadcn, Radix Themes, Ant Design, Mantine, Chakra UI, Bootstrap 5,
  UnoCSS, or raw Tailwind with no library) *and* a different **visual-
  philosophy skill** driving layout/type/motion decisions on top of it.
- Scope per variant: 3-4 representative screens (Auth, one dashboard,
  PostJobView as a form-heavy screen, MatchView/Pipeline as a data-heavy
  screen) against the real backend, not all 14+ screens. Only the
  direction(s) the user picks afterward get built out fully.

## ui-skills.com — what's actually there (verified, not assumed)

Corrects an earlier mistake this session: I'd wrongly assumed my
already-installed skills (`industrial-brutalist-ui`, `minimalist-ui`,
`gpt-taste`, etc.) *were* the ui-skills.com catalog. They aren't — two
separate, unrelated skill sets. Ground-truthed by listing
`~/.claude/skills/` directly rather than trusting an earlier session's
notes (which had also wrongly claimed `ui-ux-pro-max` was installed —
it wasn't, anywhere).

Added `ui-skills` as an HTTP MCP server (`https://www.ui-skills.com/mcp`,
`claude mcp add --transport http ui-skills https://www.ui-skills.com/mcp`)
per the user's explicit request. It's a read-only registry (`list_skills`,
`get_skill` — no code execution, no side effects) so this carries very
little risk, but its tools aren't callable in this already-running
session (new MCP servers load at session start, not mid-session). Worked
around that by reading the catalog directly via the website's own
`/skills`, `/skills/visual`, `/skills/systems` pages instead of blocking
on a restart — 283 skills total, browsable by category.

## The 18 variants

| # | Branch | Visual-philosophy skill | Component library | Why this pairing |
|---|--------|--------------------------|--------------------|-------------------|
| 1 | `frontend-v2/brutalist-web` | `Leonxlnx/brutalist-skill` (ui-skills.com) | Raw Tailwind, no component lib | Brutalism wants exposed structure, not a polished kit hiding it |
| 2 | `frontend-v2/scandinavian` | `ericzakariasson/scandinavian-design` (ui-skills.com) | Radix Themes | Both default to restraint; Radix's plain primitives don't fight a monochrome system |
| 3 | `frontend-v2/apple` | `emilkowalski/apple-design` (ui-skills.com) | shadcn/ui + Motion (Framer Motion) | Apple's spring/physical motion needs a real animation library, not CSS transitions |
| 4 | `frontend-v2/antfu-unocss` | `antfu/antfu-design` (ui-skills.com) | UnoCSS | The skill itself mandates UnoCSS — not optional |
| 5 | `frontend-v2/interface-craft` | `Dammyjay93/interface-design` (ui-skills.com) | Ant Design | Ant is the enterprise-dashboard default; this skill is explicitly dashboard/admin-focused |
| 6 | `frontend-v2/frontend-design-anthropic` | `anthropics/frontend-design` (ui-skills.com) | Mantine | Generic "avoid AI slop, be distinctive" brief paired with a less-common kit to force real decisions instead of shadcn defaults |
| 7 | `frontend-v2/bencium-ux` | `bencium/bencium-innovative-ux-designer` (ui-skills.com) | Chakra UI | Same brief family as #6, different author/library — a genuine A/B on the same prompt shape |
| 8 | `frontend-v2/canvas-art` | `anthropics/canvas-design` (ui-skills.com) | No library, custom SVG/CSS | Art-directed brief; a component kit would fight the bespoke-canvas intent |
| 9 | `frontend-v2/industrial-brutalist` | `industrial-brutalist-ui` (local) | Plain Tailwind, terminal mono type | Different brutalist take than #1 (Swiss-print + military-terminal, not raw-web) |
| 10 | `frontend-v2/minimalist` | `minimalist-ui` (local) | Radix Themes, different config than #2 | Same library family as #2 but a different brief tests whether the library or the brief drives the outcome |
| 11 | `frontend-v2/high-end` | `high-end-visual-design` (local) | shadcn/ui, dark, premium | Deliberately closest to what already exists (shadcn) — the control variant |
| 12 | `frontend-v2/gpt-editorial` | `gpt-taste` (local) | shadcn/ui + heavy GSAP motion | Wide editorial type + strict ScrollTrigger constraints per the skill's own doc |
| 13 | `frontend-v2/stitch` | `stitch-design-taste` (local) | Ant Design, different brief than #5 | Second Ant Design pairing to isolate brief-vs-library effect on a dashboard-shaped kit |
| 14 | `frontend-v2/design-taste-v1-bootstrap` | `design-taste-frontend-v1` (local) | Bootstrap 5 | Boring-and-fast per the skill's own brief→library mapping for this kind of app |
| 15 | `frontend-v2/awwwards-experimental` | `design-taste-frontend` (local, v2) briefed "Awwwards-experimental" | Raw Tailwind, no library | High `DESIGN_VARIANCE`/`MOTION_INTENSITY` per that skill's own dial system; a library would cap the chaos |
| 16 | `frontend-v2/warisskill-taste` | `warisskill-ui-ux-visual-design-taste` (local) | Mantine | Second Mantine pairing, different brief than #6 |
| 17 | `frontend-v2/warisskill-motion` | `warisskill-ui-ux-motion-design` (local) | shadcn/ui + Motion, motion-first brief | Motion is the primary differentiator here, not layout or color |
| 18 | `frontend-v2/redesign-existing` | `redesign-existing-projects` (local) | Chakra UI, different brief than #7 | Applies the skill's own redesign-audit process to this specific app rather than a generic brief |

## Execution

Each variant: its own git worktree off `main` (so it inherits the
complete F1-F4 backend and all routes), builds Auth + one dashboard +
PostJobView + MatchView/Pipeline against the real backend, runs
`npm run build` before being called done. No variant touches
`backend/` or `ai-service/` — visual/component layer only, same
constraint as round 1.

Building via a mix of: direct work in this session, and background
subagents each given a self-contained brief (worktree path, skill to
load, library to install, screens to build, verification command) —
matches the multi-tool-in-parallel pattern round 1 used with external
CLIs, using Claude subagents loaded with specific skills instead where
an external tool isn't the fit.

Status of each variant tracked in `variants/` as it lands, same as
round 1.
