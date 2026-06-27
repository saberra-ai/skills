---
name: ship-feature
description: Ship a feature the disciplined way — mirror a reference to build it, prove it (green ≠ verified), then adversarially harden it — with safe integration onto a shared branch. Use to structure a substantial feature, solo or fanned out across subagents.
---

# Ship a Feature (build → verify → harden)

The pipeline that turns "I built something" into "I shipped something that works and won't
break". Composes the other skills.

## The pipeline

1. **Build — [mirror-reference](../engineering/mirror-reference/SKILL.md).** Find the canon,
   clone it, build to it citing `file:line`, parity-check. Don't design from scratch what a
   mature project solved.
2. **Verify — [verify-capability](../engineering/verify-capability/SKILL.md).** Land a real-
   dependency test with an objective metric + inspectable artifact, behind a runner that fails
   loud on silent skips. Green ≠ verified.
3. **Harden — [adversarial-harden](../engineering/adversarial-harden/SKILL.md).** Break it on
   purpose; fix the real bugs forward with regression tests; pin invariants.
4. **Integrate safely.** Branch/worktree; **rebase onto upstream, never force-push**; run the
   gate before every push; reconcile parallel work by cherry-pick + resolve. Targeted
   `git add`, not `-A`.

## Fanning out (for breadth)

Run disjoint slices as parallel subagent tracks (see the `reference-builder`,
`capability-verifier`, `hardener` agents), then integrate one at a time with the gate. When
tracks are coupled, **define a shared contract up front** (e.g. an interface/hook shape) so
they build to the same thing; verify the seam, not just the parts.

## When unsure

Hit a product/eng decision mid-build? Stop and run
[research-decision](../decisions/research-decision/SKILL.md) — cite, recommend, proceed. Don't
guess your way through a fork.

## Done when
The feature is built from a cited reference, verified by a runner that can't be fooled,
hardened with repro'd fixes, and integrated without a force-push — gate green at every step.
