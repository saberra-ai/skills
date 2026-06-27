#!/usr/bin/env node
// Generate manifest.json — the machine-queryable index an AI agent fetches to install the kit
// with nothing but HTTP-GET + file-write (no npm, no `skills` CLI). One stable raw URL lists
// every skill/agent/workflow and its raw path; the agent fetches each and writes it locally.
//
//   node scripts/gen-manifest.mjs    (or: npm run manifest)
//
// The validator (scripts/validate.mjs) cross-checks the committed manifest against its own
// independent file discovery, so a new skill that isn't in the manifest fails CI — the manifest
// can't silently go stale and drop a skill from installs.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, basename, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, pred, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue;
    const p = join(dir, name);
    statSync(p).isDirectory() ? walk(p, pred, out) : pred(p) && out.push(p);
  }
  return out;
}
const rel = p => relative(ROOT, p).split('\\').join('/');

function originSlug() {
  const cfg = join(ROOT, '.git', 'config');
  if (existsSync(cfg)) {
    const m = readFileSync(cfg, 'utf8').match(/github\.com[:/]([\w.-]+\/[\w.-]+?)(?:\.git)?\s*$/m);
    if (m) return m[1];
  }
  return 'saberra-ai/skills';
}

export function buildManifest(root = ROOT) {
  const slug = originSlug();
  const skills = walk(join(root, 'skills'), p => basename(p) === 'SKILL.md')
    .map(p => ({ name: basename(dirname(p)), path: rel(p) })).sort((a, b) => a.name.localeCompare(b.name));
  const agents = walk(join(root, 'agents'), p => p.endsWith('.md'))
    .map(p => ({ name: basename(p).replace(/\.md$/, ''), path: rel(p) })).sort((a, b) => a.name.localeCompare(b.name));
  const workflows = walk(join(root, 'workflows'), p => p.endsWith('.mjs'))
    .map(p => ({ name: basename(p).replace(/\.mjs$/, ''), path: rel(p) })).sort((a, b) => a.name.localeCompare(b.name));
  const version = existsSync(join(root, 'VERSION')) ? readFileSync(join(root, 'VERSION'), 'utf8').trim() : null;
  return {
    name: slug,
    version,
    repo: `https://github.com/${slug}`,
    raw_base: `https://raw.githubusercontent.com/${slug}/main`,
    doctrine: 'AGENTS.md',
    skills,
    agents,
    workflows,
  };
}

// Run directly → write the file. Imported (by the validator) → just export buildManifest.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = buildManifest();
  writeFileSync(join(ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`manifest.json — v${manifest.version} · ${manifest.skills.length} skills, ${manifest.agents.length} agents, ${manifest.workflows.length} workflows`);
}
