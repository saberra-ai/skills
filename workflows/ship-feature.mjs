// Runnable orchestrator for the ship-feature workflow — the build → verify → harden
// pipeline codified as a Claude Code dynamic workflow so you can read and rerun it.
// Docs: https://code.claude.com/docs/en/workflows
//
// Run it with the feature description as the arg, e.g. via the Workflow tool:
//   Workflow({ scriptPath: "workflows/ship-feature.mjs", args: "dark-mode toggle" })
// Each phase hands off to the matching subagent from this repo's agents/ (install them
// as subagents first). Mirrors the station skills: mirror-reference → verify-capability →
// adversarial-harden, with a gate (the schema'd report) between phases.

export const meta = {
  name: 'ship-feature',
  description: 'Build → verify → harden a feature, fanning out to the reference-builder, capability-verifier, and hardener subagents with a gate between phases.',
  phases: [
    { title: 'Frame', detail: 'name the outcome + the one success metric; flag forks; confirm verifiable here' },
    { title: 'Build', detail: 'mirror a canonical reference, cite file:line (file opened, not recalled), parity-check' },
    { title: 'Verify', detail: 'real dependency on a fixed input, objective metric, no silent skip, reachable on the prod path' },
    { title: 'Harden', detail: 'adversarial inputs → REAL/CLEARED, fix forward + pin invariants' },
    { title: 'Integrate', detail: 'rebase not force-push; code + docs gate before push (human-gated)' },
  ],
}

// `args` is the feature: a string, or { feature, reference } for an explicit canon.
const feature = (typeof args === 'string' ? args : args?.feature) || 'the requested feature';
const reference = (args && typeof args === 'object' ? args.reference : null) || null;

const FRAME_SCHEMA = {
  type: 'object',
  required: ['outcome', 'successMetric', 'forks'],
  properties: {
    outcome: { type: 'string', description: 'one-sentence outcome' },
    successMetric: { type: 'string', description: 'the ONE observable that proves it works — what Verify will assert' },
    forks: { type: 'array', items: { type: 'string' }, description: 'unsure product/eng decisions to resolve before building' },
  },
  additionalProperties: true,
};

// Phase 0 — Frame. Name the outcome + the metric Verify will assert; surface forks.
phase('Frame');
const frame = await agent(
  `Frame shipping "${feature}". In one sentence, the outcome. Then the ONE observable that proves ` +
  `it works — the metric the Verify phase will assert (not "it ran"). List any unsure product/eng ` +
  `fork that should be resolved with a research-decision before building. ALSO name what Verify will ` +
  `need in THIS environment (the build surface that must compile, a display/toolchain/credential/` +
  `service the captest depends on) and whether it's present — so we don't build then discover we ` +
  `can't verify; if something's missing, say whether to unblock it (fetch/install/copy) or scope to ` +
  `the verifiable slice + an explicit gap. Be concrete.`,
  { label: 'frame', phase: 'Frame', schema: FRAME_SCHEMA },
);
const outcome = frame?.outcome || feature;
const metric = frame?.successMetric || 'the feature produces its expected observable output';
if (frame?.forks?.length) log(`⛔ forks to resolve (research-decision): ${frame.forks.join('; ')}`);
log(`outcome: ${outcome} · success metric: ${metric}`);

// Phase 1 — Build. Mirror a canonical reference; cite file:line; parity-check.
phase('Build');
const build = await agent(
  `Mirror-reference build toward this outcome: "${outcome}".` +
  (reference ? ` Use this reference as canon: ${reference}.` : ' Find the canonical OSS reference for it.') +
  ` Clone/read the actual reference code, build to it CITING file:line in the code, and parity-check ` +
  `(numeric max|Δ| for ported math, observable-contract match for UX). OPEN the file and cite the ` +
  `line you read — a citation from memory or from a prior research doc is a guess wearing a citation ` +
  `(fabricated/nonexistent file:lines have slipped through this way); naming the reference is not ` +
  `reading it. Report: the reference, the file:line citations, the parity result, and any deviations + why.`,
  { label: 'build', phase: 'Build', agentType: 'reference-builder' },
);

// Phase 2 — Verify. Real dependency on a fixed input; assert the metric; no silent skip.
phase('Verify');
const verify = await agent(
  `Verify the work just built for "${feature}". Drive the REAL dependency on a committed fixed input ` +
  `(not a stub) and assert this objective metric: "${metric}". Emit an inspectable artifact, behind a ` +
  `runner that FAILS LOUD if the dependency is present but the test skipped. VERIFIED ≠ WIRED: a ` +
  `captest that stands up its own harness proves the capability WORKS, not that the PRODUCT calls it ` +
  `— check the real production call path actually reaches it (drive it through the prod seam, or at ` +
  `least assert the prod code constructs/invokes it on a user path). A capability green in a captest ` +
  `but fed None / never-invoked in production is INERT: record an explicit "built, not yet wired in ` +
  `production" gap, do NOT bank it as shipped. If it genuinely can't be verified without faking ` +
  `(live account/remote/infra), return an honest gap with the reason — do NOT weaken a test. Report: ` +
  `grade, the metric result, the artifact path, real-vs-recorded, reachable-on-prod-path (yes / ` +
  `built-but-inert), or the gap.`,
  { label: 'verify', phase: 'Verify', agentType: 'capability-verifier' },
);

// Phase 3 — Harden. Adversarial inputs; REAL/CLEARED; fix forward + pin invariants.
phase('Harden');
const harden = await agent(
  `Adversarially harden the code built for "${feature}". Hit the risky surfaces — untrusted-input ` +
  `decoders (bombs/truncated/oversized/traversal), concurrency (races/double-writers/wrong-target ` +
  `cancel), shell-outs (argument injection), parsers of external/model output. Each finding REAL ` +
  `(with a repro or airtight code-path argument) or CLEARED (with the reason). Fix REAL ones forward, ` +
  `minimally, with a regression test that fails before/passes after; pin invariants and confirm the ` +
  `test has teeth. Correctness/safety/data-loss only. Report: audited N, fixed M, cleared K.`,
  { label: 'harden', phase: 'Harden', agentType: 'hardener' },
);

// Phase 4 — Integrate. Human-gated: rebase (never force-push), run the gate, then push.
phase('Integrate');
log('Integrate (human-gated): branch/worktree → rebase onto upstream (never force-push) → run the gate (code AND docs/freshness — code you shipped is the source a KB doc tracks, so skipping the doc gate silently re-stales docs; use maintain-knowledge-base when it goes red, never blind-bump) → targeted git add → push. Review the report below first.');

let report = { feature, outcome, metric, forks: frame?.forks ?? [], build, verify, harden };
report
