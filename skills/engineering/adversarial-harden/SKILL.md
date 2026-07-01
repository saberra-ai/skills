---
name: adversarial-harden
description: Break fast-built code on purpose to find REAL bugs (each with a repro or airtight code-path argument), fix forward with a regression test, and pin invariants so they can't silently regress. Use after building risky code — untrusted-input decoders, concurrency, shell-outs, parsers of external/model output.
---

# Adversarial Harden

Fast-built code ships latent bugs. Find the real ones before users (or reviewers) do — and don't
stop at the inputs *you* thought of. The bugs that survive review are the ones no human enumerated:
**generate beyond imagination, get an oracle when you have none, and prove your tests have teeth.**

## Rules

- A "bug" needs a **repro** (a failing test you then make pass) or an **airtight code-path
  argument**. No nitpicks, no style — **correctness / safety / data-loss only.** If a suspect
  is actually fine, say *why* and move on (a proven "not reachable, here's the bound" is a
  good outcome — pin it with a guard test).
- **Rank by severity:** panic/crash → OOM/unbounded-alloc → silent-wrong → data-loss first.
- **Fix forward, minimally**, with a regression test that fails before and passes after. Don't
  refactor. **Pin invariants** so a future change can't silently reintroduce the bug.

## The ladder — escalate past hand-fed inputs

Hand-picked inputs only cover what you imagined. Each rung answers a question the others can't;
reach for the ones your surface owes (right column) — don't run all of them on everything.

| Rung | Technique — the question it answers | Owe it when… |
|---|---|---|
| **A0 Taxonomy** | Hand-feed a *named* class list, not ad hoc (checklist below) | always — the systematic manual floor |
| **A1 Property** | Generate inputs + assert an **invariant**, auto-**shrink** to a minimal case (proptest / Hypothesis) | any pure fn / parser / round-trip (`decode(encode x)==x`), algebraic law |
| **A2 Fuzz** | **Coverage-guided fuzzing with a sanitizer on** — crashes/UB, no oracle (cargo-fuzz + ASan/UBSan); go **structure-aware** (libprotobuf-mutator / `arbitrary`-derive, [rust-fuzz book](https://rust-fuzz.github.io/book/cargo-fuzz/structure-aware-fuzzing.html)) so inputs survive the parser's validity gate | untrusted-input decoders (image/audio/file/proto) |
| **A3 Oracle** | **Differential** (two impls must agree) or **metamorphic** (a relation over related runs) | no known-correct answer — codecs, ranking, ML, numerics; or you mirrored a reference (old-vs-new) |
| **A4 Mutation** | **Inject a fault; a surviving mutant is a missing assertion** (cargo-mutants / PIT / Stryker) | the rigorous form of *green ≠ verified* — run on any critical module |
| **A5 Interleave** | **Exhaustive interleavings + race/UB detectors** (loom, TSan; [Shuttle](https://github.com/awslabs/shuttle) randomizes past loom's exhaustive limit for large state); stateful PBT for op *sequences* | shared-state concurrency; storage/pools (open→write→close→reopen, recycled-handle) |
| **A6 Threats** | **Enumerate per trust boundary** (STRIDE / attack trees) — find *missing controls* | any auth / IPC / privilege boundary |
| **A7 Model-adversarial** | **Attack the model surface itself** — prompt-injection / jailbreak / adversarial-prompt over the durable [OWASP LLM Top 10](https://genai.owasp.org/llm-top-10/); tools garak / PyRIT / promptfoo (provisional) | any parser/agent driven by model output — LLM tool-calls, RAG, model-as-judge |

A1 + A4 are CI-cheap and broadly apply. A2/A5 are heavier — **gate them to their surfaces**. A6 is
design-time (judgment, not compute): it *produces* the threats the other rungs then test — its
signature finds are the ones no input fuzzer reaches (an absent audit-log = Repudiation; an authZ
check on the wrong side of the boundary = Elevation of privilege).

## A0 — the adversarial-input checklist (the manual floor)

For every untrusted input, hand-feed each class — happy-path tests skip them all:
- **Boundary**: empty / 1 / N−1 / N / N+1 / `INT_MAX|MIN`; the `<` vs `<=` edge.
- **Encoding/Unicode**: NFC≠NFD, homoglyphs, **overlong UTF-8** (`../` as `C0 9C`) — validator and consumer disagree on a second byte-spelling of the same char.
- **Resource exhaustion**: zip / XML bomb (billion laughs), **ReDoS** (`(a+)+$`), quadratic blowup — probe the size→cost curve, not just small inputs.
- **Injection**: SQL / shell / path metacharacters; leading-dash value parsed as a flag; `--` end-of-options.
- **Time**: clock skew (negative elapsed), leap second (`23:59:60`), **TOCTOU** (check → swap → use).
- **Ordering**: interleaved writers, out-of-order delivery, concurrent create-on-same-key.

## High-value surfaces

- **Untrusted-input decoders**: decompression bombs (tiny file, huge declared dims → OOM),
  truncated / 0-byte, wrong-format, traversal. Cap size/dims *before* allocating. → A2.
- **Concurrency**: races, double-writers, a second request clobbering the first's cancel/registry
  entry, wrong-target cancel. A green stress-test ≠ no race. → A5.
- **Shell-outs**: argument injection (leading-dash value parsed as a flag), unsanitized
  interpolation, `--` guards. → A0 / A6.
- **Parsers of model/remote output**: panics on malformed/oversized; a grounding invariant a
  crafted input breaks; the model itself as adversary (prompt-injection / jailbreak). → A1 / A2 / A7.
- **The verification harness itself**: can any test false-pass (metric on empty output, marker
  printed before the assertion)? → A4.

## Done when
Every finding is REAL (with repro/path) or CLEARED (with the reason); real ones fixed forward with a
regression test and a pinned invariant **with teeth** — an injected off-by-one, *or a surviving
mutant*, must fail it. The surface's owed rungs ran, or their absence is an honest ⬜. "Audited N,
found M, cleared K" — don't manufacture findings.

## Receipt

Account for what you broke and what you couldn't (see [RECEIPTS.md](../../../RECEIPTS.md)):

```
Claim: <risky surface> hardened — real bugs fixed, no findings manufactured
- Surface: <what was attacked — decoder / concurrency / shell-out / parser / boundary>
- Methods: <rungs run — A0 taxonomy · A1 proptest · A2 fuzz+ASan · A4 cargo-mutants · A6 STRIDE · …>
- Audited: <N audited · M REAL fixed · K cleared (each with its reason)>
- Regression: <test that fails before / passes after; teeth confirmed (off-by-one or surviving mutant fails it)>
- What's NOT proven: <rungs the surface owed but didn't run / surfaces not yet fuzzed / residual risk>
```
