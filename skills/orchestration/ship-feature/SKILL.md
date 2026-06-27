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
- **Gate:** outcome + success-metric named; open forks resolved or explicitly deferred.

## Phase 1 — Build  ▶ `mirror-reference`  (subagent: `reference-builder`)
- Find the canon (a reference registry, else search best-in-class OSS), **clone it, read the
  actual code**, build to it **citing `file:line`** in your code.
- Parity-check: numeric `max|Δ| < tol` for ported math, observable-contract match for UX.
- **Gate:** builds, cited to a real reference, parity number recorded. A citation without a
  parity check is a guess wearing a citation — don't pass this gate on one.

## Phase 2 — Verify  ▶ `verify-capability`  (subagent: `capability-verifier`)
- Land a test that drives the **real dependency on a committed fixed input**, asserts the
  **objective metric** from Phase 0, emits an **inspectable artifact**, behind a runner that
  **fails loud on a silent skip**. Green ≠ verified.
- Can't verify without faking (live account/remote/infra)? Leave an **explicit gap with the
  reason** — never weaken a test to make it green.
- **Gate:** the success-metric is asserted by a runner that would fail on a silent skip — or an
  honest ⬜ gap is recorded with why.

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
- **Gate:** gate green on the integration branch; nothing else's work clobbered.

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
[ ] 0 Framed      — outcome + success-metric named, forks resolved
[ ] 1 Built       — cited reference <repo:file>, parity <Δ/contract>
[ ] 2 Verified    — metric asserted + artifact, runner can't be fooled   (or ⬜ gap: …)
[ ] 3 Hardened    — audited N, fixed M, cleared K, invariants pinned
[ ] 4 Integrated  — gate green, rebased not force-pushed
```

## Done when
Built from a cited reference, verified by a runner that can't be fooled, hardened with repro'd
fixes (or a documented honest gap), and integrated without a force-push — gate green at every
phase, and the checklist above is fully ticked.
