---
name: maintain-knowledge-base
description: Keep a docs/knowledge base accurate, complete, navigable, and machine-readable the honest way — audit with the validators, re-verify drifted docs against current source before refreshing freshness (never blind-bump a sha), fill real coverage gaps from source, regenerate the machine-readable map, and enforce it so it can't silently rot. Use to deepen or routinely maintain a knowledge base for humans and LLMs; run it on a schedule, not just once.
---

# Maintain a knowledge base — the deepening loop

A knowledge base's value decays silently: code moves, docs drift, and "green" tooling
keeps passing because nothing checks the docs against reality. This is the bookend to
`ship-feature` for **documentation** — it keeps a KB true to the code and legible to both
humans and LLMs, **without faking freshness**. Run it regularly; drift is continuous, so
the durable win is *enforcement*, not a one-time cleanup.

> **Kick it off — paste this to your agent:**
> *"Maintain the knowledge base using maintain-knowledge-base: audit, honest drift-refresh,
> fill real gaps, regenerate the map, enforce it — gate-green, and stop at every ⛔."*

Keep the checklist visible. A phase isn't done until its **Gate** holds. The cardinal rule,
everywhere: **honest ⬜ over fake green** — never silence a check without making the thing it
checks actually true.

## Phase 0 — Audit  (measure before you touch)
- Run every validator the KB has *first*: conformance/lint, a **coverage** contract (is every
  module/unit documented?), a **freshness/drift** check (does each doc still match the source it
  describes?), and a **map completeness** check if one exists. Record counts: errors, warnings,
  stale, uncovered.
- No validators yet? That's the first gap — note it; Phase 4 adds enforcement.
- **Gate:** a concrete list of what's broken — drifted docs (with their sources), coverage gaps,
  map staleness — not a vibe.

## Phase 1 — Honest drift-refresh  ▶ (fan out for breadth)
- For each drifted doc, **re-read the current source and verify the doc's claims** — structure,
  named APIs, behavior, counts. Dispatch parallel read-only audits (one per doc) for breadth;
  each returns ACCURATE or a concrete discrepancy list with `file:line`.
- Apply the content fixes. **Only then** refresh the freshness stamp (`source_sha`/`verified_at`
  or equivalent). **Never bump a sha to silence a staleness warning without re-verifying** — a
  blind bump is a lie that says "someone checked this" when no one did.
- **Gate:** every drifted doc is either updated-and-refreshed (after real verification) or
  flagged with a specific reason it can't be — zero blind sha bumps.

## Phase 2 — Fill real coverage gaps  (from source, cited)
- For each genuinely-undocumented unit, **author the doc from the actual source** (read it; cite
  paths/`file:line`), with the KB's required frontmatter, and **register it in the index** so it's
  reachable. Mirror an existing good doc's shape.
- **Do not pad.** A concise-complete doc for a small unit is correct; length is not coverage.
  Adding words to clear a size heuristic is fake value — leave well-sized docs alone.
- **Gate:** the coverage contract is satisfied by real, source-grounded docs — not stubs, not padding.

## Phase 3 — Machine-readable map  (for LLMs)
- Maintain a generated entry map (e.g. an [`llms.txt`](https://llmstxt.org): H1 + summary +
  per-section link lists with one-line descriptions; deep reference under `## Optional`).
  **Generate it from each doc's frontmatter** so it can't be hand-drifted, and make it
  **complete** — every doc listed, nothing hidden from an LLM reading only the map.
- **Gate:** the map regenerates deterministically, every link resolves, and every KB doc appears.

## Phase 4 — Enforce  (so it can't rot)  ▶ `verify-capability`
- Wire the Phase 0 validators + the map check into the **gate and CI** as a runner that **fails
  loud** on drift, a missing/incomplete map, or a broken link — the doc equivalent of "green ≠
  verified". Cross-links: only add links whose **targets you existence-checked**.
- During active development drift is a *treadmill*; enforcement is what makes new drift visible
  immediately instead of accumulating.
- **Gate:** a fresh drift/incompleteness fails the gate — proven by the check going red on a
  deliberate stale edit, then green once fixed.

## Phase 5 — Integrate
- Commit through the doc gate; **rebase onto upstream, never force-push**; reconcile parallel
  edits by merge, not clobber; targeted `git add`. Summarize what changed (refreshed N, covered
  M, enforced K).
- **Gate:** gate green on the integration branch; nothing else's work clobbered.

## Receipts
Distilled from a real KB-deepening pass (Pio's `knowledge-base/`): an audit surfaced 11 stale
docs + 2 uncovered modules; parallel re-verification corrected real content (not sha-bumps) to
reach **0 errors / 0 warnings**; a generated `llms.txt` map with a completeness validator was
wired into the gate; and "thin" docs were left concise rather than padded. Honest refresh +
enforcement is the whole game.

## How to run it
- **Any harness — drive it manually.** Follow the phases; the agent audits, refreshes honestly,
  fills gaps, regenerates the map, enforces, and integrates — pausing at each ⛔.
- **On a schedule.** Re-run periodically (drift is continuous). With enforcement wired in
  (Phase 4), most runs should be quick: the gate already caught the drift.

## Done when
Every drifted doc has been re-verified against current source and refreshed (zero blind sha
bumps), every real coverage gap is filled with a source-grounded doc (and none padded), the
machine-readable map regenerates complete with all links resolving, those checks are wired into
the gate/CI and proven to fail loud on fresh drift, and the change is integrated gate-green
without a force-push — the validators report zero errors and zero unexplained warnings.
