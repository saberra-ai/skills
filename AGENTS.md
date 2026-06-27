# Build Doctrine (any agent, any harness)

How to build well with AI agents, in eight agreements. Read this first; it overrides
generic defaults. (Harness-agnostic: Claude reads `CLAUDE.md`, others read `AGENTS.md` —
point yours here or copy these in.)

## 1. Mirror a reference, don't guess
For a non-trivial build (model port, hard algorithm, UX surface), **find the canonical
open-source implementation, clone it, read the actual code, and build to it** — citing its
`file:line` in your code. Parity-check (numeric for ported math, behavioral for UX). Keep a
**reference registry** in your repo: which OSS project is canon for which subsystem.

## 2. Green ≠ verified
A passing suite does not mean a capability works. A capability is verified only when its
**real model/dependency runs on a real input and produces a measured, inspectable result**.
Run it through a runner that **fails loud if a capability could pass by skipping** (e.g. its
model is present but its test was a no-op). That "no silent skip" rule is the whole game.

## 3. Honest gap over fake green
If something can't be verified without faking it (needs a live account, a remote, infra you
don't have), **mark it an explicit gap with the reason** — never weaken a test or fabricate
a pass. A documented ⬜ beats a green that lied.

## 4. Research, cite, recommend — when unsure, don't wing it
For decisions you're not sure of, **web-search the current best practice, cite it, and give
a recommendation** (not a survey). Ground UX in how the best apps actually do it. Name what's
the user's call vs a sound default you'll take.

## 5. Integrate safely on a shared, moving branch
Work on a branch/worktree; **rebase onto the upstream, never force-push** over others' work;
**run the gate before every push**. Reconcile parallel work by cherry-picking + resolving,
not clobbering. Use targeted `git add`, not `git add -A` (it sweeps stray files).

## 6. Adversarial hardening, repro required
Harden fast-built code by trying to break it — feed adversarial/malformed/oversized inputs,
find REAL bugs (each with a repro or an airtight code-path argument), **fix forward with a
regression test, and pin invariants** so they can't silently regress. Correctness / safety /
data-loss only — no nitpicks. A proven "not reachable, here's the bound + a guard test" is a
good outcome.

## 7. Product UX: outcome-first, non-technical-first
Users experience **outcomes, not implementation** ("hear a reply", "see an image") — hide
jargon (model names, quant, flags) behind one recommended choice + an "Advanced" reveal.
Just-in-time, contextual unlocks; "set up once → it's just there"; honest sizes + privacy.

## 8. Orchestrate in parallel, integrate carefully
For breadth, **fan out disjoint subagent tracks**, then integrate one at a time with the
gate. When tracks are coupled, define a shared **contract** up front so they build to the
same shape. Verify the seam, not just the parts.

## 9. Ship a maintenance lifecycle, not just an install
Shipping a thing users *install* means owning its upgrade path, not just its first run. Carry a
`VERSION` + `CHANGELOG` so "what changed" is answerable. Make upgrades **reversible** (back up →
act → restore on failure) and **detect the actual install state** before touching it — never
assume topology. Evolve user-carried state with **idempotent, done-marked migrations that
retry on incomplete**: a migration writes its done-marker only when every repair succeeded or
was provably unnecessary — otherwise it stays unmarked and retries next upgrade (that's *green ≠
verified* in the upgrade domain). **Re-verify after upgrading** — a green update that can't pass
its own runner isn't a successful update. And maintenance **never auto-commits**; the user
controls when changes ship.

---

**The substrate that makes this enforceable:** rules + skills encode intent; a verification
runner + CI + e2e make it *self-checking*, so quality doesn't depend on the agent's goodwill.
Most teams stop at intent. Build the substrate.
