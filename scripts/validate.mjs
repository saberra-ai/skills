#!/usr/bin/env node
// Verification runner for this skills repo — applies the repo's own doctrine to itself.
//
// The capability under test: "every skill/agent is well-formed and the repo installs."
// Ladder (see README → Verification):
//   S    every SKILL.md / agent .md parses
//   SS   real contract — the Agent Skills frontmatter schema the `skills` CLI reads
//        (name: lowercase/digits/hyphens ≤64, not reserved; description ≤1024, third-person+triggers)
//        grounded in https://agentskills.io/specification & github.com/anthropics/skills
//   SSS  objective metric — counts + per-file pass/fail, no prose
//   SSS+ inspectable artifact — validation-report.json
//   SSS++ contract parity — name===dir, README install slug === git origin slug (regression pin)
//   SSS+++ no silent skip — zero discovered files is a HARD FAIL, every discovered file must be
//        graded, and `--self-test` injects a malformed fixture to prove the runner has teeth.
//
// Usage: node scripts/validate.mjs [--self-test] [--json]
// Exit 0 = all green; non-zero = at least one error (or a silent-skip was detected).

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, basename, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { buildManifest } from './gen-manifest.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RESERVED = ['claude', 'anthropic'];
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NAME_MAX = 64;
const DESC_MAX = 1024;
const DESC_MIN = 40; // a one-liner with what+when is always longer than this
const FIRST_PERSON = [/^\s*i\s/i, /\bi can help\b/i, /\byou can use this\b/i];
const TRIGGER_CUE = /\b(use (when|whenever|for|after|instead|to)|when you|dispatch|reach for)\b/i;

// Receipt standard (see RECEIPTS.md). Every skill must end in a `## Receipt` block: a typed,
// copy-pasteable proof template. Fields are typed PER SKILL — a *decision* receipt has no
// "command run"; a *capability* receipt does — so enforcement is a per-skill required-label
// registry, never one flat template stamped on everyone (that would reintroduce the fake-green
// "N/A" fields this standard exists to kill). Two invariants hold for ALL skills: a fenced
// template, and an explicit honest-gap line (honest ⬜ over fake green is the kit's whole thesis).
const RECEIPT_GAP_RE = /not proven|known gap|honest gap|not verified|unproven|⬜/i;
const RECEIPT_FIELDS = {
  'verify-capability':       ['Claim', 'Real input', 'Metric', 'Artifact'],
  'mirror-reference':        ['Claim', 'Reference', 'Citations', 'Parity'],
  'adversarial-harden':      ['Claim', 'Surface', 'Audited', 'Regression'],
  'research-decision':       ['Claim', 'Question', 'Sources', 'Recommendation'],
  'ship-feature':            ['Claim', 'Built', 'Verified', 'Hardened', 'Integrated'],
  'maintain-skills':         ['Claim', 'Version', 'Migrations', 'Re-verify'],
  'build-knowledge-base':    ['Claim', 'Format', 'Spine', 'Coverage', 'Validator'],
  'maintain-knowledge-base': ['Claim', 'Audited', 'Drift', 'Map'],
};

// ---- tiny helpers ----------------------------------------------------------
function walk(dir, pred, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, pred, out);
    else if (pred(p)) out.push(p);
  }
  return out;
}

// Minimal frontmatter parse: the `---`-fenced YAML head, flat `key: value` lines
// (values are single-line in the Agent Skills schema). Returns null if no fence.
function parseFrontmatter(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return null;
  const head = text.slice(3, end).replace(/^\n/, '');
  const body = text.slice(end + 4).replace(/^\r?\n/, '');
  const fields = {};
  for (const line of head.split('\n')) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s?(.*)$/);
    if (m) fields[m[1]] = m[2].trim();
  }
  return { fields, body };
}

function originSlug() {
  // Derive "owner/repo" from the configured git remote — the source of truth the
  // README install command must agree with. Read .git/config directly (no shell).
  const cfg = join(ROOT, '.git', 'config');
  if (!existsSync(cfg)) return null;
  const m = readFileSync(cfg, 'utf8').match(/github\.com[:/]([\w.-]+\/[\w.-]+?)(?:\.git)?\s*$/m);
  return m ? m[1] : null;
}

