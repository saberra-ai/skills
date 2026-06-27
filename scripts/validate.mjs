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

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RESERVED = ['claude', 'anthropic'];
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NAME_MAX = 64;
const DESC_MAX = 1024;
const DESC_MIN = 40; // a one-liner with what+when is always longer than this
const FIRST_PERSON = [/^\s*i\s/i, /\bi can help\b/i, /\byou can use this\b/i];
const TRIGGER_CUE = /\b(use (when|whenever|for|after|instead|to)|when you|dispatch|reach for)\b/i;

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

// internal markdown links must resolve (skip http/anchors); [[wikilinks]] must
// name a real skill/agent if any exist.
function checkLinks(file, skillNames, agentNames) {
  const errors = [];
  const text = readFileSync(file, 'utf8');
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
  const agents = agentFiles.map(checkAgent);
  const skillNames = new Set(skills.map(s => s.name).filter(Boolean));
  const agentNames = new Set(agents.map(a => a.name).filter(Boolean));

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

  const results = [...skills, ...agents, ...links, slugCheck];
  const errored = results.filter(r => !r.ok);
  const warned = results.filter(r => r.warnings?.length);
  const report = {
    schema: 'agent-skills/v1',
    counts: { skills: skills.length, agents: agents.length, mdFiles: mdFiles.length, errors: errored.length, warnings: warned.reduce((n, r) => n + r.warnings.length, 0) },
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
  const tmp = mkdtempSync(join(tmpdir(), 'skills-selftest-'));
  let pass = 0;
  const failures = [];
  for (const [label, content, assert] of cases) {
    // name-from-dir cases need the dir basename to differ; use the label-derived dir
    // name!=dir needs a dir whose basename differs from the frontmatter name.
    const dir = label === 'name!=dir' ? join(tmp, 'rightdir') : join(tmp, label.replace(/\W+/g, '-'));
    const fp = join(dir, 'SKILL.md');
    mkdirSync(dir, { recursive: true });
    writeFileSync(fp, content);
    const graded = checkSkill(fp);
    if (assert(graded)) pass++;
    else failures.push(`${label}: expected rejection but got errors=[${graded.errors.join('; ')}]`);
  }
  rmSync(tmp, { recursive: true, force: true });
  return { total: cases.length, pass, failures };
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
console.log(`\nskills repo verification — ${c.skills} skills, ${c.agents} agents, ${c.mdFiles} md files`);
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
