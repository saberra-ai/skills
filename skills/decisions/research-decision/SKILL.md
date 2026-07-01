---
name: research-decision
description: Resolve a product/eng/UX/model/safety decision by researching it to a depth that MATCHES THE STAKES, as a decision PIPELINE — FORK → LANES → FORAGE → GRADE → RUBRIC → PREMORTEM → RECEIPT — not "go find sources". Cover primary/practitioner/deployment/failure/user lanes (no source monoculture), forage broadly (search + snowball + lateral read + adversarial), grade A–D, synthesize a cited rubric, premortem the omissions, and end with a CALL + a re-check trigger. Use for "which approach", "how should this UX work", "which model", and especially "make X the best it can be" / quality / novel / safety calls.
---

# Research a Decision

The best way to research is **not** "go find sources." It is a decision **pipeline**:

> **FORK → LANES → FORAGE → GRADE → RUBRIC → PREMORTEM → RECEIPT**

Frame the fork → map evidence lanes → forage broadly → grade evidence → synthesize a rubric →
adversarially check omissions → make the call. Don't wing it, don't just survey, and **don't
under-research a high-stakes question with one quick search** — research to a depth that matches
what's riding on it, and **recommend before you build, not after.**

**The one principle that fixes the most common failure: never let source *quality* become source
*monoculture*.** "Prefer primary sources" is right for avoiding hype and dead wrong when it quietly
becomes "official/academic only" — because in fast-moving domains the load-bearing evidence first
appears in model cards, repos, quant releases, issues, benchmark harnesses, and forum consensus. The
failure isn't shallow depth; it's missing **lanes**.

**Methodological foundations** (why this shape): systematic-review rigor — PRISMA 2020 (transparent
identify→screen→include→synthesize), Cochrane Handbook (plan the search, document it), Kitchenham
(plan→conduct→report) — is the anti-bullshit floor, but too slow/academic alone. For fast domains,
**hybrid search beats database-only**: Wohlin's snowballing + later replications found hybrid
(search + snowball from seeds) surfaces more relevant studies. Source-vetting comes from
fact-checkers: Wineburg & McGrew found experts use **lateral reading** + **click restraint** (check
what *other* sources say before trusting a page). The search *strategy* is **information foraging**
(Pirolli & Card): maximize decision-relevant evidence per unit effort; leave a source patch when it
stops yielding. The final call uses **GRADE**'s split — *certainty of evidence* ≠ *strength of
recommendation* (you can recommend strongly on imperfect evidence when the context demands action —
but say so). And before hardening a decision into architecture, run Klein's **premortem**.