// ---- the checks ------------------------------------------------------------
function checkSkill(file) {
  const errors = [], warnings = [];
  const text = readFileSync(file, 'utf8');
  const fm = parseFrontmatter(text);
  const dir = basename(dirname(file));
  if (!fm) { errors.push('no YAML frontmatter (`---` fence)'); return grade(file, 'skill', errors, warnings, {}); }
  const { name, description } = fm.fields;

  if (!name) errors.push('missing `name`');
  else {
    if (!NAME_RE.test(name)) errors.push(`name "${name}" must be lowercase letters/digits/hyphens`);
    if (name.length > NAME_MAX) errors.push(`name exceeds ${NAME_MAX} chars`);
    if (RESERVED.includes(name.toLowerCase())) errors.push(`name "${name}" is reserved`);
    if (name !== dir) errors.push(`name "${name}" != directory "${dir}" (must match)`);
  }
  if (!description) errors.push('missing `description`');
  else {
    if (description.length > DESC_MAX) errors.push(`description exceeds ${DESC_MAX} chars (${description.length})`);
    if (description.length < DESC_MIN) warnings.push(`description very short (${description.length} chars) — say what + when`);
    if (FIRST_PERSON.some(re => re.test(description))) warnings.push('description not third-person (avoid "I"/"you can use")');
    if (!TRIGGER_CUE.test(description)) warnings.push('description lacks a trigger cue ("Use when…")');
  }
  if (!fm.body.trim()) errors.push('empty body (no skill content)');
  return grade(file, 'skill', errors, warnings, { name, descLen: description?.length ?? 0 });
}

