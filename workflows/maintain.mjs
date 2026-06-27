// Runnable orchestrator for the maintain-skills workflow — keep an installed copy of the
// kit current the safe way: detect → update → migrate → verify → report.
// Docs: https://code.claude.com/docs/en/workflows
//
//   Workflow({ scriptPath: "workflows/maintain.mjs", args: "~/.claude/skills/saberra-skills" })
//
// Lifecycle discipline mirrors garrytan/gstack's gstack-upgrade (detect topology, backup +
// restore-on-failure, idempotent done-marked migrations, never auto-commit). The Verify phase
// — re-running the kit's own validator on the upgraded copy — is ours: a green upgrade that
// can't pass its own runner is not a successful upgrade.

export const meta = {
  name: 'maintain-skills',
  description: 'Keep an installed skills kit current the safe way: detect the install, update with backup + restore-on-failure, run idempotent migrations, re-verify with the validator, and report what changed. Never auto-commits.',
  phases: [
    { title: 'Detect', detail: 'find the install topology + current version (never assume)' },
    { title: 'Update', detail: 'backup → pull/swap → restore on any failure' },
    { title: 'Migrate', detail: 'run newer-than-old migrations; done-marked, retry-on-incomplete' },
    { title: 'Verify', detail: 'npm test on the upgraded copy — fails loud, else roll back' },
    { title: 'Report', detail: 'what changed (CHANGELOG); leave the commit to the user' },
  ],
}

// `args` is the install dir (string) or { dir }. Default to the conventional global path.
const installDir = (typeof args === 'string' ? args : args?.dir) || '~/.claude/skills/saberra-skills';

phase('Detect');
const detect = await agent(
  `Detect the installed skills kit at "${installDir}". Determine: is it a git checkout or a ` +
  `vendored copy? global or repo-local? does a second (dual) copy exist? Read its VERSION file. ` +
  `Report install type, directory, current version — or "not installed" if absent. Do not modify anything.`,
  { label: 'detect', phase: 'Detect', agentType: 'capability-verifier' },
);

phase('Update');
const update = await agent(
  `Update the kit at "${installDir}" (type: ${detect}). Git checkout: git stash → fetch → ` +
  `reset --hard origin/main. Vendored: clone fresh to a temp dir, move the old copy to .bak, ` +
  `swap in the new, and RESTORE the .bak if anything fails. Sync any dual copy from the primary. ` +
  `Leave it at the new version or fully rolled back — never half-applied. Report from→to version.`,
  { label: 'update', phase: 'Update', agentType: 'reference-builder' },
);

phase('Migrate');
const migrate = await agent(
  `Run pending migrations in "${installDir}/migrations". Apply each v*.sh whose version is newer ` +
  `than the old version, in SemVer order. Each is idempotent and writes its done-marker ONLY when ` +
  `every repair succeeded or was provably unnecessary; on any failure it stays unmarked to retry ` +
  `next upgrade. Report: which ran, which are done-marked, which are left to retry and why. ` +
  `Never git commit or push.`,
  { label: 'migrate', phase: 'Migrate', agentType: 'reference-builder' },
);

phase('Verify');
const verify = await agent(
  `Re-verify the upgraded kit at "${installDir}": run \`npm test\` (self-test + validate.mjs). ` +
  `If it is not green — a malformed skill, an unparseable workflow, a drifted install slug — the ` +
  `upgrade FAILED: report the failure and recommend rolling back to the .bak. A green upgrade that ` +
  `can't pass its own validator is not a successful upgrade. Report the validator result.`,
  { label: 'verify', phase: 'Verify', agentType: 'capability-verifier' },
);

phase('Report');
log('Report (human-gated): summarize CHANGELOG entries old→new as 5–7 user-facing bullets; for a vendored/dual install, name the changed paths and leave the commit to the user. Never auto-commit.');

let report = { installDir, detect, update, migrate, verify };
report
