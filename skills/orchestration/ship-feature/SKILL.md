---
name: ship-feature
description: The front-door workflow for shipping a substantial feature the disciplined way — drives build → verify → harden as gated phases that hand off to the mirror-reference, verify-capability, adversarial-harden, and research-decision skills, with safe integration onto a shared branch. Use to kick off any non-trivial feature, solo or fanned out across subagents.
---

# Ship a Feature — the workflow

This is the **entry point**. The other skills are the stations; this drives them in order with
a gate between, so "I built something" becomes "I shipped something that works and won't break."

> **Kick it off — paste this to your agent:**
> *"Ship `<feature>` using ship-feature: run build → verify → harden with the gate at each
> phase, and stop for my input at every ⛔."*

The agent then runs the phases below, keeping the checklist visible. Don't skip a gate — a phase
isn't done until its **Gate** holds. Each ▶ hands off to a station skill (or its matching
subagent for a parallel track).

## Phase 0 — Frame  (≤5 min)
- State the outcome in one sentence and the **one** observable that proves it works — the thing
  Phase 2 will measure. Can't name it? You're not ready to build.
- Unsure of a fork (which approach, bundle-vs-fetch, what UX)? ⛔ **stop and run
  ▶ `research-decision`** — cite, recommend, proceed. Don't guess past a fork.
- **Match research depth to stakes.** A reversible fork = a cited search. But a **"make it the
  best" / quality / novel / safety** call demands the **deep bar**: primary sources (papers, not
  just blogs) + the canonical references named to mirror + a **cited rubric** — *not one search*.
  Under-researching a high-stakes question is the same failure as not researching it.
- **Can you verify it *here*?** Name what Phase 2 will need — the build surface that must compile,
  a display / toolchain / credential / running service the captest depends on — and confirm it
  *before* building, not after. A feature you can't close out in this environment isn't framed:
  either get the environment (fetch the resource, install the tool, copy the fixture) or scope to
  the hermetic slice you *can* verify here + an explicit ⛔ for the rest. Don't discover the wall
  mid-build, and don't declare ⛔ on a wall you haven't actually hit (try the unblock first).
