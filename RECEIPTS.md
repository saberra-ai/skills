# Receipts — the proof every skill leaves behind

Coding agents are too good at saying *"done."* This kit makes them return a **receipt** instead:
a small, typed, copy-pasteable block that states what was actually done, on what real basis, and
— the part that matters most — **what is still NOT proven.**

A receipt is not a status line. It's the artifact a reviewer can audit without trusting the agent.

## The generic schema (six roles)

Every receipt answers the same six questions. The *labels* differ per skill (below), but each maps
to one of these roles:

| Role | The question it answers |
|---|---|
| **Claim** | What are you asserting is true? |
| **Real basis** | What real input / reference / sources / install did it run against? |
| **What ran** | What command or action was actually executed? |
| **Result observed** | What was measured — not "it ran"? |
| **Artifact** | What inspectable thing did it leave behind? |
| **What's NOT proven** | The honest gap — what's skipped, faked, or unverified, and why. |

## Typed per skill — never one flat template

The cardinal rule: **a receipt's fields are typed to what that skill actually produces.** A
[`research-decision`](skills/decisions/research-decision/SKILL.md) receipt has *no* "command run"
— it cites sources and recommends. A [`verify-capability`](skills/engineering/verify-capability/SKILL.md)
receipt *does* — a real dependency on a fixed input with a metric. Stamping one generic template on
every skill would force hollow `Command run: N/A` fields — which is exactly the **fake-green** this
kit exists to kill (*honest ⬜ over fake green*).

So each skill instantiates the schema with its own labels:

| Skill | Required receipt fields (beyond the universals) |
|---|---|
| [`verify-capability`](skills/engineering/verify-capability/SKILL.md) | Claim · Real input · Metric · Artifact |
| [`mirror-reference`](skills/engineering/mirror-reference/SKILL.md) | Claim · Reference · Citations · Parity |
| [`adversarial-harden`](skills/engineering/adversarial-harden/SKILL.md) | Claim · Surface · Audited · Regression |
| [`research-decision`](skills/decisions/research-decision/SKILL.md) | Claim · Question · Sources · Recommendation |
| [`ship-feature`](skills/orchestration/ship-feature/SKILL.md) | Claim · Built · Verified · Hardened · Integrated |
| [`maintain-skills`](skills/orchestration/maintain-skills/SKILL.md) | Claim · Version · Migrations · Re-verify |
| [`build-knowledge-base`](skills/orchestration/build-knowledge-base/SKILL.md) | Claim · Format · Spine · Coverage · Validator |
| [`maintain-knowledge-base`](skills/orchestration/maintain-knowledge-base/SKILL.md) | Claim · Audited · Drift · Map |

## Two invariants every receipt holds

No matter the skill:

1. **A fenced, copy-pasteable template** — so the next agent fills it in, doesn't reinvent it.
2. **An explicit honest-gap line** (`What's NOT proven` / `Known gap` / `⬜`). A receipt with no
   gap is lying by omission — there is always something not proven. When a gap is non-obvious,
   **triage it inline** — *verifiable here? · cost to close · what it blocks* — so the reader (or
   the next slice) can act on it instead of re-deriving it. A gap that's cheap and verifiable-here
   is a to-do, not a deferral; say which.

## Enforced, not suggested

This isn't a style guide. [`scripts/validate.mjs`](scripts/validate.mjs) checks **every** `SKILL.md`
for a `## Receipt` section, its fenced template, its honest-gap line, and the typed fields its class
owes — and `npm test` injects receipt-broken fixtures (missing section, missing gap, missing field)
and **fails loud** if any slips through. A skill that ships without a valid receipt fails CI. The
kit holds itself to the bar it preaches: it leaves a receipt for its own receipts.
