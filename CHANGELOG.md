# Changelog

All notable changes to this kit are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · versioning: [SemVer](https://semver.org).

## [0.8.0] — 2026-06-28

### Added
- **`design/design-interface`** — build a web interface at **near-native** quality. Grounds the
  *look* in a canonical reference (shadcn/Radix/Refactoring UI) + an explicit token system (the
  anti-AI-slop move), and the *feel* in measurable bars: INP ≤200ms / LCP ≤2.5s / CLS ≤0.1
  ([Core Web Vitals](https://web.dev/articles/vitals)), contrast ≥4.5:1 ([WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)),
  `axe` clean, interruptible spring motion on composited properties ([Emil Kowalski](https://emilkowal.ski/ui/great-animations)),
  with a screenshot artifact. Receipt: Claim · Reference · Tokens · Checks · Artifact.
- **`design/design-review`** — audit an *existing* web UI: a mechanical pass (axe, Core Web Vitals,
  motion/focus lints, AI-slop greps) then a judgment pass (hierarchy, restraint, feel), ranked by
  severity and fixed forward with before/after proof. The diagnose-and-repair bookend to
  design-interface (separate skill — its proof differs: diagnosed defects + measured delta, not a
  from-scratch token system). Receipt: Claim · Surface · Audited · Fixed · Artifact.
- **`references.md`** — a seed reference registry (`subsystem → reference`, code vs judgment) that
  `mirror-reference` expects but the kit lacked; both design skills mirror from it.
- Validator now registers typed receipt field-specs for both design skills, so they're enforced
  (not merely warned) like every other skill.

### Decision
- New skills derived via a deep `research-decision` pass (primary sources: NN/g, WCAG 2.2, web.dev
  Core Web Vitals, Refactoring UI, Anthropic frontend-design, motion/Radix/shadcn). The split into
  two skills mirrors the kit's own build-vs-review separation (`mirror-reference` vs
  `adversarial-harden`) — proof differs in kind, so the receipts do too.

## [0.7.0] — 2026-06-28

### Added
- **Receipt standard** ([`RECEIPTS.md`](RECEIPTS.md)) — every skill now ends in a `## Receipt`
  block: a typed, copy-pasteable proof template that states the **claim · real basis · what ran ·
  result · artifact · what's NOT proven**. The public throughline: *agents that leave proof*, not
  agents that say "done".
- **Typed per skill, never one flat template.** A `research-decision` receipt cites sources and
  recommends (no "command ran"); a `verify-capability` receipt asserts a metric on a real input.
  Stamping one generic block everywhere would force hollow `N/A` fields — the exact fake-green this
  kit exists to kill. Each of the 8 skills carries the fields its class owes.
- **Enforced by the validator.** [`scripts/validate.mjs`](scripts/validate.mjs) now checks every
  `SKILL.md` for a `## Receipt` section, its fenced template, an honest-gap line, and the typed
  fields per skill — and `--self-test` injects receipt-broken fixtures (missing section, missing
  gap, prose-only field, missing field) that **fail loud** if they slip through. A skill without a
  valid receipt fails CI. (Self-test: 22 malformed fixtures, all rejected.)

### Changed
- **README hero** — adds the "agents that leave proof" throughline + a `RECEIPTS.md` link above
  the fold, keeping the existing harness-agnostic voice.

## [0.6.0] — 2026-06-27

### Changed
- **`research-decision`** — raised from "web-search 2–3 queries → recommend" to a
  **depth-matches-stakes** contract, and **enforced it**. New: a depth ladder (quick fork vs
  **deep**) and a **deep bar** that a quality / "make it the best" / novel / safety decision must
  clear — **primary sources incl. research papers** (authors/venue/year, not blog summaries), the
  **canonical references named to mirror**, **breadth fanned out** across sub-dimensions, a **cited
  rubric** (measurable, re-checkable — not a one-time recommendation), a **critical alignment
  audit** against the real code, and **grounding that corrects the literature**. Done-when now
  fails a deep question answered with one search. Motivated by dogfooding: a "make UI/UX/agent the
  best" question got one narrow search — exactly the failure this rewrite forbids.
- **`ship-feature`** — Phase 0 gate now enforces research depth: a deep/quality/safety call
  answered with a single search ⛔ does not pass Frame. Under-researching a high-stakes question
  is treated as the same failure as not researching it.

## [0.5.2] — 2026-06-27

### Changed
- **`build-knowledge-base`** — hardened from dogfooding it on a real 183-crate monorepo
  (fastrepl/char). Four learnings folded in: (1) **distill the surveys, don't paste** — fan-out
  agents return exhaustive dumps; a spine doc is ~40–80 lines of flow + cited entry points, not
  a 200-line dump; (2) a **concrete freshness recipe** for repos with no tooling (`git rev-parse
  --short HEAD` / `git hash-object` + `verified_at`); (3) **drop in a generic ~50-line llms.txt
  generator with `--check`**, don't hand-maintain the map; (4) **right-size enforcement to your
  access** — when you can't wire CI (foreign/early repo), the MVP is a committed `--check` runner
  + a CONTRIBUTING note, an honest ⬜, not "no enforcement".

## [0.5.1] — 2026-06-27

### Changed
- **`build-knowledge-base`** — folded in learnings from validating OKF against the field
  (Diátaxis, llms.txt adoption, "codified context as infrastructure"): separate the *substrate*
  (plain markdown+frontmatter, near-zero lock-in) from any *standard* and don't depend on a draft
  format (OKF is v0.1); the durable moat is enforcement + an intentional doc-type taxonomy, not
  the format; framed the KB as the cold tier of an agent's tiered memory (hot constitution +
  domain agents + cold KB).

## [0.5.0] — 2026-06-27

### Added
- **`build-knowledge-base`** skill (orchestration) — the genesis counterpart to
  `maintain-knowledge-base`: bootstrap a knowledge base for a codebase that has none.
  Survey the real structure, choose an enforceable format (frontmatter + progressive-
  disclosure index + machine-readable map, mirroring Diátaxis / OKF / llms.txt), author
  the high-traffic spine **from source** (cited, freshness-stamped), define a coverage
  contract, and wire validators into the gate — then hand off to `maintain-knowledge-base`.
  The two are bookends: build, then maintain. Built + validated via `ship-feature`.

## [0.4.0] — 2026-06-27

### Added
- **`maintain-knowledge-base`** skill (orchestration) — the documentation bookend to
  `ship-feature`: a recurring loop to keep a docs/knowledge base accurate, covered,
  navigable, and machine-readable. Codifies hard-won learnings — audit with the
  validators, **honest drift-refresh** (re-verify a drifted doc against current source
  before refreshing freshness; never blind-bump a sha), fill real coverage gaps from
  source (no padding), maintain a generated `llms.txt`-style map, and **enforce** it in
  the gate so it can't silently rot. Built + validated via `ship-feature`.

## [0.3.1] — 2026-06-27

### Added
- **`install.sh`** — a vetted, portable POSIX-`sh` installer (no bash arrays, no `[[ ]]`, no PATH
  assumptions). Reads `manifest.json` and installs every skill/agent/workflow + the doctrine.
  Meant to be piped to `sh`, so your interactive shell never parses it:
  `curl -fsSL https://raw.githubusercontent.com/saberra-ai/skills/main/install.sh | sh`.

### Fixed
- Install no longer depends on an agent improvising a shell script — earlier that produced
  bash-array/`PATH` syntax that **choked in fish/zsh**. The shipped installer is POSIX and
  CI-pinned: the validator runs `sh -n` on it and rejects any `name=(…)` array or `[[ … ]]`
  bashism, so it can't regress into a non-portable form. (self-test gains a teeth case)

## [0.3.0] — 2026-06-27

### Added
- **One-prompt install for any AI agent** — a copy-paste prompt (README → Install) that installs
  the kit with only HTTP GET + file writes: no `npm`, no CLI, no env assumptions.
- **`manifest.json`** — a machine-queryable index (raw-GitHub URL) listing every skill / agent /
  workflow + the version, so an agent can discover and fetch each file. Generated by
  `scripts/gen-manifest.mjs` (`npm run manifest`).
- Validator now **cross-checks the manifest** against its own independent file discovery: a
  skill missing from the manifest, a phantom entry, or a version mismatch fails CI — the manifest
  can't silently drift and drop a skill from installs. Self-test grows a teeth case for it.

## [0.2.0] — 2026-06-27

### Added
- **Maintenance lifecycle** — the kit now has an install→maintenance loop, not just install.
  - `maintain-skills` front-door skill + runnable [`workflows/maintain.mjs`](workflows/maintain.mjs):
    detect the install, update it (with a backup + restore-on-failure), run any pending
    migrations, then **re-verify with `validate.mjs`** — a *verified* upgrade.
  - `VERSION` + this changelog as the lifecycle backbone ("what changed" is now answerable).
  - `migrations/` — idempotent, done-marked, **retry-on-incomplete** upgrade scripts
    (pattern in [`migrations/README.md`](migrations/README.md) and `AGENTS.md` §9).
- Validator (`scripts/validate.mjs`) extended to grade the lifecycle: `VERSION` is SemVer and
  matches `package.json`; `CHANGELOG` has an entry for the current version; migration scripts
  parse (`bash -n`). Self-test grows teeth for each.

### Notes
- Lifecycle discipline mirrors [garrytan/gstack](https://github.com/garrytan/gstack)'s
  reversible, migration-based upgrades (`gstack-upgrade/SKILL.md`, `migrations/v1.40.0.0.sh`) —
  adapted to this kit's scale and **verified by our own substrate**, which is the edge gstack lacks.

## [0.1.0] — 2026-06-27

### Added
- Initial kit: the build doctrine (`AGENTS.md`), 5 skills, 3 subagents, the `ship-feature`
  front-door workflow + runnable orchestrator, and the self-verifying `validate.mjs` substrate
  (green ≠ verified — fails loud on silent skips, proves its own teeth via `--self-test`).