## 0. Match depth to stakes (the gate)
Name the axes that actually decide it ("bundle vs fetch" is really "size tier × first-run UX ×
constraints"). Then match depth to stakes — the step most people skip:

| Stakes | Depth REQUIRED (the floor, not the ceiling) |
|---|---|
| **Quick fork** — reversible, low-blast-radius, a known-best exists (e.g. "which test lib") | 2–3 targeted searches → cite → recommend. Still runs the pipeline, lightly. |
| **Deep** — "make X the **best** it can be", a quality bar, a novel/under-explored area, a safety/trust/security call, or anything you'd be embarrassed to get wrong | **The full pipeline below. One search is not research here.** |

> The trap: treating a *deep* question with *quick*-fork effort. "How do we make the UI/UX/agent/model
> the best it can be" is NOT one search — it's the lanes + the references to mirror + a rubric.
> **If you're unsure which tier, it's deep.** Anything "make X best / which architecture / which
> model / is this safe / what's the canonical way" is deep unless clearly reversible.

## 1. FORK — define the decision *before* searching
Write the real decision as a fork (this prevents generic research):

| Field | Example |
|---|---|
| **Decision** | Choose the default local model stack |
| **Options** | Gemma 4, Qwen, DeepSeek-R1, gpt-oss, Fable/Qwable distills |
| **Stakes** | Deep — product quality + trust + hardware constraints |
| **Constraints** | Mac/Framework · Ollama/MLX/GGUF · private-first |
| **Success metric** | Local answer quality, latency, hallucination discipline, agent behavior |
| **Blast radius** | Ships as the default; hard to change once forks depend on it |
| **Expiration** | Re-check in 30–60 days — the model ecosystem moves fast |

**Bad:** "Research local models." **Good:** the fork above.

## 2. LANES — search by evidence lane, not by vibes
Split research into lanes **before** searching. A deep answer is incomplete if it only covers the
official/academic/clean sources. Cover these; if a lane is N/A, **say why**:

| Lane | What to search | What it catches |
|---|---|---|
| **Primary / official** | Papers, model cards, standards, official docs, release notes | Grounded facts and claims |
| **Academic / evaluation** | Independent papers, benchmarks, ablations, systematic reviews | What holds up under test |
| **Practitioner ecosystem** | GitHub, Hugging Face, registries, benchmark repos, forums, Discord/Reddit, quant releases | What people actually use/clone/quantize/deploy |
| **Deployment reality** | Runtime docs, hardware/memory/latency tables (llama.cpp/MLX/Ollama/vLLM), pricing, ops notes | Whether it works under real constraints |
| **Critical / failure** | Issues, negative evals, safety/hallucination reports, limitations sections, bad reviews | The bad news you'd otherwise miss |
| **User-context** | The exact product, stack, vocabulary, and constraints of *this* decision | Stops generic research missing the real surface |

## 3. FORAGE — hybrid search, three passes (search + snowball + lateral + adversarial)
Don't rely on one search style. Optimize decision-relevant evidence per unit effort, and **move on
from a source patch once it stops yielding** (information foraging):

- **Pass A — broad:** obvious queries, **current-year** queries, official docs, artifact hubs
  *directly* (HF/GitHub/arXiv/registries), not only the open web.
- **Pass B — snowball:** follow references, citations, model-card **base models**, eval repos, forks,
  quantizers — forward *and* backward from the canonical seeds.
- **Pass C — adversarial:** search `limitations`, `failure`, `benchmark issue`, `hallucination`,
  `criticism`, `not good`, `license`, `provenance`, `security` — the terms that surface the bad news.
- **Lateral-read unfamiliar sources:** before trusting a page/benchmark/model card, check what *other*
  sources say about it (click restraint). Don't let one page become the whole truth.
- **Fast-moving domain?** (AI models, devtools, frameworks, security, cloud, consumer hardware, laws,
  prices, rankings, active products) — the freshness sweep is **mandatory**: current-year + the
  practitioner terms the user uses + deployment terms (`GGUF`, `MLX`, `Ollama`, `vLLM`, `distill`,
  `benchmark`). **Flag a promising-but-unofficial find as provisional** rather than omitting it.

Don't let "primary sources preferred" become "community evidence ignored."

## 4. GRADE — classify every claim A–D
Grade sources explicitly and let the grade weight the claim:

- **A — Primary official:** paper, standard, official model card, official docs, creator's benchmark.
- **B — Reproducible artifact:** repo, benchmark harness, dataset, model card, quant release.
- **C — Practitioner signal:** independent benchmark, issue thread, deployment writeup, forum consensus.
- **D — Weak signal:** social post, unsourced claim, marketing copy, leaderboard screenshot.

Use **A/B for claims**; use **C/D as leads or clearly-labeled** weak evidence. **Do NOT omit B/C just
because it lacks a paper** — in fast-moving domains important truth appears first in artifacts.
(AI-assisted research adds a hazard: LLMs fabricate plausible citations/claims — keep source
verification in the loop; never ship model-generated synthesis untraced.)

## 5. RUBRIC — turn evidence into measurable criteria + name what to mirror
A deep answer doesn't just say "X is best." It produces a **scored rubric** you can re-test later.
Each criterion must be **observable**, **relevant to the user's constraints**, **tied to ≥1 source or
an explicit assumption**, and **re-testable**. Example:

| Criterion | Weight | Evidence |
|---|---:|---|
| Quality on the target task | 30% | Benchmarks + a local eval |
| Deployment fit | 20% | VRAM/UMA/runtime support |
| Reliability / safety | 20% | Hallucination + instruction-following tests |
| Ecosystem maturity | 15% | Docs, quants, community usage |
| License / provenance | 10% | Official license + data caveats |
| Future optionality | 5% | Roadmap, architecture compatibility |

And **name the canonical references to MIRROR** (hand to `mirror-reference`): best product to mirror ·
best implementation to inspect (repo:file) · best paper/model/standard to anchor on · best **negative**
example to avoid. A decision that doesn't name what to build *to* isn't finished.

## 6. PREMORTEM — assume the recommendation is wrong; find why (before it hardens)
Klein's premortem, run *before* finalizing — research anything material it surfaces:

1. What would a **domain expert** be annoyed I omitted?
2. What's the most important thing that has **no paper yet** — the practitioner favorite?
3. What are practitioners **actually using**?
4. What would **invalidate** my recommendation (the strongest counterexample)?
5. What did I **not search** because it sounded too niche, too new, or too hype?
6. Does the **user's actual stack** change the answer?
7. What would make this recommendation **wrong in 30 days**?

## 7. Synthesize → the CALL (not a survey)
Also do a **critical alignment audit**: map findings back to the actual code/product — what already
aligns, what's at *risk*, where it would *violate* the research (include the bad news). Let grounding
correct the literature (verify its specifics against the real source; say where it was off).

End with **one recommendation + reasoning**, a clear **"your call" vs "sound default I'll take"** split,
sources as links, and a **miss-risk** note: what the answer could still be missing (releases after the
search window; low-discoverability community artifacts; private/internal benchmarks; evals not covered
by public benchmarks; user-specific constraints not in public sources). Don't end neutral unless the
correct call is genuinely "don't decide yet."

## Anti-patterns (the ones that earn a redo)
- **One narrow search for a "make it the best" / quality / safety question.** The cardinal sin.
- **Source monoculture** — official/academic only; no practitioner/deployment/failure lane (§2).
- A recommendation with **no rubric** when the decision was about quality (§5).
- Naming **no reference to mirror** — leaving the builder to design from scratch what's already solved.
- **Secondary-source** stats as fact; **D-grade** evidence presented as an A-grade claim (§4).
- **No freshness sweep / no snowball / no lateral read** in a fast-moving domain (§3).
- Researching **after** building; a survey with **no call**; **no re-check trigger** on a decision
  with an expiration date.

## Done when (the enforceable gate)
The depth **matches the stakes**. A quick fork has a cited recommendation. A **deep** decision has run
the whole pipeline: **FORK** (framed with an expiration) · **LANES** (every lane hit or explicitly
N/A'd — no monoculture) · **FORAGE** (search + snowball + lateral read + adversarial; freshness swept
in fast domains) · **GRADE** (A–D, claims on A/B) · **RUBRIC** (cited, measurable) + references to
mirror + a critical alignment audit · **PREMORTEM** (omission audit run) · **RECEIPT** (a call, with
"your call" vs "default", a miss-risk note, and a re-check trigger). **If you did one search for a deep
question, or only searched the clean/official lane, you are not done.**

## Receipt

A decision receipt cites and recommends — it has *no* "command ran" or "artifact"; forcing those would
be the fake-green this kit forbids (see [RECEIPTS.md](../../../RECEIPTS.md)):

```
Claim: <the decision, made — not a survey of options>
- Question: <the real fork + the depth it demanded (quick fork / deep)>
- Sources: <cited + graded A–D (papers/standards = A, repos/model cards = B, forum/bench = C) — as links>
- Coverage: <lanes hit or N/A'd (primary · practitioner · deployment · failure · user-context) · freshness swept? · snowball + lateral read done? · omission audit / premortem run?>
- Recommendation: <the one call + reasoning; "your call" vs "default I'll take" split>
- References to mirror: <the canonical impls to build to> · Rubric: <measurable criteria, if deep>
- What's NOT proven (miss-risk): <releases after the search window · low-discoverability artifacts · private benchmarks · user-specific constraints not in public sources>
- Re-check trigger: <the date or event that expires this decision — required in fast-moving domains>
```
