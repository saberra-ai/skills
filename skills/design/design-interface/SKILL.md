---
name: design-interface
description: Build a web interface at near-native quality — mirror a canonical reference (shadcn/Radix/Refactoring UI), commit to an explicit token system, animate with interruptible springs, stay responsive (reflow to 320px, fluid type), and hit measurable bars (INP ≤200ms, contrast ≥4.5:1, axe clean) before calling it done. Use when building a new screen, page, or component and you want it to feel like a native app across phone/tablet/desktop, not a generic AI-generated page.
---

# Design a Near-Native Interface

Most agent-built UI looks AI-generated (the statistical median of scraped Tailwind tutorials) and
*feels* like a web page, not an app. This skill fixes both: **ground the look in a canonical
reference, and ground the feel in measurable near-native bars** — don't design from the training
median, and don't ship web-jank.

## Steps

1. **Frame the brief — one subject, one job, one audience.** Name the single most important action
   on the screen. Generic input → generic output; specificity is the escape. Don't start from a
   template ("hero → 3 feature cards → CTA").
2. **Mirror a reference, don't guess** (▶ [`mirror-reference`](../../engineering/mirror-reference/SKILL.md)).
   Pick from [`references.md`](../../../references.md): structure + variants from
   [shadcn/ui](https://github.com/shadcn-ui/ui); accessible behavior (focus, ARIA, keyboard) from
   [Radix](https://github.com/radix-ui/primitives) / [React Aria](https://react-spectrum.adobe.com/react-aria/)
   — never hand-roll these; design judgment from [Refactoring UI](https://refactoringui.com/). Cite
   what you mirrored.
3. **Commit to an explicit token system** — the anti-slop move. Define *named* values, not defaults:
   4–6 hex colors (one dominant + one sharp accent, **not** `indigo-500→purple-600`); a non-default
   display font (not `Inter`/`system-ui`); a fixed type scale with weight extremes (100/200 vs
   800/900, 3×+ size jumps); one spacing scale (4/8px base); body 15–25px at 45–90 char measure
   ([Refactoring UI](https://refactoringui.com/), [Butterick](https://practicaltypography.com/)).
4. **Build for near-native feel:**
   - **Motion = interruptible springs**, not `ease`/linear; import `motion/react`
     ([Emil Kowalski](https://emilkowal.ski/ui/great-animations), [motion.dev](https://motion.dev/docs/spring)).
     Animate **`transform`/`opacity` only** (composited). Asymmetric timing — fast in (~0.1s), soft
     out (~0.15s) ([Linear](https://performance.dev/how-is-linear-so-fast-a-technical-breakdown)); keep
     UI transitions **<~300ms** ([Emil Kowalski](https://emilkowal.ski/ui/the-blur-up-technique), [animations.dev](https://animations.dev/)).
   - **Hide latency**: optimistic updates ([`useOptimistic`](https://react.dev/reference/react/useOptimistic)),
     prefetch on hover, skeleton (known layout) over spinner.
   - **Native details**: `touch-action: manipulation` (kill 300ms tap delay), `:focus-visible` (not
     bare `:focus`), `@media (prefers-reduced-motion: reduce)`, `overscroll-behavior`. Optional
     shared-element [View Transitions](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
     (progressive-enhance — cross-document is Chromium-only).
   - **Adapt to the device** (native apps reshape per screen — a web app must too): mobile-first;
     fluid type/space with [`clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) (max a
     relative unit **≥2× the min** so 200% zoom still works); component-level
     [`@container`](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
     queries over viewport-only media queries; [`dvh`/`svh`](https://web.dev/blog/viewport-units) not
     `100vh` (mobile browser chrome obscures `100vh`); `env(safe-area-inset-*)` + `viewport-fit=cover`
     for notches/home-indicator; never lock orientation. Size primary touch targets to the platform
     product bar — **44pt** ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility#Buttons-and-controls))
     / **48dp** ([Material 3](https://m3.material.io/foundations/designing/structure#dab862b1-e042-4c40-b680-b484b9f077f6)),
     not just the WCAG 24px floor. It must **reflow to 320px CSS width with no
     two-dimensional scrolling** ([WCAG 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)).
5. **Critique against the generic, then measure** (▶ [`verify-capability`](../../engineering/verify-capability/SKILL.md)).
   Reject any part that matches the default you'd produce for *any* similar prompt. Then assert the
   measurable bars below and capture a **screenshot artifact** — metrics pass on ugly; a human glance catches it.

## The near-native bar (measurable — assert these)

| Property | Bar | Source |
|---|---|---|
| Interaction latency (INP) | **≤200ms** | [web.dev/vitals](https://web.dev/articles/vitals) |
| LCP / CLS | ≤2.5s / ≤0.1 | web.dev |
| Frame budget | ≤16ms; no long task >50ms; `transform`/`opacity` only | [web.dev](https://web.dev/articles/rendering-performance) |
| Text / UI contrast | **≥4.5:1** / ≥3:1 | [WCAG 1.4.3/1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) |
| Target size | ≥24×24px (WCAG 2.5.8 floor) — prefer **44pt** ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility#Buttons-and-controls)) / **48dp** ([Material 3](https://m3.material.io/foundations/designing/structure#dab862b1-e042-4c40-b680-b484b9f077f6)) for primary touch targets | [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) |
| a11y violations | `axe` `== []` | [axe-core](https://github.com/dequelabs/axe-core) |
| Scale discipline | type/space values ∈ the defined scale | [Refactoring UI](https://refactoringui.com/) |
| **Reflow** | usable at **320px** width, no 2-D scroll | [WCAG 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) |
| **Resize text** | to **200%**, no clipping (`clamp()` max ≥2× min) | [WCAG 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) |
| **Orientation** | not locked unless essential | [WCAG 1.3.4](https://www.w3.org/WAI/WCAG22/Understanding/orientation.html) |

**Judgment layer (artifact + your eye, no threshold):** hierarchy, restraint ("spend boldness in
one place"), whether motion *feels* right, distinctiveness vs the AI median.

## Anti-patterns (the slop + jank tells)

- `indigo-500`/`from-*-500 to-purple-600` gradients; `Inter`/`system-ui` as a display face; emoji in
  headings; centered hero + identical 3-col card grid; default unmodified shadcn; cards-inside-cards.
- Linear/`ease` motion; animating `width`/`top`/`margin`; scattered animation everywhere; 300ms tap
  delay; focus ring on mouse click; ignoring `prefers-reduced-motion`.
- `100vh` on mobile (use `dvh`); `vw`-locked font-size (breaks 200% zoom); viewport-only breakpoints
  where a `@container` query belongs; fixed-width layout that 2-D-scrolls at 320px; locking orientation.
- Hand-rolling a Dialog/Popover/Tabs instead of mirroring Radix (re-inventing solved a11y).

## Done when

Built from a cited reference with an explicit (non-default) token system, motion is interruptible
springs on composited properties, and the measurable bars hold (INP ≤200ms, contrast ≥4.5:1, axe
clean) with a screenshot artifact — or an honest gap on anything not measured.

## Receipt

Prove it's near-native, not just "looks fine" (see [RECEIPTS.md](../../../RECEIPTS.md)):

```
Claim: <screen/component> built to near-native quality from a cited reference, not the AI median
- Reference: <what you mirrored — shadcn@sha / Radix / Refactoring UI rules / motion>
- Tokens: <the explicit system — named hex (dominant+accent), display font, type+space scale>
- Checks: <measured bars — INP <Xms · LCP <Xs · CLS <X · contrast ≥4.5:1 · axe==[] · motion=spring · reflow@320px no h-scroll · text@200%>
- Artifact: <path to screenshots at phone/tablet/desktop widths (+ Lighthouse/CWV report)>
- What's NOT proven: <the "feels native" verdict (needs your eye) · View Transitions cross-doc = Chromium-only>
```
