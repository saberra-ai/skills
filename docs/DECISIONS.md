# Skills-kit decision-validation catalog

A `research-decision` pass (the kit's own pipeline — FORK → LANES → FORAGE → GRADE →
PREMORTEM → RECEIPT) run over **every skill**, one deep evaluation each, to answer: *are this
skill's design decisions the best they can be, and what's missing?* Verdicts are **Keep** (ship
as-is), **Keep-with-tweak** (right decision, land the listed tweak), or **Rework**. Every listed
tweak was **applied in v1.0.0**; each is a small, cited, additive edit — no skill was rewritten.

Pass date: 2026-07-01. Sources graded A–D (A = paper/standard/official docs; B = repo/harness; C =
practitioner report; D = weak signal). Claims rest on A/B.

## Cross-cutting finding

**No Reworks — the kit's classical rigor is best-in-class and its citations hold up** (e.g.
`adversarial-harden`'s ~15 technique anchors all verify; the design skills track **INP, not FID** —
the exact thing that rots most UI rubrics). The *consistent* gap was the **2026 agent-era +
supply-chain + reversibility frontier**: several skills nailed the classical bar and stopped just
short of it. v1.0.0 closes those edges:

- **Untrusted model input** — `adversarial-harden` had no prompt-injection rung despite targeting "model output."
- **Supply-chain trust** — `maintain-skills` / `mirror-reference` had no provenance/license gate.
- **Wired ≠ verified, and flake** — `verify-capability` proved the capability but not that prod reaches it, or that green is stable.
- **Code-intelligence maps** — `build-knowledge-base` treated "machine-readable" as prose-only.
- **Reversibility / observe** — `ship-feature` stopped at merge.

---

## Per-skill

### `research-decision` — Keep (restructured this release)
Rebuilt into an explicit pipeline (**FORK → LANES → FORAGE → GRADE → RUBRIC → PREMORTEM → RECEIPT**),
core principle *never let source quality become source monoculture*. Grounded in PRISMA 2020 /
Cochrane / Kitchenham (rigor) · Wohlin (snowballing & hybrid > DB-only) · Wineburg & McGrew (lateral
reading) · Pirolli & Card (information foraging) · GRADE (certainty ≠ strength) · Klein (premortem).
*Self-audited — lower confidence; residual: no quantitative "enough sources" stop rule (foraging
move-on is qualitative).* **[A]**

