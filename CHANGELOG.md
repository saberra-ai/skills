# Changelog

All notable changes to this kit are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · versioning: [SemVer](https://semver.org).

## [0.9.0] — 2026-06-30

### Changed
- **`adversarial-harden` + `hardener`** — made materially **more adversarial**. The skill was
  purely *example-based* (hand-feed malformed/oversized inputs) — it found only the bugs a human
  thought to enumerate. Added a tiered **A0–A6 ladder** so hardening escalates past hand-fed inputs
  to the techniques that find what humans *don't* enumerate, each rung gated to the surface that
  owes it (A1+A4 CI-cheap and broad; A2/A5 heavier, surface-gated; A6 design-time). Folded inline
  (skill 50 → 82 lines, under the ~300-line split threshold per
  [Anthropic skill-authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices));
  no new required receipt field (added an optional `Methods:` line). MINOR — substantive new
  capability, not a fix. Researched first (`research-decision`); every rung verified against a
  primary source:
  - **A0 Taxonomy** — a *named* input-class checklist (boundary · encoding/**overlong-UTF-8** ·
    resource-exhaustion · injection · time/TOCTOU · ordering), each mapped to a
    [CWE](https://cwe.mitre.org/): boundary→[ISTQB BVA](https://istqb-glossary.page/boundary-value-analysis/)/CWE-193;
    [overlong-UTF-8 traversal](https://www.unicode.org/reports/tr36/tr36-15.html) (UTR #36 §3.1) +
    [confusables](https://www.unicode.org/reports/tr39/) (UTS #39); billion-laughs
    [CWE-776](https://cwe.mitre.org/data/definitions/776.html) / ReDoS
    [CWE-1333](https://cwe.mitre.org/data/definitions/1333.html) +
    [Crosby & Wallach, *Algorithmic Complexity Attacks*, USENIX Sec 2003](https://www.usenix.org/legacy/events/sec03/tech/full_papers/crosby/crosby_html/index.html);
    TOCTOU [CWE-367](https://cwe.mitre.org/data/definitions/367.html) +
    [Cloudflare leap-second panic](https://blog.cloudflare.com/how-and-why-the-leap-second-affected-cloudflare-dns/);
    race [CWE-362](https://cwe.mitre.org/data/definitions/362.html). (Correction caught in research:
    path-traversal is OWASP **A01**, not A03.)
  - **A1 Property** — generate + assert an invariant + integrated **shrinking**:
    [Claessen & Hughes, QuickCheck, ICFP 2000](https://dl.acm.org/doi/10.1145/351240.351266);
    [MacIver / Hypothesis integrated shrinking](https://hypothesis.works/articles/integrated-shrinking/) (proptest).
  - **A2 Fuzz** — coverage-guided fuzzing + sanitizer: [AFL++](https://aflplus.plus/),
    [cargo-fuzz](https://rust-fuzz.github.io/book/);
    [AddressSanitizer, Serebryany et al., USENIX ATC 2012](https://research.google/pubs/pub37752/) +
    [UBSan](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html).
  - **A3 Oracle** — [differential, McKeeman, DTJ 1998](https://dblp.org/rec/journals/dtj/McKeeman98.html)
    ([Csmith, PLDI 2011](https://dl.acm.org/doi/10.1145/1993498.1993532): 325+ compiler bugs);
    [metamorphic, Chen et al. 1998](https://arxiv.org/abs/2002.12543) +
    [Segura survey, IEEE TSE 2016](https://personales.us.es/sergiosegura/files/papers/segura16-tse.pdf).
  - **A4 Mutation** — a surviving mutant = a missing assertion (the rigorous form of *green ≠
    verified*): [DeMillo/Lipton/Sayward 1978](https://www.researchgate.net/publication/2957629);
    mutation score predicts real-fault detection where coverage does not —
    [Just et al., FSE 2014](https://dl.acm.org/doi/10.1145/2635868.2635929);
    [cargo-mutants](https://mutants.rs/) / [PIT](https://pitest.org/).
  - **A5 Interleave** — [loom](https://github.com/tokio-rs/loom) (models C11 weak memory; basis
    [CDSChecker, Norris & Demsky, OOPSLA 2013](https://dl.acm.org/doi/10.1145/2509136.2509514)) +
    [TSan](https://clang.llvm.org/docs/ThreadSanitizer.html); stateful PBT
    ([Hughes, *Testing the Hard Stuff*, 2016](https://link.springer.com/chapter/10.1007/978-3-319-30936-1_9) —
    the Erlang `dets` open→write→close→reopen corruption).
  - **A6 Threats** — enumerate per trust boundary to find *missing controls* (absent audit-log =
    Repudiation; authZ on the wrong side = Elevation): STRIDE
    ([Kohnfelder & Garg, 1999](https://medium.com/@lorenkohnfelder/threat-modeling-retrospective-72910908533c);
    [Microsoft Learn](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)) +
    [attack trees, Schneier, Dr. Dobb's 1999](https://www.schneier.com/academic/archives/1999/12/attack_trees.html),
    via [STRIDE→CAPEC→CWE](https://capec.mitre.org/).

## [0.8.2] — 2026-06-30

### Changed
- **`ship-feature` + `RECEIPTS.md`** — folded in five process gaps surfaced by **dogfooding the
  flow end-to-end** (the Pio self-improving-skill-loop ship, across three slices). All inline, no
  new skill: `ship-feature` stays 144 lines, well under the ~300-line split threshold per
  [Anthropic skill-authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
  (split to reference files only when a SKILL.md is unwieldy; fold otherwise).
  - **Phase 0 — probe the gate, don't just inventory it.** Run the actual command Phase 2/4 will
    run (`<test> --no-run`, the lint, a build of the crate you'll touch) on the current tree
    *before* writing code. A disk / credential / config-drift wall is far cheaper to hit on an
    empty tree than five times mid-Phase 2 (the exact failure mode dogfooding hit).
  - **Phase 2 — "does a *user* actually reach it?"** The sibling of *verified ≠ wired*, one level
    up: a whole **surface** nothing mounts (a dead-code component / unlinked route / unregistered
    command) passes every test it has and ships nothing. Trace from the entry point, not just the
    call site.
  - **Phase 4 — a gate you always bypass has stopped gating.** Repeated `--no-verify` for the
    *same* reason is its own finding — fix the root cause (pin the toolchain, repair the hook)
    instead of normalizing the bypass.
  - **Fanning out — seam-check before banking a slice.** Ask *what does the next slice assume this
    one delivered?* — latent gaps (an inert dependency, an unmounted surface) hide *between* two
    "complete" slices and surface only when the next one builds on them.
  - **`RECEIPTS.md` — triage non-obvious gaps inline** (*verifiable here? · cost · blocks-what*) so
    a ⬜ is actionable, not merely honest. Validator green; no new required receipt field.

## [0.8.1] — 2026-06-28

### Changed
- **`design-interface` + `design-review`** — added **responsiveness** as a first-class dimension
  (it was thin: the skills covered touch ergonomics + motion but under-weighted adaptive layout — a
  silent gap for a "near-native" claim, since mobile adaptation is half of native feel). Folded in,
  verified against primary sources: mobile-first, fluid type via [`clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
  (max ≥2× min so 200% zoom survives), [`@container`](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
  queries, [`dvh`/`svh`](https://web.dev/blog/viewport-units) not `100vh`, `env(safe-area-inset-*)` for
  notches, and three measurable bars now in the rubric — **reflow at 320px / no 2-D scroll**
  ([WCAG 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)), **resize text 200%**
  ([1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)), **no orientation lock**
  ([1.3.4](https://www.w3.org/WAI/WCAG22/Understanding/orientation.html)). `design-review` now runs its
  pass at ≥3 viewport widths + both orientations with a screenshot per breakpoint. Caught by dogfooding
  question right after the v0.8.0 ship.

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
