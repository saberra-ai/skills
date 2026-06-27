---
name: adversarial-harden
description: Break fast-built code on purpose to find REAL bugs (each with a repro or airtight code-path argument), fix forward with a regression test, and pin invariants so they can't silently regress. Use after building risky code — untrusted-input decoders, concurrency, shell-outs, parsers of external/model output.
---

# Adversarial Harden

Fast-built code ships latent bugs. Find the real ones before users (or reviewers) do.

## Rules

- A "bug" needs a **repro** (a failing test you then make pass) or an **airtight code-path
  argument**. No nitpicks, no style — **correctness / safety / data-loss only.** If a suspect
  is actually fine, say *why* and move on (a proven "not reachable, here's the bound" is a
  good outcome — pin it with a guard test).
- **Rank by severity:** panic/crash → OOM/unbounded-alloc → silent-wrong → data-loss first.
- **Fix forward, minimally**, with a regression test that fails before and passes after. Don't
  refactor. **Pin invariants** so a future change can't silently reintroduce the bug — and
  confirm the test has teeth (an injected off-by-one should fail it).

## High-value surfaces to hunt

- **Untrusted-input decoders** (images/audio/files): decompression bombs (a tiny file
  declaring huge dimensions → OOM), truncated/0-byte, wrong-format, traversal paths. Cap
  size/dimensions *before* allocating; map decode errors to graceful failures.
- **Concurrency**: races, double-writers on a shared resource, a second request clobbering the
  first's cancel/registry entry, cancel-hits-wrong-target.
- **Shell-outs**: argument injection (a leading-dash value parsed as a flag), unsanitized
  interpolation, `--` end-of-options guards.
- **Parsers of model/remote output**: panics on malformed/oversized; a grounding invariant a
  crafted input can break.
- **The verification harness itself**: can any test false-pass (metric on empty output, marker
  printed before the assertion)?

## Done when
Each finding is REAL (with repro/path) or CLEARED (with the reason); real ones are fixed
forward with a regression test and a pinned invariant. "Audited N, found M, cleared K" —
don't manufacture findings.
