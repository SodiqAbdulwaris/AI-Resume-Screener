# Variant 2 — opencode / big-pickle: bold, high-contrast, dark-mode-first

**Branch:** `redesign/opencode-bigpickle`
**Worktree:** `../hiresignal-worktrees/opencode-bigpickle/`
**Built by:** `opencode` CLI, `opencode/big-pickle` model (free tier)
**Status:** 🔄 in progress — launched via `opencode run -m opencode/big-pickle --dir <worktree> "<brief>"`

## Brief given

Read `PRODUCT.md` and this notes folder for context. Redesign the visual layer only (global.css + shared `ui/` components) into a bold, high-contrast, dark-mode-first direction — pick its own accent color and type pairing, explicitly not teal/indigo. Keep every route and all business logic exactly as-is. Build and commit when done.

## Outcome

✅ Complete. Commit `3506f44` on `redesign/opencode-bigpickle`: **"bold dark-first 'Signal' redesign (radar-orange + carbon)"**.

- Dark made the default theme (not just available)
- Accent: radar/signal orange (`#ff6a00` family) against a carbon-dark base
- Heading font: Space Grotesk (self-hosted, dependency added); body kept Geist
- Rewrote `global.css` tokens, `designSystem.js`, `constants/colors.js`, and shared `ui/` components (Avatar, Alert dual-mode, heading font wiring)
- Caught and fixed its own contrast bug mid-run: initial avatar-initials text was white on the `#ff6a00` gradient, illegible — corrected to dark text (`#2b1200`) before finishing, unprompted
- Ran `npm run build` itself, confirmed it compiled, then committed

No intervention needed from me beyond launching it and pre-installing `node_modules`. Genuinely the smoothest of the three CLI-tool runs.
