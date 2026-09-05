# Variant 5 — Ollama-directed "Confident Architecture"

**Branch:** `redesign/ollama-local`
**Worktree:** `../hiresignal-worktrees/ollama-local/`
**Built by:** me (implementation), direction proposed by locally-run `deepseek-r1:8b`
**Status:** 🔄 in progress

## Why the local model doesn't implement directly

Raw Ollama chat models have no file-editing or tool-use harness — they can only return text. Rather than skip the "use a local model" ask, I used it for what it's actually good for: proposing a creative direction, which I then implement the same way I would my own idea. This keeps the GPU-heavy part (model inference) short and bounded — one prompt, one response, model unloaded — rather than trying to force an unsuitable tool into an agentic loop it doesn't support.

## Hardware note

Loaded only after confirming (via `nvidia-smi`) zero other GPU usage. Used `deepseek-r1:8b` specifically (5.2GB) rather than the larger `gemma4:12b` (7.6GB) already pulled, for the widest safety margin against the 8GB VRAM ceiling given other things were already consuming system RAM.

## The brief given to the model

Told it about the other four directions already in flight (teal light/dark, bold dark-mode-first, warm editorial, dense cockpit) and asked for a fifth, clearly distinct from all of them, as a structured spec: name, 2-3 colors with reasoning, a real Google Fonts pairing, corner-radius/spacing philosophy, one-line mood.

## What it proposed

- **Name:** "Confident Architecture"
- **Colors:** Primary `#004171` (deep trust-blue), Secondary/accent `#3A86FF`, Background `#F8F9FA`
- **Typography:** Montserrat (headings) + Open Sans (body)
- **Shape/spacing:** Sharp corners, tight spacing
- **Mood:** "Disciplined and confident"

Its own reasoning (visible in the raw output, worth keeping): it explicitly noted the other four directions skew either "trendy" (bold dark, warm editorial) or "technical" (cockpit), and picked a deliberately more corporate/authoritative register to fill that gap — a structured, blue, high-trust register aimed at the recruiter side of the audience without abandoning candidates.

## Implementation status

✅ Complete. Commit `4191f12` on `redesign/ollama-local`.

Implemented: full light+dark token set in `global.css` (dark mode is my addition — the model's brief didn't cover it, but the toggle infra already exists app-wide and dropping it felt like a worse outcome than a sensible companion palette in the same navy family), `--radius: 0` for sharp corners, Montserrat (headings) + Open Sans (body) via Google Fonts.

Verified: `npm run build` passes, spot-checked in-browser in both themes via a temporary dev server on port 5180 — renders as intended, sharp corners visible on card/inputs/button, clean structured layout.

**Known limitation, documented rather than silently left:** several components set `fontFamily` inline (`'Geist Variable'`) on real `<h1>`-`<h3>` tags, which beats the CSS `h1,h2,h3{font-family: Montserrat}` rule this commit added (inline styles always win over stylesheet rules). So not every heading in the app actually shows Montserrat yet — the ones with no inline override do, others still show Geist. Full fix requires the same file-by-file Tailwind-class conversion the teal variant did for R2 (auth pages) — out of scope for a single-pass color/font-token exploration.
