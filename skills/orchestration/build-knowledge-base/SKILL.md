---
name: build-knowledge-base
description: Bootstrap a knowledge base for a codebase that has none — survey the real structure, choose an enforceable format (frontmatter + index + machine-readable map), author the high-traffic spine FROM the source (cited, with freshness stamps), define a coverage contract, and wire validators into the gate — then hand off to maintain-knowledge-base. Use when a repo lacks docs an LLM or new engineer can navigate, or has only scattered/stale README fragments.
---

# Build a knowledge base — the bootstrap

Most codebases have no map: an LLM (or a new engineer) reverse-engineers intent from
source every time. This creates that map from scratch — accurate, navigable, and
machine-readable — and leaves behind the *enforcement* that keeps it honest. It is the
genesis step; once the spine exists, [`maintain-knowledge-base`](../maintain-knowledge-base/SKILL.md)
keeps it fresh. The cardinal rule from the start: **honest ⬜ over fake green** — a small
true KB beats a large hallucinated one.

This KB is the **cold tier** of an agent's memory: the current best practice is "codified
context as infrastructure" — a *hot constitution* (`CLAUDE.md` / `AGENTS.md`), specialized
domain agents, and a durable cold knowledge base. Single-file manifests don't scale past a
modest repo; build the cold tier deliberately and point the hot constitution at it (Phase 5).

> **Kick it off — paste this to your agent:**
> *"Bootstrap a knowledge base using build-knowledge-base: survey, pick the format, author
> the spine from source, generate the map, wire enforcement — gate-green, stop at every ⛔."*

Keep the checklist visible; a phase isn't done until its **Gate** holds. **Write nothing you
didn't read in the code** — every claim cites its source.

## Phase 0 — Survey  (map the territory; write nothing yet)
- Enumerate the *real* structure: build manifests (Cargo/package.json/go.mod…), top-level
  dirs, entry points, the major subsystems, the public API surface, and where decisions live
  (ADRs, design docs, commit history). Note the audience (humans + LLMs) and the **high-traffic
  spine** — the 20% of the system 80% of work touches.
- Don't invent taxonomy from a template; let the codebase's real seams define the sections.
- **Gate:** a one-page inventory — subsystems, entry points, decision sources — and the spine
  identified. If you can't name the spine, you haven't read enough.

