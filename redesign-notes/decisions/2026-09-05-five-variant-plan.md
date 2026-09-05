# Five parallel UI variants across branches

User's ask escalated again: go through ui-skills.com more broadly, use locally-installed tools (Ollama, and CLI agents named "hermes," "opencode," "cursor cli," "antigravity/agy") specifically to conserve Claude usage, and produce 5 different frontend UI directions across 5 branches by morning. Hard constraint, stated explicitly and repeated multiple times: do not crash or damage the laptop — check specs and usage before pushing hardware.

## Safety check (done first, before touching anything)

- CPU: AMD Ryzen AI 9 365, 10 cores/20 threads.
- RAM: 31 GB total, only 11.6 GB free at the time of checking (other things already running).
- GPU: NVIDIA RTX 5060 Laptop, 8151 MiB VRAM, 0 MiB used, 43°C idle — plus an integrated Radeon 880M.
- Ollama already had 3 models pulled: gemma4:12b (7.6GB), deepseek-r1:8b (5.2GB), qwen3.5:9b (6.6GB). Any one of these run alone fits the 8GB VRAM headroom reasonably; two at once would not, given only ~11.6GB free system RAM as a backstop.

**Rule adopted: never run more than one local (GPU-resident) model at a time, ever.** Checked `nvidia-smi` before and after loading any local model.

## Tool inventory (checked what's actually installed, assumed nothing)

- `hermes` — not found on PATH. Not usable; skipped rather than guessed at or faked.
- `opencode` (npm global, v1.18.27) — installed. `opencode models` confirms `opencode/big-pickle` is a real, distinctly-named free model, exactly as the user described.
- `cursor-agent` (`cursor-agent.cmd`, under `AppData/Local/cursor-agent`) — installed, supports `-p`/`--print --force` for non-interactive one-shot runs (needed `--force` to skip a workspace-trust prompt that would otherwise hang forever waiting for input).
- `agy` (v1.1.25, this is "antigravity") — installed, supports `--print` with `--dangerously-skip-permissions --mode accept-edits` for non-interactive runs. Flag-order matters: `-p` greedily consumes the next token as its own value, so global flags must come before it.

No new models were installed — the three already pulled cover a reasonable size/capability spread, and installing more just adds disk usage and choice-paralysis without a concrete need. (User separately said "free to install any models you need" — noting explicitly that this wasn't needed, not that it was ignored.)

## Execution plan

5 branches off `main`, which already carried this session's teal/light-dark redesign as variant 1 (`redesign/claude-teal`) — no further work needed there beyond what was already built.

For the other 4, created isolated `git worktree`s (matching the user's own suggested mitigation) so each tool edits its own checkout and can't collide with mine or each other's:
- `redesign/opencode-bigpickle`
- `redesign/agy-antigravity`
- `redesign/cursor-agent`
- `redesign/ollama-local`

Pre-installed `node_modules` in all 4 worktrees before handing off (parallel `npm install` — disk/network-bound, not a hardware risk) so each tool spends its run budget on the actual redesign rather than setup.

## Hardware-safety reasoning for concurrency

`opencode`, `cursor-agent`, and `agy` all call out to remote-hosted models over the network — the actual inference happens on their servers, not this laptop. Running those three *at the same time* is safe: it's concurrent Node processes making API calls plus local file edits, not GPU/CPU load. Confirmed with `nvidia-smi` while all three were running: 0% GPU utilization, 0 MiB used.

The Ollama-backed variant is the only one that's genuinely local-compute-heavy, so it runs **alone** — never overlapping with anything else that touches the GPU, one model loaded at a time, unloaded when done.

## Creative briefs (deliberately distinct, so the 5 results don't converge)

Each tool was pointed at `PRODUCT.md` and this notes folder for context, told explicitly this is a **restyle** (visual layer only — colors, typography, spacing, shared component styling) not a rewrite (keep every route and all business logic exactly as-is), and given one clearly distinct creative direction:

| Variant | Direction |
|---|---|
| opencode/big-pickle | Bold, high-contrast, dark-mode-first |
| cursor-agent | Warm, editorial, premium print-magazine feel |
| agy/Antigravity | Dense, data-forward "cockpit" dashboard for power users |
| ollama (deepseek-r1:8b, direction only — I implemented it) | "Confident Architecture": trust-blue, sharp corners, tight spacing (full brief in [variants/05-ollama-local.md](../variants/05-ollama-local.md)) |

Per-tool outcomes, issues hit, and verification are tracked in `variants/` as each completes.
