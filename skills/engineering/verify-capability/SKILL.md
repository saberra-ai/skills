---
name: verify-capability
description: Prove a capability actually works — a real dependency on a real input with an objective metric and an inspectable artifact, behind a runner that fails loud if a capability could pass by skipping. Use when adding or auditing a capability, or whenever tempted to call something "done" because the suite is green.
---

# Verify a Capability (green ≠ verified)

A passing test suite does **not** mean a capability works. Capability tests are often
*skip-if-missing* — they return early when the model/dependency isn't present, so a green
"all passed" silently includes things that never ran. A capability is verified only when its
**real dependency runs on a real input and produces a measured, inspectable result.**

## The ladder

S (compiles + units) → SS (runs with the **real dependency**, not a stub) → SSS (asserts an
**objective metric**) → SSS+ (emits an **inspectable artifact**) → SSS++ (**parity** vs a
reference where one exists) → **SSS+++ (a runner fails loud on silent skips, reproducible
fixed inputs)**.

## Steps

1. **Write an end-to-end test** that drives the capability's **public API** on a *committed
   fixed input*, with the real dependency — not a mock. Gate it so the default fast suite
   skips it, but a verification runner can invoke it with the dependency present.
2. **Assert an objective metric** (output contains expected content; a ranking/ordering holds;
   a similarity/IoU/SNR/error threshold). Not "it ran".
3. **Emit an inspectable artifact** (image/audio/text/vector) to a known dir — metrics pass on
   garbage; a human glance catches it.
4. **Build the runner that can't be fooled.** A script that, per capability, checks the
   dependency's presence and **fails if the dependency is present but the test skipped** (the
   silent-skip rot). Make it the single source of the capability matrix.
5. **Sandboxed fixtures for side-effecting capabilities** (network, files, shells, external
   APIs): exercise the **real code path against a sandbox with zero real-world effect** (a
   loopback server, a stub connector, a tempdir, a fixed clock) — or a **recorded cassette**
   replayed through the real parser. State explicitly which layer is real vs recorded.
6. **When it can't be verified without faking** (live account/remote/infra), leave an
   **explicit gap with the reason**. Never weaken a test to make a run pass.

## Done when
The capability has a real-dependency test with an objective metric + artifact, the runner
reports it green and would fail it on a silent skip, and the matrix states the grade — or an
honest gap with the reason.

## Receipt

Leave this so the capability is *proven*, not asserted (see [RECEIPTS.md](../../../RECEIPTS.md)):

```
Capability: <what now works>
- Claim: the capability works on a real input with its real dependency
- Real input: <committed fixed input> + <the real dependency that ran, not a stub>
- Metric: <the objective assertion that held — threshold / ordering / contains>
- Artifact: <path to the inspectable output — image / text / vector / report>
- What ran: <the verification runner command>
- What's NOT proven: <honest gap — what was skipped or faked, and why>
```
