# Changelog

All notable changes to this kit are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · versioning: [SemVer](https://semver.org).

## [0.2.0] — 2026-06-27

### Added
- **Maintenance lifecycle** — the kit now has an install→maintenance loop, not just install.
  - `maintain-skills` front-door skill + runnable [`workflows/maintain.mjs`](workflows/maintain.mjs):
    detect the install, update it (with a backup + restore-on-failure), run any pending
    migrations, then **re-verify with `validate.mjs`** — a *verified* upgrade.
  - `VERSION` + this changelog as the lifecycle backbone ("what changed" is now answerable).
  - `migrations/` — idempotent, done-marked, **retry-on-incomplete** upgrade scripts
    (pattern in [`migrations/README.md`](migrations/README.md) and `AGENTS.md` §9).
- Validator (`scripts/validate.mjs`) extended to grade the lifecycle: `VERSION` is SemVer and
  matches `package.json`; `CHANGELOG` has an entry for the current version; migration scripts
  parse (`bash -n`). Self-test grows teeth for each.

### Notes
- Lifecycle discipline mirrors [garrytan/gstack](https://github.com/garrytan/gstack)'s
  reversible, migration-based upgrades (`gstack-upgrade/SKILL.md`, `migrations/v1.40.0.0.sh`) —
  adapted to this kit's scale and **verified by our own substrate**, which is the edge gstack lacks.

## [0.1.0] — 2026-06-27

### Added
- Initial kit: the build doctrine (`AGENTS.md`), 5 skills, 3 subagents, the `ship-feature`
  front-door workflow + runnable orchestrator, and the self-verifying `validate.mjs` substrate
  (green ≠ verified — fails loud on silent skips, proves its own teeth via `--self-test`).