- **Gate:** outcome + success-metric named; open forks resolved or explicitly deferred; the
  verification environment confirmed (or the unverifiable part scoped to an explicit ⛔); and any
  research done hit the depth its stakes demanded (deep → primary sources + references + rubric,
  per `research-decision`'s Done-when). A deep question answered with one search ⛔ does not pass.

## Phase 1 — Build  ▶ `mirror-reference`  (subagent: `reference-builder`)
- Find the canon (a reference registry, else search best-in-class OSS), **clone it, read the
  actual code**, build to it **citing `file:line`** in your code.
- Parity-check: numeric `max|Δ| < tol` for ported math, observable-contract match for UX.
- **Gate:** builds, cited to a real reference, parity number recorded. A citation without a
  parity check is a guess wearing a citation — and so is a citation from memory or from a prior
  research doc. Phase 0 *naming* the reference is not Phase 1: open the actual file and cite the
  line you read. (Real bite: the `reference-builder` has caught a `file:line` that named the right
  repo but a sentence that **does not exist in the source** — only opening the file surfaces that.)

## Phase 2 — Verify  ▶ `verify-capability`  (subagent: `capability-verifier`)
- Land a test that drives the **real dependency on a committed fixed input**, asserts the
  **objective metric** from Phase 0, emits an **inspectable artifact**, behind a runner that
  **fails loud on a silent skip**. Green ≠ verified.
- Can't verify without faking (live account/remote/infra)? Leave an **explicit gap with the
  reason** — never weaken a test to make it green.
- **Verified ≠ wired.** A captest that stands up its own harness proves the capability *works* —
  not that the *product* invokes it. Check the real call path actually reaches it: drive the
  capability through the production seam, or at least assert the prod code constructs/calls it on a
  user path. A capability that's green in a captest but fed `None` / never-invoked in production is
  **inert** — record that as an explicit ⬜ "*built, not yet wired in production*"; do **not** bank
  it as shipped. (This was the single most common rot in practice: typed-but-`None`-advertised
  data, captest-only stores/handshakes with no production instantiation, crypto with no transport.)
- **Gate:** the success-metric is asserted by a runner that would fail on a silent skip, **and**
  either the production call path is shown to reach the capability or a "built-but-inert" ⬜ is
  recorded — or an honest ⬜ verification gap is recorded with why.

## Phase 3 — Harden  ▶ `adversarial-harden`  (subagent: `hardener`)
- Only on risky surfaces (untrusted-input decoders, concurrency, shell-outs, parsers of
  external/model output). Break it on purpose: malformed / oversized / adversarial inputs.
- Each finding **REAL** (repro or airtight code-path argument) or **CLEARED** (with the reason).
  Fix REAL ones forward, minimally, with a regression test; **pin invariants** (confirm the test
  has teeth). Correctness / safety / data-loss only.
- **Gate:** "audited N, found M, fixed M with regression tests, cleared K" — no manufactured
  findings, no known REAL bug left unfixed.

## Phase 4 — Integrate
- Branch/worktree; **rebase onto upstream, never force-push**; **run the gate before every
  push**; reconcile parallel work by cherry-pick + resolve, not clobber. Targeted `git add`,
  not `-A`.
- **Run the docs/freshness gate too, not just code.** Code you shipped is the *source* a KB doc
  tracks — a slice that skips the doc gate silently re-stales the docs, and across many slices the
  drift compounds invisibly. If a freshness/coverage gate exists, run it each push; reach for the
  `maintain-knowledge-base` bookend when it goes red (re-verify the doc against source, never
  blind-bump a sha).
- **Gate:** code gate **and** docs/freshness gate green on the integration branch; nothing else's
  work clobbered.

## Two ways to run it
- **Any harness — drive it manually.** Follow the phases above; the agent invokes each station
  skill / subagent at the ▶ and pauses at each ⛔. No runtime needed.
- **Claude Code — one command.** [`workflows/ship-feature.mjs`](../../../workflows/ship-feature.mjs)
  codifies this exact pipeline as a runnable [dynamic workflow](https://code.claude.com/docs/en/workflows):
  it fans out `reference-builder` → `capability-verifier` → `hardener` across the phases so you
  can read and rerun the orchestration. Run it with the feature as the arg.

## Fanning out (for breadth)
Disjoint slices → parallel subagent tracks (`reference-builder` / `capability-verifier` /
`hardener`), integrated **one at a time** through Phase 4's gate. When tracks are coupled,
**define a shared contract up front** (an interface/hook shape) so they build to the same thing —
then verify the seam, not just the parts.

## Progress checklist (the agent keeps this visible)
```
[ ] 0 Framed      — outcome + metric named, forks resolved, verifiable-here confirmed
[ ] 1 Built       — cited reference <repo:file> (file opened, not recalled), parity <Δ/contract>
[ ] 2 Verified    — metric asserted + artifact, runner can't be fooled, reachable on the prod path   (or ⬜ gap / ⬜ built-but-inert: …)
[ ] 3 Hardened    — audited N, fixed M, cleared K, invariants pinned
[ ] 4 Integrated  — code + docs gate green, rebased not force-pushed
```

## Done when
Built from a cited reference, verified by a runner that can't be fooled, hardened with repro'd
fixes (or a documented honest gap), and integrated without a force-push — gate green at every
phase, and the checklist above is fully ticked.

## Receipt

The composite — each phase's station leaves its own receipt; this rolls them up (see
[RECEIPTS.md](../../../RECEIPTS.md)):

```
Claim: <feature> shipped — works on a real input, is reachable in the product, won't silently break
- Built: <cited reference repo:file (opened) · parity Δ/contract>    (mirror-reference)
- Verified: <metric asserted by a runner that fails on silent skip · artifact · reached on the prod call path>   (or ⬜ gap / ⬜ built-but-inert)
- Hardened: <audited N · fixed M w/ regression · cleared K>          (or ⬜ n/a — low-risk surface)
- Integrated: <code + docs gate green on the branch · rebased, not force-pushed>
- What's NOT proven: <honest ⬜ gaps carried from any phase — incl. anything built but not yet wired in production>
```
