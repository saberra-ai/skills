---
name: research-decision
description: Resolve a product/eng decision you're unsure of by researching it to a depth that MATCHES THE STAKES — cite, recommend, and for anything consequential go deep (primary sources + papers + the canonical references to mirror + a cited rubric, not one search). Use for "which approach", "how should this UX work", and especially "make X the best it can be" / quality / novel / safety calls.
---

# Research a Decision

Don't wing it, don't just survey, and **don't under-research a high-stakes question with one
quick search.** Research it to a depth that matches what's riding on it, cite primary sources,
and **recommend** — *before* you build, not after.

## 1. Frame the real question + pick the depth
Name the axes that actually decide it ("bundle vs fetch" is really "size tier × first-run UX ×
constraints"). Then **match depth to stakes** — the step most people skip:

| Stakes | Depth REQUIRED (the floor, not the ceiling) |
|---|---|
| **Quick fork** — reversible, low-blast-radius, a known-best exists (e.g. "which test lib") | 2–3 targeted web searches → cite → recommend. |
| **Deep** — "make X the **best** it can be", a quality bar, a novel/under-explored area, a safety/trust/security call, or anything you'd be embarrassed to get wrong | **The deep bar below. One search is not research here.** |

> The trap: treating a *deep* question with *quick*-fork effort. "How do we make the UI/UX/agent
> the best it can be" is NOT one search — it's the literature + the references to mirror + a
> rubric. **If you're unsure which tier, it's deep.**

## 2. The deep bar — what "thorough" means (enforced in Done-when)
For a deep decision you must produce ALL of:

- **Primary sources, not just blog posts.** The actual standards, the actual **research papers**
  (name authors, venue, year; link the arXiv/DOI), the official guidelines — not a second-hand
  summary. Flag any stat you couldn't trace to a primary source as unverified.
- **The canonical references to MIRROR.** Name the best-in-class implementations/products for
  *this* problem and say which to clone-and-read (hand to `mirror-reference`). A decision that
  doesn't name what to build *to* isn't finished.
- **Breadth — cover the angles, in parallel when you can.** A consequential question has
  sub-dimensions (e.g. UI vs UX vs capability; correctness vs safety vs latency). Research each;
  one lens misses what the others catch. **Fan out** subagents rather than serial-skimming one.
- **A cited rubric, not just a recommendation.** Distill findings into measurable criteria, each
  tied to its source — "what good looks like", scored toward best. A recommendation tells you what
  to do once; a rubric lets you *check* it now and *re-check* it later.
- **A critical alignment audit.** Map findings back to the actual code/product: what already
  aligns, what's at *risk*, where it would violate the research. Include the bad news.
- **Let grounding correct the research.** The literature is often wrong on specifics — verify its
  claims against the real source/code and say where it was off. Primary sources over confident prose.

## 3. Synthesize → recommend
Pull the consensus + the explicit trade-off (tier by size/context when the honest answer is "it
depends"). Apply the product's filter (values, constraints, the real user). End with **one
recommendation + the reasoning**, a clear split of "your call" vs "sound default I'll take", and
**sources as links**.

## Anti-patterns (the ones that earn a redo)
- **One narrow search for a "make it the best" / quality / safety question.** The cardinal sin —
  the exact failure this skill exists to stop.
- A recommendation with **no rubric** when the decision was about quality.
- **Secondary-source** stats presented as fact (no primary citation).
- Naming **no reference to mirror** — leaving the builder to design from scratch what's already solved.
- Researching **after** building (post-hoc rationalization) instead of before the fork.
- A survey of options with no recommendation; research that ignores the product's real constraints.

## Done when (the enforceable gate)
The depth **matches the stakes**. A quick fork has a cited recommendation. A **deep** decision has
**primary sources (incl. papers where they exist) + the canonical references named to mirror + a
cited rubric + a critical alignment audit** — plus a specific recommendation with "your call" vs
"default taken" split out. **If you did one search for a deep question, you are not done.**
