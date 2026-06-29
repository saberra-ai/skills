# Reference registry

The canon to **mirror** (clone, read, build to — see [`mirror-reference`](skills/engineering/mirror-reference/SKILL.md)),
mapped `subsystem → reference`. **code** = mirror file:line; **judgment** = apply as rules, don't copy.

## Web UI / near-native frontend

| Subsystem | Reference | Mirror it FOR | Type |
|---|---|---|---|
| `ui/components` | [shadcn/ui](https://github.com/shadcn-ui/ui) | component structure, CVA variants, token theming | code |
| `ui/primitives` | [Radix Primitives](https://github.com/radix-ui/primitives) · [React Aria](https://react-spectrum.adobe.com/react-aria/) | accessible behavior — focus, ARIA, keyboard, i18n | code |
| `ui/motion` | [motion](https://motion.dev/docs/spring) (`motion/react`) | interruptible spring motion, velocity inheritance | code |
| `ui/gesture` | [vaul](https://github.com/emilkowalski/vaul) · [cmdk](https://github.com/pacocoursey/cmdk) · sonner | drag/pull-to-dismiss · ⌘K menu · toast | code |
| `ui/transitions` | [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) | shared-element morphs (cross-doc = Chromium-only) | API |
| `ui/design-judgment` | [Refactoring UI](https://refactoringui.com/) · [Butterick](https://practicaltypography.com/) | hierarchy, type/space scale, color restraint | judgment |
| `ui/motion-doctrine` | [Emil Kowalski](https://emilkowal.ski/ui/great-animations) · [Rauno Freiberg](https://rauno.me/craft/interaction-design) | when/why motion feels native | judgment |
| `ui/perf` | [Linear breakdown](https://performance.dev/how-is-linear-so-fast-a-technical-breakdown) · [web.dev Vitals](https://web.dev/articles/vitals) | local-first, granular re-render, INP/LCP/CLS bars | judgment |
| `ui/aesthetic-exemplar` | Linear · Stripe · Vercel | density / spacing / restraint exemplars | judgment |

Used by [`design-interface`](skills/design/design-interface/SKILL.md) and [`design-review`](skills/design/design-review/SKILL.md).
Add a row when you mirror something new — a decision that names no reference to build *to* isn't finished.
