# Redesign notes — index

Second-brain structure for the overnight autonomous redesign session (started 2026-09-05, user stepped away and granted full autonomy with one hard rule: don't damage the laptop). Read this file first; it links to everything else.

## What's happening

The HireSignal frontend is being redesigned in **5 parallel visual directions**, each on its own git branch, built by a different tool:

| # | Branch | Built by | Direction | Status |
|---|--------|----------|-----------|--------|
| 1 | `redesign/claude-teal` | Me (this session, earlier) | Light-default, teal accent, real dark mode toggle | ✅ Done — see [variants/01-claude-teal.md](variants/01-claude-teal.md) |
| 2 | `redesign/opencode-bigpickle` | `opencode` CLI, free `big-pickle` model | Bold, high-contrast, dark-mode-first | 🔄 In progress — see [variants/02-opencode-bigpickle.md](variants/02-opencode-bigpickle.md) |
| 3 | `redesign/cursor-agent` | `cursor-agent` CLI | Warm, editorial, premium print-magazine feel | 🔄 In progress — see [variants/03-cursor-agent.md](variants/03-cursor-agent.md) |
| 4 | `redesign/agy-antigravity` | `agy` (Antigravity) CLI | Dense, data-forward "cockpit" dashboard | 🔄 In progress — see [variants/04-agy-antigravity.md](variants/04-agy-antigravity.md) |
| 5 | `redesign/ollama-local` | Me, direction proposed by local `deepseek-r1:8b` | "Confident Architecture" — trust-blue, sharp corners, tight spacing | 🔄 In progress — see [variants/05-ollama-local.md](variants/05-ollama-local.md) |

Each variant lives in its own [git worktree](https://git-scm.com/docs/git-worktree) under `../hiresignal-worktrees/<name>/`, isolated from this main checkout and from each other, so 3 tools could run concurrently without touching the same files.

## Why this structure exists

The user explicitly asked for everything logged and documented (they're not available to check in live), and specifically asked for organized files-in-folders rather than one giant markdown file. Structure:

- **`decisions/`** — one file per significant judgment call, dated, with reasoning. Read these to understand *why*, not just *what*.
- **`variants/`** — one file per UI variant, updated as each build completes: brief given, what the tool actually produced, how it was verified, any issues found.
- **`research/`** — any external research consulted (web searches, the `ui-ux-pro-max` skill's data lookups) that informed a decision, kept separate from the decisions themselves so a decision file stays short and a research trail stays inspectable.

## Hardware safety (standing constraint for this whole session)

Checked before touching any local tool: AMD Ryzen AI 9 365 (10c/20t), 32GB RAM (11.6GB free at session start), NVIDIA RTX 5060 Laptop (8GB VRAM). Rule adopted and followed throughout: **only one local (GPU-resident) model loaded at a time, ever** — cloud-backed CLI tools (opencode, cursor-agent, agy) may run concurrently since their inference happens on remote servers, not this laptop. Full reasoning in [decisions/2026-09-05-five-variant-plan.md](decisions/2026-09-05-five-variant-plan.md).
