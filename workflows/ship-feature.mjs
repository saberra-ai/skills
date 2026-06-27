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
    { title: 'Frame', detail: 'name the outcome + the one success metric; flag forks' },
    { title: 'Build', detail: 'mirror a canonical reference, cite file:line, parity-check' },
    { title: 'Verify', detail: 'real dependency on a fixed input, objective metric, no silent skip' },
    { title: 'Harden', detail: 'adversarial inputs → REAL/CLEARED, fix forward + pin invariants' },
    { title: 'Integrate', detail: 'rebase not force-push; gate before push (human-gated)' },
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
  `fork that should be resolved with a research-decision before building. Be concrete.`,
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
  `(numeric max|Δ| for ported math, observable-contract match for UX). Report: the reference, the ` +
  `file:line citations, the parity result, and any deviations + why.`,
  { label: 'build', phase: 'Build', agentType: 'reference-builder' },
);

// Phase 2 — Verify. Real dependency on a fixed input; assert the metric; no silent skip.
phase('Verify');
const verify = await agent(
  `Verify the work just built for "${feature}". Drive the REAL dependency on a committed fixed input ` +
  `(not a stub) and assert this objective metric: "${metric}". Emit an inspectable artifact, behind a ` +
  `runner that FAILS LOUD if the dependency is present but the test skipped. If it genuinely can't be ` +
  `verified without faking (live account/remote/infra), return an honest gap with the reason — do NOT ` +
  `weaken a test. Report: grade, the metric result, the artifact path, real-vs-recorded, or the gap.`,
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
log('Integrate (human-gated): branch/worktree → rebase onto upstream (never force-push) → run the gate → targeted git add → push. Review the report below first.');

let report = { feature, outcome, metric, forks: frame?.forks ?? [], build, verify, harden };
report
