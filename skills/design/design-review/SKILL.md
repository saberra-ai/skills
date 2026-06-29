---
name: design-review
description: Audit an existing web UI for near-native quality — run the mechanical checks (axe, Core Web Vitals, motion/focus lints, AI-slop greps), then a judgment pass (hierarchy, restraint, feel), rank by severity, and fix forward with before/after proof. Use when an interface already exists and you want to find and fix what makes it feel AI-generated or web-laggy, rather than rebuild it.
---

# Review an Interface (near-native)

The bookend to [`design-interface`](../design-interface/SKILL.md): that one *builds*, this one
*diagnoses an existing UI and fixes forward*. Separate skill because the proof differs — review owes
**diagnosed defects + measured before/after**, not a from-scratch token system. Lead with the
mechanical checks (objective, fast), then spend judgment where no tool can.

## Steps

1. **Capture the real rendered UI.** Name the route/component and get it on screen (a screenshot is
   the artifact you'll diff against). Review the *running* page, not the source's mental model.
2. **Run the mechanical pass — objective findings first:**
   - **a11y**: [`axe`](https://github.com/dequelabs/axe-core) / [Lighthouse](https://developer.chrome.com/docs/lighthouse/accessibility/scoring) → `violations[]`.
   - **Perceived perf**: [Core Web Vitals](https://web.dev/articles/vitals) — INP, LCP, CLS (Lighthouse/CrUX); long tasks >50ms, non-composited animations ([web.dev](https://web.dev/articles/rendering-performance)).
   - **Contrast**: compute ratios — flag <4.5:1 text, <3:1 UI ([WCAG 1.4.3/1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)).
   - **Motion/native lints** (grep/AST): linear/`ease` instead of springs; animating `width`/`top`/`margin`; missing `:focus-visible`, `prefers-reduced-motion`, `touch-action: manipulation`, `overscroll-behavior`; `framer-motion` import instead of `motion/react`.
   - **AI-slop greps**: `indigo-[456]00`, `from-*-500 to-purple-600`, `Inter`/`system-ui` display font, emoji in `<h*>`, default-unmodified shadcn tokens, centered hero + `grid-cols-3` of identical cards.
3. **Judgment pass — where no tool reaches:** visual hierarchy (is the one important thing dominant?),
   restraint (boldness spent in one place, not five), typographic scale discipline, spatial/motion
   *feel*, distinctiveness vs the [AI median](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website). Score against [Refactoring UI](https://refactoringui.com/) + [Nielsen's heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).
4. **Rank by severity:** broken a11y / unreadable contrast → web-jank (INP, layout shift, non-composited
   motion) → slop tells → polish. Each finding is **REAL** (with the failing measurement/selector) or
   **CLEARED** (with the reason) — no taste-as-fact nitpicks.
5. **Fix forward, minimally, then re-verify.** Fix the REAL ones; don't rebuild. Re-run the mechanical
   pass and capture a **before/after** (CWV numbers + screenshot). A fix you didn't re-measure isn't fixed.

## What to check (the rubric, condensed)

Same bar as [`design-interface`](../design-interface/SKILL.md): INP ≤200ms · LCP ≤2.5s · CLS ≤0.1 ·
frame ≤16ms (composited motion only) · contrast ≥4.5:1 / ≥3:1 · target ≥24×24px · axe `== []` ·
springs not easing · `:focus-visible` + reduced-motion honored. Judgment: hierarchy, restraint, feel.

## Anti-patterns (of the reviewer)

- **Taste-as-fact** — "I'd make it blue" with no rubric or measurement behind it. Cite the bar or drop it.
- **Rebuilding instead of fixing** — this is a diagnose-and-repair pass, not a greenfield (that's
  [`design-interface`](../design-interface/SKILL.md)).
- **Reporting without re-measuring** — claiming a contrast/INP fix without the after-number.
- **Stopping at the mechanical pass** — green axe + good CWV can still look AI-generated; the judgment
  pass is mandatory.

## Done when

Every finding is REAL (with a measurement/selector) or CLEARED (with a reason); REAL ones are fixed
forward and re-measured, with a before/after artifact (CWV + screenshot) — "audited N, fixed M,
cleared K", no manufactured nitpicks, and an honest gap on anything judged but not measurable.

## Receipt

Prove the defects were real and the fixes measured (see [RECEIPTS.md](../../../RECEIPTS.md)):

```
Claim: <UI> reviewed for near-native quality — real defects fixed and re-measured, not nitpicked
- Surface: <the route/component audited, as rendered>
- Audited: <N findings — a11y / perf(CWV) / motion / slop — each REAL (with measurement) or CLEARED>
- Fixed: <M fixed forward + re-measured; K cleared with reason>
- Artifact: <before/after — CWV numbers + screenshots>
- What's NOT proven: <judgment items with no metric (feel/hierarchy) · anything not re-measured>
```
