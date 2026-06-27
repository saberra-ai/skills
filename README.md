# skills

A small, opinionated kit of **harness-agnostic agent skills** — the build doctrine and
reusable workflows behind a way of building with AI agents that actually holds up:
mirror references instead of guessing, prove capabilities (green ≠ verified), harden
adversarially, research decisions instead of winging them.

Works with **any coding agent** (Claude Code, Cursor, Codex, Copilot, …) and any model.
Distilled from real, shipped work — not aspirational.

## Install

```bash
npx skills@latest add victorlopez/skills
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
| **orchestration/ship-feature** | The build → verify → harden pipeline for shipping a feature the disciplined way. |

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

## License

MIT — see [LICENSE](LICENSE).
