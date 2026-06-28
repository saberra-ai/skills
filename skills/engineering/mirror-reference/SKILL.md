---
name: mirror-reference
description: Build a non-trivial feature (model port, hard algorithm, UX surface) by mirroring the canonical open-source implementation instead of guessing — clone it, read it, build to it citing file:line, and parity-check. Use whenever you'd otherwise design from scratch something a mature OSS project already solved.
---

# Mirror a Reference

The highest-leverage build habit: **translate a proven implementation; don't reinvent it.**
Guessing reproduces a problem's bugs without its fixes; mirroring a battle-tested reference
gets you most of the way for free, and a parity check tells you exactly how far.

## Steps

1. **Find the canon.** Check your repo's reference registry (keep one: a doc mapping
   subsystem → the OSS repo you mirror). If none exists for this problem, **web-search** the
   best-in-class OSS implementation — the one the ecosystem already trusts — and add a row.
2. **Clone + read it.** `git clone --depth 1 <repo> ~/workspace/<name>`. Read the *actual
   code* for the specific component — not the README. Map every piece you'll build to its
   reference `file:line`.
3. **Build to it.** Implement your version mirroring the reference's structure, adapting to
   your stack/types/conventions. **Cite the reference `file:line` in code comments** — the
   citation is the audit trail.
4. **Parity-check.**
   - *Ported math:* dump the reference's intermediate values for a fixed input and assert
     `max|Δ| < tol` per stage. Use *relative* error for low-precision/quantized paths.
   - *Behavior/UX:* match the reference's observable contract; verify the seam, not just parts.
5. **Document divergence.** Where you intentionally differ, say why in a comment + the commit.
   A silent divergence is a latent bug.

## Anti-patterns
- Designing a hard algorithm from first principles when a canon exists.
- A `file:line` citation with no parity check — a guess wearing a citation.
- Cloning the README's mental model instead of reading the code.

## Done when
The code mirrors the reference with cited `file:line`, a parity result (number or behavioral
assertion) is recorded, and any divergence is documented.

## Receipt

Prove you mirrored, didn't guess (see [RECEIPTS.md](../../../RECEIPTS.md)):

```
Claim: <feature> built by mirroring a proven reference, not from first principles
- Reference: <repo@sha you cloned and actually read>
- Citations: <file:line cites in your code mapping each piece to the reference>
- Parity: <max|Δ| < tol per stage, or the behavioral-contract match>
- What's NOT proven: <documented intentional divergences / paths not parity-checked>
```
