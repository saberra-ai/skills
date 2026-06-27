# skills

A small, opinionated kit of **harness-agnostic agent skills** — the build doctrine and
reusable workflows behind a way of building with AI agents that actually holds up:
mirror references instead of guessing, prove capabilities (green ≠ verified), harden
adversarially, research decisions instead of winging them.

Works with **any coding agent** (Claude Code, Cursor, Codex, Copilot, …) and any model.
Distilled from real, shipped work — not aspirational.

## Install

```bash
npx skills@latest add saberra-ai/skills
```

Pick the skills you want and which agents to install them on. (The skills are plain
markdown with frontmatter — you can also just copy a `SKILL.md` into your agent's skills
dir, or point your `AGENTS.md` at this repo's [`AGENTS.md`](AGENTS.md).)

## What's in here

### Skills (`skills/`)

| Skill | Does |
|---|---|
| **engineering/mirror-reference** | Build a non-trivial feature by mirroring the canonical OSS implementation — clone it, read it, build to it citing `file:line`, parity-check. Don't guess. |
| **engineering/verify-capability** | Prove a capability works: real input → objective metric → inspectable artifact → a runner that **fails loud on silent skips**. Green ≠ verified. |
| **engineering/adversarial-harden** | Break fast-built code on purpose — find REAL bugs with a repro, fix forward with a regression test, pin invariants. |
| **decisions/research-decision** | Resolve an unsure product/eng call: web-search the best practice, cite it, **recommend** (not survey). |
| **orchestration/ship-feature** | The **front-door workflow** — kick off one feature and it drives build → verify → harden as gated phases that hand off to the skills above. Runnable two ways: drive the phases manually in any harness, or run [`workflows/ship-feature.mjs`](workflows/ship-feature.mjs) as a one-command [dynamic workflow](https://code.claude.com/docs/en/workflows) in Claude Code. |

### Subagents (`agents/`)

`reference-builder`, `capability-verifier`, `hardener` — the same disciplines as
dispatchable subagent roles (drop into `.claude/agents/` or your harness's equivalent).

### Doctrine (`AGENTS.md`)

The cross-harness build agreements these skills encode. Point your project's `AGENTS.md`
(or `CLAUDE.md`) at it, or copy the principles in.

## Why this exists

Agent *scaffolding* does real work independent of the model — the same model with
different scaffolding can score very differently. These skills are that scaffolding,
captured so the quality is reproducible without re-explaining it each session. The one
non-negotiable: **a verification substrate** (a runner that can't be fooled by a green
suite) is what turns "build it well" from a vibe into a guarantee.

## Verification

This repo holds *itself* to the bar it preaches (green ≠ verified). The capability under
test — **"every skill/agent is well-formed and the repo installs"** — is checked by a runner,
not by trust:

```bash
npm test          # self-test (proves the runner has teeth) → validate the repo
npm run validate  # just validate
```

[`scripts/validate.mjs`](scripts/validate.mjs) enforces the real [Agent Skills
contract](https://agentskills.io/specification) the `skills` CLI reads — `name`
(lowercase/digits/hyphens, ≤64, not reserved, **must match its directory**) and `description`
(≤1024, third-person, with a trigger cue) — plus cross-link integrity and an install-slug
regression pin (the README's `skills add <slug>` must equal the git origin). It climbs the
ladder:

| Rung | What it means here |
|---|---|
| **S** | every `SKILL.md` / agent parses |
| **SS** | checked against the *real* frontmatter schema, not a guess |
| **SSS** | objective metric — per-file pass/fail + counts, no prose |
| **SSS+** | inspectable artifact — `validation-report.json` |
| **SSS++** | contract parity — `name === dir`, install slug === origin |
| **SSS+++** | **no silent skip** — zero discovered files is a hard fail; every file is graded; `--self-test` injects malformed fixtures and fails if any slips through |

It runs in [CI](.github/workflows/validate.yml) on every push and PR, so a malformed skill, a
broken cross-link, or a drifted install slug fails the build — and the artifact is uploaded
for inspection. (It already caught four real broken links and a slug drift on first run.)

**Honest gap:** the live end-to-end `npx skills add saberra-ai/skills` is an *interactive*
selection flow, so it isn't run non-interactively in CI. The runner verifies the contract that
command reads — the structure and schema it consumes — rather than faking a headless install.

## License

MIT — see [LICENSE](LICENSE).
