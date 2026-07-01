---
name: research-decision
description: Resolve a product/eng decision you're unsure of by researching it to a depth that MATCHES THE STAKES — cite, recommend, and for anything consequential go deep (primary sources + papers + the canonical references to mirror + a cited rubric, not one search), covering practitioner/deployment/failure lanes and a freshness sweep, with sources graded A–D. Use for "which approach", "how should this UX work", and especially "make X the best it can be" / quality / novel / safety calls.
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

## 2.5 Coverage discipline — do not only research the clean lane
For deep decisions, split research into lanes **before** searching. A deep answer is incomplete if
it only covers the most official, academic, or institutionally clean sources.

| Lane | What to search | Why |
|---|---|---|
| **Primary / official** | Papers, model cards, standards, official docs, release notes | Establish grounded facts and claims. |
| **Practitioner ecosystem** | GitHub, Hugging Face, package registries, benchmark repos, forums, Discord/Reddit if relevant | Find what people are actually using, cloning, quantizing, fine-tuning, or deploying. |
| **Deployment reality** | Runtime docs, hardware requirements, memory/latency benchmarks, production notes | Check whether the recommendation works under real constraints. |
| **Critical / failure evidence** | Issues, eval failures, safety reports, negative reviews, limitations sections | Avoid only collecting success stories. |
| **User-context lane** | The specific terms, tools, stacks, and constraints relevant to *this* product/user | Prevent generic research from missing the actual decision surface. |

If a lane is not applicable, **say why**. Otherwise include at least one finding or note from each.

## 2.6 Fast-moving domain rule
If the domain changes quickly — AI models, devtools, frameworks, security, cloud infra, consumer
hardware, laws, prices, rankings, or active products — the research **must** include a freshness sweep:

- Search **the current year + the topic**.
- Search relevant **artifact hubs directly**, not only the web:
  - *AI/models:* Hugging Face, GitHub, arXiv, official model docs, quant/runtime communities.
  - *Devtools/frameworks:* GitHub, release notes, package registries, docs, issues.
  - *Hardware:* vendor specs, retailer listings, benchmark sites, user reports.
- Search **practitioner names/terms** the user mentions or that are likely ecosystem keywords.
- Include deployment terms when relevant — "latest," "new," "distill," "benchmark," "GGUF," "MLX,"
  "Ollama," "vLLM," "llama.cpp," or the equivalents for the domain.
- **Flag a promising-but-unofficial source as provisional** rather than omitting it.

Don't let "primary sources preferred" become "community evidence ignored."

## 2.7 Omission audit — before writing the recommendation
Run this check; if any answer names a missing artifact/model/product/paper/repo/benchmark, **research
it before finalizing**:

1. What would an **expert in this niche** be annoyed I omitted?
2. What are the current **practitioner favorites** that may not have papers yet?
3. What would **this user** specifically expect me to know, given their stack and goals?
4. What terms did I **not search** because I assumed they were hype, too new, or not canonical?
5. What is the **strongest counterexample** to my recommendation?

## 2.8 Evidence grading
Grade sources explicitly, and use the grade to weight the claim:

- **A — Primary official:** paper, model card, standard, official docs, creator's benchmark report.
- **B — Reproducible artifact:** GitHub repo, HF model card, eval harness, benchmark script, quant release.
- **C — Practitioner signal:** independent benchmark, forum reports, issue threads, deployment writeups.
- **D — Hype / weak signal:** social posts, unsourced claims, leaderboard screenshots, marketing.

Use **A/B for claims**; use C/D only as leads or clearly-labeled ecosystem signal. For fast-moving
domains B/C may be *essential* — include it **with caveats**, don't pretend only A-grade exists.

## 3. Synthesize → recommend
Pull the consensus + the explicit trade-off (tier by size/context when the honest answer is "it
depends"). Apply the product's filter (values, constraints, the real user). End with **one
recommendation + the reasoning**, a clear split of "your call" vs "sound default I'll take", and
**sources as links**.

**Deep decisions must also carry a "miss risk" note** — a short, honest list of what the answer
could still be missing, so the reader can shrink the blind spot (it's a prompt, not an excuse):
new releases after the search window; community artifacts with weak discoverability; private/internal
benchmarks; domain-specific evals not covered by public benchmarks; user-specific constraints not
represented in public sources.

## Anti-patterns (the ones that earn a redo)
- **One narrow search for a "make it the best" / quality / safety question.** The cardinal sin —
  the exact failure this skill exists to stop.
- A recommendation with **no rubric** when the decision was about quality.
- **Secondary-source** stats presented as fact (no primary citation).
- Naming **no reference to mirror** — leaving the builder to design from scratch what's already solved.
- Researching **after** building (post-hoc rationalization) instead of before the fork.
- A survey of options with no recommendation; research that ignores the product's real constraints.
- **Only the clean lane** — official/academic sources, no practitioner/deployment/failure evidence (§2.5).
- **No freshness sweep** in a fast-moving domain; assuming a term was "just hype" without searching it (§2.6).
- **D-grade evidence presented as fact** — a leaderboard screenshot or social post used as an A-grade claim (§2.8).

## Done when (the enforceable gate)
The depth **matches the stakes**. A quick fork has a cited recommendation. A **deep** decision has
**primary sources (incl. papers where they exist) + the canonical references named to mirror + a
cited rubric + a critical alignment audit**, plus: **every coverage lane hit or explicitly N/A'd**
(§2.5), a **freshness sweep** in fast-moving domains (§2.6), the **omission audit** run (§2.7),
**sources graded A–D** with claims resting on A/B (§2.8), and a **miss-risk note** (§3) — capped by
a specific recommendation with "your call" vs "default taken" split out. **If you did one search for
a deep question, or only searched the clean/official lane, you are not done.**

## Receipt

A decision receipt cites and recommends — it has *no* "command ran" or "artifact"; forcing those
would be the fake-green this kit forbids (see [RECEIPTS.md](../../../RECEIPTS.md)):

```
Claim: <the decision, made — not a survey of options>
- Question: <the real fork + the depth it demanded (quick fork / deep)>
- Sources: <cited + graded A–D (papers/standards = A, repos/model cards = B, forum/bench = C) — as links>
- Coverage: <lanes hit or N/A'd (primary · practitioner · deployment · failure · user-context) · freshness swept? · omission audit run?>
- Recommendation: <the one call + reasoning; "your call" vs "default I'll take" split>
- References to mirror: <the canonical impls to build to> · Rubric: <measurable criteria, if deep>
- What's NOT proven (miss-risk): <releases after the search window · low-discoverability artifacts · private benchmarks · user-specific constraints not in public sources>
```