## Phase 1 — Choose an enforceable format  ▶ `mirror-reference`
- Pick a doc contract, don't improvise one: **per-doc YAML frontmatter** (type, title, one-line
  description, `source:` path, a `source_sha`/freshness stamp), one concept per file, an
  **index with progressive disclosure** (index → section → doc; follow one branch, stop). Mirror
  a proven model — [Diátaxis](https://diataxis.fr) for doc *types* (explanation vs reference vs
  how-to), an OKF-style markdown+frontmatter bundle for the *shape*, [llms.txt](https://llmstxt.org)
  for the machine map.
- **Separate the substrate from the standard, and don't marry a draft.** Keep the files plain
  markdown + frontmatter so the KB ports trivially if a chosen format stalls or changes (e.g. OKF
  is a v0.1 draft with little adoption — fine to mirror, not to depend on). Near-zero lock-in is a
  feature: pick the format for ergonomics, not as a bet.
- **The format is the cheap part; the moat is enforcement + taxonomy.** What endures is Phase 4's
  enforcement and being *intentional about doc-types* (most codebase KBs are explanation +
  reference — say which, don't drift). A pretty format with no coverage/freshness gate rots; plain
  markdown with one does not.
- Create the skeleton: root index + empty section indexes. Nothing fabricated yet.
- **Gate:** a frontmatter schema + a navigable index skeleton exist, cited to the format you mirrored.

## Phase 2 — Author the spine from source  (cited; don't boil the ocean)
- Write the spine first: an architecture overview, the top subsystems, and the entry points —
  each **authored by reading the actual code**, citing `file:line`, with the freshness stamp set
  to the current source sha. Match the codebase's voice; be concise (a right-sized doc, not padding).
- **Distill the surveys; don't paste them.** Fan-out survey agents return *exhaustive* reports
  (every file, every type) — that's raw material, not the doc. A spine doc is a distillation:
  the flow + the handful of real entry points (cited) + one small table, ~40–80 lines. Pasting a
  200-line agent dump is the failure mode here — resist it.
- **Freshness, concretely.** New repos have no freshness tooling, so stamp it by hand: set
  `source_sha` to the repo's short HEAD (`git rev-parse --short HEAD`) or `git hash-object` of the
  doc's `source:` path, plus a `verified_at` date. That's enough for `maintain-knowledge-base` to
  detect drift later.
- Defer the long tail explicitly as ⬜ planned coverage — a real "not yet" beats a hallucinated
  page.
- **Gate:** the spine is documented from source (every doc cites code + carries a freshness
  stamp); deferred areas are listed as honest gaps, none faked.

## Phase 3 — Machine-readable map  (for LLMs, from day one)
- Generate a `llms.txt`-style entry map **from the docs' frontmatter** (H1 + summary +
  per-section link lists with one-line descriptions; deep/optional reference last). Complete by
  construction — every doc listed.
- **Drop in a generator; don't hand-maintain the map.** Write a tiny ~50-line script that walks
  the KB, reads `title`/`description` from frontmatter, groups by section dir, and supports
  `--check` (fail if stale / a link is missing / a doc is unlisted). Hand-writing the map is a
  Phase-1-only stopgap; a 4-doc KB grows. Keep the generator generic (no hardcoded section list)
  so it survives new sections.
- **Optional: a code-symbol map, not just a doc index.** `llms.txt` maps *prose*; in 2026
  "machine-readable for agents" also means a **code-symbol index** so the KB points agents at
  go-to-def/find-refs over real structure. Add an optional tier — [SCIP](https://sourcegraph.com/blog/announcing-scip)
  (the cross-language successor to LSIF) where a language indexer exists, or a
  [tree-sitter](https://tree-sitter.github.io/tree-sitter/)/ctags symbol index (even a plain
  `ctags -R` stub) when it doesn't. Link it from the index so agents can jump to definitions,
  not just read pages.
- **Keep each doc self-contained.** Agents retrieve *fragments* (RAG), not whole KBs, so each doc
  should stand on its own and fit a context window — one concept, resolvable in isolation. This is
  why [Diátaxis](https://diataxis.fr) separates doc *types*: a reference page shouldn't assume the
  narrative of an explanation page.
- **Gate:** the map regenerates deterministically, lists every doc, and every link resolves.

## Phase 4 — Coverage contract + enforce  ▶ `verify-capability`
- Write down what **must** be covered (each subsystem/module/decision) with explicit, reasoned
  exemptions — and wire it, plus a frontmatter lint and the map check, into the **gate and CI**
  as a runner that **fails loud** on an undocumented unit, a stale doc, or an incomplete map.
  This is what makes the KB survive contact with a moving codebase.
- **Right-size enforcement to your access.** Full CI wiring needs repo ownership + an existing
  gate. When you can't have that yet (a foreign/early repo), the *minimum viable* enforcement is
  the committed `--check` runner + a one-line note in CONTRIBUTING/README telling contributors to
  run it — an honest ⬜ "CI wiring pending" beats pretending a gate exists. Don't let "can't wire
  CI" become "no enforcement at all".
- **Gate:** a deliberately-undocumented unit or a stale edit makes the runner go red — proven,
  then green once fixed (wired into CI where the repo allows; otherwise committed + documented).

## Phase 5 — Integrate + hand off
- Commit through the gate; **rebase, never force-push**; targeted `git add`. Point the repo's
  agent instructions (`CLAUDE.md`/`AGENTS.md`/README) at the new index so it's discoverable.
  Record the deferred coverage as the backlog for [`maintain-knowledge-base`](../maintain-knowledge-base/SKILL.md).
- **Gate:** gate green; the KB is linked from the repo's front door; maintenance owner/cadence noted.

## Done when
A new engineer or LLM can start at one index and navigate the system; the high-traffic spine is
documented **from source** (cited, freshness-stamped), a complete machine-readable map exists, a
coverage contract + freshness + map checks run in the gate and fail loud on regressions, deferred
areas are honest ⬜ gaps (not faked), and `maintain-knowledge-base` can take it from here — all
gate-green, integrated without a force-push.

## How to run it
- **Any harness — drive it manually.** Follow the phases; the agent surveys, picks the format,
  authors the spine from source, generates the map, wires enforcement, integrates — pausing at ⛔.
- **Then maintain.** This builds the substrate; schedule [`maintain-knowledge-base`](../maintain-knowledge-base/SKILL.md)
  to keep it true as the code moves.

## Receipt

Prove the KB exists and is enforceable, not aspirational (see [RECEIPTS.md](../../../RECEIPTS.md)):

```
Claim: a navigable, enforceable knowledge base now exists where there was none
- Format: <frontmatter + index + machine-readable map chosen>
- Spine: <high-traffic docs authored FROM source, cited, freshness-stamped>
- Coverage: <the coverage contract defined — what must be documented>
- Validator: <checks wired into the gate/CI (or an honest MVP --check runner)>
- What's NOT proven: <areas left uncovered / enforcement you couldn't wire yet>
```