### `design-interface` — Keep-with-tweak → **applied**
Every headline number verified against the primary source (INP ≤200ms / LCP ≤2.5s / CLS ≤0.1 =
current CWV "good"; contrast 4.5:1/3:1, reflow@320, 200% resize = WCAG 2.2 AA). The one under-reach:
target size cited only the **WCAG 2.5.8 accessibility floor (24px)**, not the platform product bar.
**Tweak landed:** target size now reads "≥24px (WCAG floor) — prefer **44pt (Apple HIG) / 48dp
(Material 3)**"; added a mobile touch-target line + a `<~300ms` motion ceiling. **[A]** —
[web.dev/vitals](https://web.dev/articles/vitals) · [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) · [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/) · [Material 3](https://m3.material.io/).

### `design-review` — **Keep (clean)**
No change required — already current: uses INP (not the retired FID), WCAG 2.2 SC 2.5.8, correct CWV
thresholds, and correctly makes the judgment pass non-skippable (axe catches only ~40–57% of WCAG
issues). **[A]** — [web.dev: INP replaced FID](https://web.dev/blog/inp-cwv-march-12) · [Deque axe-core](https://www.deque.com/axe/axe-core/) · [NN/g heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).

### `adversarial-harden` — Keep-with-tweak → **applied**
Classical A0–A6 ladder is best-in-class; all ~15 anchors (QuickCheck, AFL++, ASan/UBSan, mutation
testing, Csmith, loom/CDSChecker, STRIDE) verified with zero mis-cites. Gap: model output was only
fuzzed for panics. **Tweak landed:** new **A7 model-adversarial rung** (prompt-injection / jailbreak,
anchored to [OWASP LLM Top 10](https://genai.owasp.org/llm-top-10/), tools garak/PyRIT/promptfoo
provisional); **structure-aware fuzzing** in A2 ([rust-fuzz book](https://rust-fuzz.github.io/book/cargo-fuzz/structure-aware-fuzzing.html)); **Shuttle** beside loom in A5. **[A/B]**

### `mirror-reference` — Keep-with-tweak → **applied**
Core discipline (clone + read the real code, cite `file:line`, differential parity-check) matches the
oracle-testing literature. Two holes: no check the reference is *itself current/correct* (forks
propagate since-fixed bugs), and no license gate. **Tweaks landed:** a "vet the reference (canonical
**and** healthy)" step + a "no canonical reference exists" branch; a **license/provenance gate** in
Done-when (SPDX compat + attribution). **[A/B]** — [Ray et al., FSE 2012 (fork defect propagation)](http://web.cs.ucla.edu/~miryung/Publications/fse2012-porting.pdf) · [SPDX](https://spdx.dev) · [REUSE](https://reuse.software).

### `verify-capability` — Keep-with-tweak → **applied**
Thesis ("green ≠ verified") is A-grade (Inozemtseva & Holmes ICSE 2014; Just et al. FSE 2014). Two
open holes: **flake** (retried-into-green) and **wired ≠ verified** (capability green in a captest but
never reached in prod). **Tweaks landed:** a **flake rung** (fail loud, never silent-retry; quarantine
with a deadline), a **"verified ≠ wired"** rung (confirm the prod call-path reaches it), and
**mutation score** named as the metric green can't fake. **[A/B]** — Just et al. FSE 2014 · [Google: Taming Google-Scale Continuous Testing](https://research.google/pubs/pub45794/) · Fowler, Feature Toggles.

### `build-knowledge-base` — Keep-with-tweak → **applied**
Central bets (author-from-source over generated, enforcement as the moat, freshness stamps) are on the
right side of the 2026 evidence (auto-generated context files *underperform no file*). Gap:
"machine-readable" was prose-only. **Tweak landed:** an optional **code-symbol-map tier** ([SCIP](https://sourcegraph.com/blog/announcing-scip)
/ tree-sitter/ctags) for agent go-to-def/find-refs, + a "docs self-contained for RAG retrieval"
clause. **[A/B]** — InfoQ/AGENTbench (auto-gen underperforms) · [Diátaxis](https://diataxis.fr).

### `maintain-knowledge-base` — Keep-with-tweak → **applied**
Anti-blind-bump / re-verify-before-refresh is *directly endorsed* by the drift literature. Missing:
mechanical drift help, a coverage ratchet, ownership. **Tweaks landed:** a **semantic drift check**
(LCEF-filtered — raw LLM detection flags ~98% at ~14% accuracy; complements, never replaces the human
re-verify), a **coverage regression ratchet** (fail on drop vs base), and **ownership routing**
(CODEOWNERS + two dates: git-modified vs manually-reviewed). **[A/B]** — [deep-JIT inconsistency (AAAI 2021)](https://github.com/panthap2/deep-jit-inconsistency-detection) · SWE at Google Ch.10.

### `maintain-skills` — Keep-with-tweak → **applied**
Backup → mutate → restore-on-failure + idempotent migrations + validator re-verify is best-in-class;
the real miss was **no content-authorship verification when updating from a remote** (trusts whatever
the branch serves). **Tweaks landed:** **provenance first** (pin to an immutable SHA in the manifest
and/or verify a signed tag — provenance proves custody not benign code, so the validator still runs),
a **diff-review-before-overwrite** ⛔ gate, and a **same-named-foreign-skill collision** check. **[A]**
— [git signing](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work) · [SLSA](https://slsa.dev) · [npm provenance](https://docs.npmjs.com/generating-provenance-statements).

### `ship-feature` — Keep-with-tweak → **applied**
The build → verify → harden → integrate phase-gate spine is canonical (Stage-Gate; "All Green, Still
Broken" backs the distinct verify phase). It stopped at merge though its Done-when says "won't silently
break." **Tweaks landed:** a **reversibility gate** in Integrate (kill-switch / rehearsed revert;
gates can Kill/Hold, not only proceed), a light **Phase 5 — Observe** (name the prod signal + rollback
trigger), and **`--force-with-lease`** named as the safer force-push. **[A]** — [DORA](https://dora.dev/) · [Google SRE: Canarying Releases](https://sre.google/workbook/canarying-releases/) · [Pro Git](https://git-scm.com/docs/git-push).

---

## Miss-risk (this catalog)

- Evaluations are against public best-practice literature + a read of each SKILL.md, **not** a trial
  run of each skill on a real task — hands-on use may surface friction the docs hide.
- Several 2026 anchors (semantic-drift preprints, agent-context studies) are recent and **B-grade**;
  the *direction* is solid, exact metrics may shift. Re-check on a ~60–90 day cadence for the
  fast-moving items (LLM-adversarial tooling, drift-detection SOTA).
- `research-decision`'s own entry is a **self-audit** (lower confidence by construction).