// Slice the `## Receipt` section: from its heading to the next `## ` (or EOF). Scoping matters —
// a field label that appears in prose elsewhere, or inside another section's example, must NOT
// satisfy the check. Returns null if there's no Receipt heading at all.
function receiptSection(text) {
  const m = text.match(/^##\s+Receipt\b.*$/m);
  if (!m) return null;
  const rest = text.slice(m.index + m[0].length);
  const next = rest.search(/^##\s/m);
  return next === -1 ? rest : rest.slice(0, next);
}

// Enforce the receipt standard on one skill. Universal: a `## Receipt` section, a fenced template,
// and an honest-gap line. Per-skill: the typed fields its class owes (RECEIPT_FIELDS). A skill with
// no registered field-spec still gets the universal checks (and a warning), so a *new* skill can't
// silently ship a receipt-less or gap-less block.
function checkReceipt(file, name) {
  const errors = [], warnings = [];
  const section = receiptSection(readFileSync(file, 'utf8'));
  if (section === null) {
    errors.push('no `## Receipt` block — every skill must end in a typed proof receipt (see RECEIPTS.md)');
    return grade(file, 'receipt', errors, warnings, { name });
  }
  // The template IS the receipt — concatenate every fenced block's *inner* content. Fields and the
  // honest-gap line must live INSIDE the fence, not in the surrounding prose: a label mentioned in
  // an intro sentence ("this records the Claim, Sources and Recommendation") is not a real field,
  // and accepting it would reopen the fake-green hole the standard closes. (Hardened: was section-
  // wide; a prose-only field used to pass.) An unterminated fence yields no match → fails closed.
  const fence = [...section.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map(m => m[1]).join('\n');
  if (!fence.trim()) errors.push('Receipt has no fenced template (must be copy-pasteable)');
  if (!RECEIPT_GAP_RE.test(fence)) errors.push('Receipt template has no honest-gap line ("What\'s NOT proven" / "Known gap") — the non-negotiable field');
  const required = RECEIPT_FIELDS[name];
  if (!required) { warnings.push(`no receipt field-spec registered for "${name}" — only universal checks ran`); return grade(file, 'receipt', errors, warnings, { name }); }
  for (const label of required) {
    const re = new RegExp(`\\b${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (!re.test(fence)) errors.push(`Receipt missing required field for ${name}: "${label}"`);
  }
  return grade(file, 'receipt', errors, warnings, { name });
}

function checkAgent(file) {
  const errors = [], warnings = [];
  const text = readFileSync(file, 'utf8');
  const fm = parseFrontmatter(text);
  const stem = basename(file).replace(/\.md$/, '');
  if (!fm) { errors.push('no YAML frontmatter'); return grade(file, 'agent', errors, warnings, {}); }
  const { name, description, tools } = fm.fields;
  if (!name) errors.push('missing `name`');
  else {
    if (!NAME_RE.test(name)) errors.push(`name "${name}" must be lowercase letters/digits/hyphens`);
    if (name !== stem) errors.push(`name "${name}" != filename "${stem}"`);
  }
  if (!description) errors.push('missing `description`');
  else if (description.length < DESC_MIN) warnings.push('description very short');
  if (!tools) warnings.push('no `tools` field (defaults vary by harness)');
  if (!fm.body.trim()) errors.push('empty body');
  return grade(file, 'agent', errors, warnings, { name });
}

// A runnable workflow (workflows/*.mjs) must actually parse with the real `node`
// (real dependency, real input — not a regex guess) and declare the dynamic-workflow
// contract it claims to implement: an exported `meta` with name/description/phases, and
// real orchestration (at least one phase() + agent() call). A workflow that links from a
// skill but doesn't parse is the silent-skip rot in script form.
function checkWorkflow(file) {
  const errors = [], warnings = [];
  try {
    // execFile (not shell) → no arg injection; --check parses only, never executes;
    // timeout bounds a pathological/hanging file so the runner can't stall.
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe', timeout: 10_000 });
  } catch (e) {
    const msg = (e.stderr?.toString() || e.message).split('\n').find(l => l.trim()) || 'parse failed';
    errors.push(`does not parse (node --check): ${msg.trim()}`);
    return grade(file, 'workflow', errors, warnings, {});
  }
  const src = readFileSync(file, 'utf8');
  if (!/export\s+const\s+meta\s*=/.test(src)) errors.push('no `export const meta = {…}` (workflow contract)');
  else {
    if (!/\bname\s*:/.test(src)) errors.push('meta missing `name`');
    if (!/\bdescription\s*:/.test(src)) errors.push('meta missing `description`');
    if (!/\bphases\s*:/.test(src)) warnings.push('meta has no `phases` (progress groups)');
  }
  if (!/\bphase\s*\(/.test(src)) errors.push('no phase() call — not an orchestration');
  if (!/\bagent\s*\(/.test(src)) errors.push('no agent() call — orchestrates nothing');
  if (/^\s*return\b/m.test(src)) errors.push('top-level `return` (illegal in a module — node --check would already flag this)');
  return grade(file, 'workflow', errors, warnings, {});
}

// An orchestration/ skill is a workflow front door, not just a list of steps. It must be
// driveable: an explicit kickoff trigger and ≥2 gated phases. This is what turns "a clean
// set of steps" into "a workflow someone can kick off and follow".
function checkFrontDoor(file) {
  const errors = [], warnings = [];
  const body = readFileSync(file, 'utf8');
  if (!/kick it off|kick off|paste this/i.test(body)) errors.push('no kickoff trigger (a "paste this to your agent" entry point)');
  const phases = (body.match(/^##\s+Phase\s+\d/gim) || []).length;
  const gates = (body.match(/\*\*Gate:\*\*/g) || []).length;
  if (phases < 2) errors.push(`only ${phases} numbered phases — a workflow needs an ordered sequence`);
  if (gates < 2) errors.push(`only ${gates} explicit gates — phases must be gated, not just listed`);
  if (!/done when/i.test(body)) warnings.push('no "Done when" completion criteria');
  return grade(file, 'frontdoor', errors, warnings, {});
}

const isSemver = s => /^\d+\.\d+\.\d+$/.test(String(s).trim());

// Lifecycle backbone: VERSION must be SemVer and match package.json (a parity pin so the two
// can't drift), and CHANGELOG must carry an entry for the current version. A kit you ship for
// install needs an answerable "what changed" — this enforces it.
function checkLifecycle() {
  const out = [];
  const verPath = join(ROOT, 'VERSION');
  const version = existsSync(verPath) ? readFileSync(verPath, 'utf8').trim() : null;
  const v = grade(verPath, 'version', [], [], { version });
  if (!version) v.errors.push('no VERSION file');
  else if (!isSemver(version)) v.errors.push(`VERSION "${version}" is not SemVer (x.y.z)`);
  else {
    const pkgPath = join(ROOT, 'package.json');
    if (existsSync(pkgPath)) {
      let pkgVer = null;
      try { pkgVer = JSON.parse(readFileSync(pkgPath, 'utf8')).version; } catch { v.errors.push('package.json is not valid JSON'); }
      if (pkgVer && pkgVer !== version) v.errors.push(`VERSION "${version}" != package.json "${pkgVer}" (parity pin)`);
    }
  }
  v.ok = v.errors.length === 0;
  out.push(v);

  const clPath = join(ROOT, 'CHANGELOG.md');
  const cl = grade(clPath, 'changelog', [], [], {});
  if (!existsSync(clPath)) cl.errors.push('no CHANGELOG.md');
  else if (version && isSemver(version) && !new RegExp(`##\\s*\\[?${version.replace(/\./g, '\\.')}\\]?`).test(readFileSync(clPath, 'utf8')))
    cl.errors.push(`CHANGELOG has no entry for current version ${version}`);
  cl.ok = cl.errors.length === 0;
  out.push(cl);
  return out;
}

// manifest.json is what an AI agent fetches to install the kit with only HTTP-GET + write.
// If it drops a skill, that skill silently never installs — the install-time silent skip. So
// cross-check the committed manifest against an independENT rebuild (buildManifest, the same
// generator) AND the validator's own discovered file set: every discovered skill/agent/workflow
// must appear, the version must match, and there must be no phantom entries.
function checkManifest(skillFiles, agentFiles, workflowFiles, version) {
  const errors = [];
  const mPath = join(ROOT, 'manifest.json');
  if (!existsSync(mPath)) { errors.push('no manifest.json — run `npm run manifest`'); return grade(mPath, 'manifest', errors, [], {}); }
  let committed;
  try { committed = JSON.parse(readFileSync(mPath, 'utf8')); }
  catch { errors.push('manifest.json is not valid JSON'); return grade(mPath, 'manifest', errors, [], {}); }

  const expected = buildManifest(ROOT);
  if (JSON.stringify(committed) !== JSON.stringify(expected))
    errors.push('manifest.json is stale — run `npm run manifest` and commit (drifted from the repo)');
  if (committed.version !== version) errors.push(`manifest version "${committed.version}" != VERSION "${version}"`);

  // Independent cross-check vs the validator's own discovery (not buildManifest's walk).
  const discovered = {
    skills: new Set(skillFiles.map(f => relative(ROOT, f).split('\\').join('/'))),
    agents: new Set(agentFiles.map(f => relative(ROOT, f).split('\\').join('/'))),
    workflows: new Set(workflowFiles.map(f => relative(ROOT, f).split('\\').join('/'))),
  };
  for (const kind of ['skills', 'agents', 'workflows']) {
    const listed = new Set((committed[kind] || []).map(e => e.path));
    for (const p of discovered[kind]) if (!listed.has(p)) errors.push(`manifest missing ${kind.slice(0, -1)}: ${p}`);
    for (const p of listed) if (!discovered[kind].has(p)) errors.push(`manifest lists phantom ${kind.slice(0, -1)}: ${p}`);
  }
  return grade(mPath, 'manifest', errors, [], { version: committed.version, skills: (committed.skills || []).length });
}

// Migration scripts must parse with the real `bash` (same idea as the workflow node --check).
function checkMigration(file) {
  const errors = [];
  try {
    execFileSync('bash', ['-n', file], { stdio: 'pipe', timeout: 10_000 });
  } catch (e) {
    const msg = (e.stderr?.toString() || e.message).split('\n').find(l => l.trim()) || 'parse failed';
    errors.push(`does not parse (bash -n): ${msg.trim()}`);
  }
  return grade(file, 'migration', errors, [], {});
}

// The installer must be POSIX sh, not bash. `sh -n` (dash on CI) rejects bashisms — arrays,
// [[ ]] — so a non-portable installer that would choke in a user's fish/zsh fails here. This
// pins the fix for the "Fish shell choked on the bash array syntax" report.
function checkInstaller(file) {
  const errors = [];
  try {
    execFileSync('sh', ['-n', file], { stdio: 'pipe', timeout: 10_000 });
  } catch (e) {
    const msg = (e.stderr?.toString() || e.message).split('\n').find(l => l.trim()) || 'parse failed';
    errors.push(`not POSIX sh (sh -n): ${msg.trim()}`);
  }
  // Scan executable lines only — a comment mentioning "[[ ]]" or arrays isn't a bashism.
  const code = readFileSync(file, 'utf8').split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
  if (/^\s*\w+=\(/m.test(code)) errors.push('uses a bash array (name=( … )) — not POSIX; will break in dash/fish-piped-sh');
  if (/\[\[/.test(code)) errors.push('uses [[ … ]] — bashism, not POSIX');
  return grade(file, 'installer', errors, [], {});
}

// internal markdown links must resolve (skip http/anchors); [[wikilinks]] must
// name a real skill/agent if any exist.
function checkLinks(file, skillNames, agentNames) {
  const errors = [];
  // Strip code (fenced blocks + inline spans) first — a doc that *documents* shell syntax like
  // `[[ … ]]` or a `[text](url)` example isn't a real link/wikilink. Link checks are prose-only.
  const text = readFileSync(file, 'utf8')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '');
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const t = m[1].split('#')[0].trim();
    if (!t || /^(https?:|mailto:)/.test(t)) continue;
    if (!existsSync(resolve(dirname(file), t))) errors.push(`dead link → ${t}`);
  }
  for (const m of text.matchAll(/\[\[([^\]]+)\]\]/g)) {
    const n = m[1].trim();
    if (!skillNames.has(n) && !agentNames.has(n)) errors.push(`wikilink [[${n}]] names no skill/agent`);
  }
  return errors.length ? grade(file, 'links', errors, [], {}) : null;
}

function grade(file, kind, errors, warnings, meta) {
  return { file: relative(ROOT, file), kind, ok: errors.length === 0, errors, warnings, ...meta };
}

// ---- runner ----------------------------------------------------------------
function run() {
  const skillFiles = walk(join(ROOT, 'skills'), p => basename(p) === 'SKILL.md');
  const agentFiles = walk(join(ROOT, 'agents'), p => p.endsWith('.md'));

  // SSS+++ silent-skip guard: an empty discovery is a FAILURE, not a green pass.
  const hardFails = [];
  if (skillFiles.length === 0) hardFails.push('SILENT-SKIP GUARD: discovered 0 skills under skills/ — refusing to pass green');
  if (agentFiles.length === 0) hardFails.push('SILENT-SKIP GUARD: discovered 0 agents under agents/');

  const skills = skillFiles.map(checkSkill);
  const receipts = skillFiles.map((f, i) => checkReceipt(f, skills[i].name));
  const agents = agentFiles.map(checkAgent);
  const skillNames = new Set(skills.map(s => s.name).filter(Boolean));
  const agentNames = new Set(agents.map(a => a.name).filter(Boolean));

  // Runnable orchestrators + workflow front-door skills — what makes this a usable
  // workflow, not just a clean set of steps. Both discovered dynamically (no silent skip).
  const workflowFiles = walk(join(ROOT, 'workflows'), p => p.endsWith('.mjs'));
  const workflows = workflowFiles.map(checkWorkflow);
  const frontDoors = skillFiles.filter(f => f.includes(`${join('skills', 'orchestration')}`) || /\/orchestration\//.test(f)).map(checkFrontDoor);

  // Maintenance lifecycle: VERSION/CHANGELOG parity + migration scripts parse.
  const lifecycle = checkLifecycle();
  const migrations = walk(join(ROOT, 'migrations'), p => p.endsWith('.sh')).map(checkMigration);

  // Install manifest: the queryable index agents fetch — must cover every discovered file.
  const manifestCheck = checkManifest(skillFiles, agentFiles, workflowFiles, lifecycle[0]?.version);

  // The portable installer must stay POSIX sh (no bashisms) so it can't break in non-bash shells.
  const installerPath = join(ROOT, 'install.sh');
  const installerCheck = existsSync(installerPath) ? checkInstaller(installerPath) : null;

  const mdFiles = walk(ROOT, p => p.endsWith('.md'));
  const links = mdFiles.map(f => checkLinks(f, skillNames, agentNames)).filter(Boolean);

  // SSS++ contract parity: README install slug must equal the git origin slug.
  const slug = originSlug();
  const readme = existsSync(join(ROOT, 'README.md')) ? readFileSync(join(ROOT, 'README.md'), 'utf8') : '';
  const installMatch = readme.match(/skills(?:@\S+)?\s+add\s+([\w.-]+\/[\w.-]+)/);
  const installSlug = installMatch ? installMatch[1] : null;
  const slugCheck = { file: 'README.md', kind: 'install-slug', ok: true, errors: [], warnings: [] };
  if (!installSlug) slugCheck.warnings.push('no `skills add <slug>` command found in README');
  else if (slug && installSlug !== slug) {
    slugCheck.ok = false;
    slugCheck.errors.push(`install slug "${installSlug}" != git origin "${slug}" — regression pin (the bug we fixed)`);
  }
  slugCheck.installSlug = installSlug; slugCheck.originSlug = slug;

  const results = [...skills, ...receipts, ...agents, ...workflows, ...frontDoors, ...lifecycle, ...migrations, manifestCheck, ...(installerCheck ? [installerCheck] : []), ...links, slugCheck];
  const errored = results.filter(r => !r.ok);
  const warned = results.filter(r => r.warnings?.length);
  const report = {
    schema: 'agent-skills/v1',
    counts: { skills: skills.length, receipts: receipts.filter(r => r.ok).length, agents: agents.length, workflows: workflows.length, frontDoors: frontDoors.length, migrations: migrations.length, version: lifecycle[0]?.version ?? null, mdFiles: mdFiles.length, errors: errored.length, warnings: warned.reduce((n, r) => n + r.warnings.length, 0) },
    hardFails,
    results,
  };
  writeFileSync(join(ROOT, 'validation-report.json'), JSON.stringify(report, null, 2) + '\n');
  return { report, errored, warned, hardFails };
}

// ---- self-test: prove the runner has teeth ---------------------------------
// Inject a deliberately-malformed skill into a throwaway tree and assert the
// checks reject it. If a broken skill slips through, the runner is worthless.
function selfTest() {
  const cases = [
    ['missing name', '---\ndescription: Use when testing the validator has teeth on a broken skill file here.\n---\nbody', f => f.errors.some(e => /missing `name`/.test(e))],
    ['name!=dir', '---\nname: wrongname\ndescription: Use when testing that name must equal its directory for the schema.\n---\nbody', f => f.errors.some(e => /!= directory/.test(e))],
    ['reserved name', '---\nname: claude\ndescription: Use when testing reserved-name rejection in the validator self-test path.\n---\nbody', f => f.errors.some(e => /reserved/.test(e))],
    ['bad chars', '---\nname: Bad_Name\ndescription: Use when testing that uppercase and underscores are rejected by the schema.\n---\nbody', f => f.errors.some(e => /lowercase/.test(e))],
    ['no frontmatter', '# just a heading\nno fence', f => f.errors.some(e => /no YAML frontmatter/.test(e))],
    ['empty body', '---\nname: emptybody\ndescription: Use when testing that a skill with no body content is rejected here.\n---\n   ', f => f.errors.some(e => /empty body/.test(e))],
    ['desc too long', `---\nname: longdesc\ndescription: ${'x'.repeat(1100)}\n---\nbody`, f => f.errors.some(e => /exceeds 1024/.test(e))],
  ];
  // Workflow fixtures: a non-parsing script, a script with no `meta`, and one that
  // orchestrates nothing must all be rejected.
  const wfCases = [
    ['wf-syntax-error', 'export const meta = {\nphase(\nthis is not valid js', f => f.errors.some(e => /does not parse/.test(e))],
    ['wf-no-meta', 'phase("x");\nawait agent("do");\n', f => f.errors.some(e => /workflow contract/.test(e))],
    ['wf-no-orchestration', 'export const meta = { name: "x", description: "y", phases: [] };\n', f => f.errors.some(e => /orchestrat/.test(e))],
  ];
  // Front-door fixture: an orchestration skill that's just steps (no kickoff, no gates) must be rejected.
  const fdCases = [
    ['fd-just-steps', '---\nname: x\ndescription: Use when shipping. a workflow.\n---\n# X\n1. do a\n2. do b\n', f => f.errors.some(e => /kickoff|gates|phases/.test(e))],
  ];
  // Receipt teeth: a skill with no `## Receipt`, one whose receipt omits the honest-gap line, and
  // one missing a class-required field must all be rejected. The honest-gap case is the key one —
  // it's the fake-green guard the whole standard exists for. checkReceipt takes the name explicitly.
  const FENCE = '```';
  const rcCases = [
    ['rc-missing', 'verify-capability', '# X\nbody, no receipt section at all\n',
      f => f.errors.some(e => /no `## Receipt` block/.test(e))],
    ['rc-no-gap', 'verify-capability', `## Receipt\n${FENCE}\n- Claim: x\n- Real input: y\n- Metric: z\n- Artifact: a\n${FENCE}\n`,
      f => f.errors.some(e => /honest-gap/.test(e))],
    ['rc-missing-field', 'verify-capability', `## Receipt\n${FENCE}\n- Claim: x\n- Real input: y\n- Metric: z\n- Not proven: w\n${FENCE}\n`,
      f => f.errors.some(e => /missing required field.*Artifact/.test(e))],
    ['rc-no-fence', 'verify-capability', '## Receipt\n- Claim: x\n- Real input: y\n- Metric: z\n- Artifact: a\n- Not proven: w\n',
      f => f.errors.some(e => /no fenced template/.test(e))],
    // Hardening regression: "Artifact" appears only in the intro PROSE, not the fenced template —
    // must still be rejected (a label name-dropped in a sentence is not a real receipt field).
    ['rc-prose-field', 'verify-capability', `## Receipt\nThis records the Claim, Real input, Metric and Artifact.\n${FENCE}\n- Claim: x\n- Real input: y\n- Metric: z\n- Not proven: w\n${FENCE}\n`,
      f => f.errors.some(e => /missing required field.*Artifact/.test(e))],
  ];

  const tmp = mkdtempSync(join(tmpdir(), 'skills-selftest-'));
  let pass = 0;
  const failures = [];
  for (const [label, content, assert] of cases) {
    // name!=dir needs a dir whose basename differs from the frontmatter name.
    const dir = label === 'name!=dir' ? join(tmp, 'rightdir') : join(tmp, label.replace(/\W+/g, '-'));
    const fp = join(dir, 'SKILL.md');
    mkdirSync(dir, { recursive: true });
    writeFileSync(fp, content);
    const graded = checkSkill(fp);
    if (assert(graded)) pass++;
    else failures.push(`${label}: expected rejection but got errors=[${graded.errors.join('; ')}]`);
  }
  for (const [label, content, assert] of wfCases) {
    const fp = join(tmp, `${label}.mjs`);
    writeFileSync(fp, content);
    const graded = checkWorkflow(fp);
    if (assert(graded)) pass++;
    else failures.push(`${label}: expected rejection but got errors=[${graded.errors.join('; ')}]`);
  }
  for (const [label, content, assert] of fdCases) {
    const fp = join(tmp, `${label}.md`);
    writeFileSync(fp, content);
    const graded = checkFrontDoor(fp);
    if (assert(graded)) pass++;
    else failures.push(`${label}: expected rejection but got errors=[${graded.errors.join('; ')}]`);
  }
  for (const [label, name, content, assert] of rcCases) {
    const fp = join(tmp, `${label}.md`);
    writeFileSync(fp, content);
    const graded = checkReceipt(fp, name);
    if (assert(graded)) pass++;
    else failures.push(`${label}: expected rejection but got errors=[${graded.errors.join('; ')}]`);
  }
  // Lifecycle teeth: non-SemVer must be rejected; a migration that doesn't parse must be rejected.
  const semverCases = [
    ['semver-good', '1.2.3', v => v === true],
    ['semver-bad', 'v1.2', v => v === false],
    ['semver-4seg', '1.2.3.4', v => v === false],
  ];
  for (const [label, input, assert] of semverCases) {
    if (assert(isSemver(input))) pass++;
    else failures.push(`${label}: isSemver("${input}") wrong`);
  }
  const mgCases = [
    ['mg-syntax-error', 'if [ -f x ]; then\n  echo unterminated\n', f => f.errors.some(e => /does not parse/.test(e))],
  ];
  for (const [label, content, assert] of mgCases) {
    const fp = join(tmp, `${label}.sh`);
    writeFileSync(fp, content);
    const graded = checkMigration(fp);
    if (assert(graded)) pass++;
    else failures.push(`${label}: expected rejection but got errors=[${graded.errors.join('; ')}]`);
  }
  // Installer teeth: a bash-array installer must be rejected (the fish-shell breakage).
  {
    const fp = join(tmp, 'bad-install.sh');
    writeFileSync(fp, '#!/bin/sh\nfiles=(a b c)\necho "${files[@]}"\n');
    const graded = checkInstaller(fp);
    if (graded.errors.some(e => /bash array|not POSIX/.test(e))) pass++;
    else failures.push(`installer-bashism: expected rejection, got [${graded.errors.join('; ')}]`);
  }
  // Manifest teeth: a discovered skill absent from the manifest must be flagged (silent-drop guard).
  {
    const phantom = join(ROOT, 'skills', 'engineering', '__selftest_phantom__', 'SKILL.md');
    const graded = checkManifest([phantom], [], [], readFileSync(join(ROOT, 'VERSION'), 'utf8').trim());
    if (graded.errors.some(e => /manifest missing skill/.test(e))) pass++;
    else failures.push(`manifest-missing: expected a missing-skill error, got [${graded.errors.join('; ')}]`);
  }
  const total = cases.length + wfCases.length + fdCases.length + rcCases.length + semverCases.length + mgCases.length + 2;
  rmSync(tmp, { recursive: true, force: true });
  return { total, pass, failures };
}

// ---- main ------------------------------------------------------------------
const args = process.argv.slice(2);
if (args.includes('--self-test')) {
  const st = selfTest();
  if (st.failures.length) {
    console.error(`SELF-TEST FAILED — the runner does NOT have teeth:\n  ${st.failures.join('\n  ')}`);
    process.exit(2);
  }
  console.log(`self-test: ${st.pass}/${st.total} malformed fixtures correctly rejected ✓`);
}

const { report, errored, hardFails } = run();
if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));

const c = report.counts;
console.log(`\nskills repo verification — v${c.version} · ${c.skills} skills (${c.receipts} with valid receipts), ${c.agents} agents, ${c.workflows} workflows, ${c.frontDoors} front-doors, ${c.migrations} migrations, ${c.mdFiles} md files`);
console.log(`  install slug: ${report.results.find(r => r.kind === 'install-slug')?.installSlug ?? '—'} (origin: ${report.results.find(r => r.kind === 'install-slug')?.originSlug ?? '—'})`);
for (const r of report.results) {
  for (const e of r.errors) console.log(`  ✗ ${r.file} [${r.kind}] ${e}`);
  for (const w of (r.warnings || [])) console.log(`  ⚠ ${r.file} [${r.kind}] ${w}`);
}
for (const h of hardFails) console.error(`  ‼ ${h}`);
console.log(`  → ${c.errors} errors, ${c.warnings} warnings · artifact: validation-report.json`);

if (hardFails.length || errored.length) {
  console.error(`\nFAILED: ${hardFails.length} hard-fail(s), ${errored.length} file(s) with errors.`);
  process.exit(1);
}
console.log(`\nOK: all ${c.skills + c.agents} skills/agents conform to the Agent Skills contract.`);
