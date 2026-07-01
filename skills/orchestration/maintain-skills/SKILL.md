---
name: maintain-skills
description: The maintenance front-door for this kit — keep an installed copy current the safe way. Detects the install, updates it with a backup + restore-on-failure, runs idempotent migrations, then re-verifies with the validator and shows what changed. Use to upgrade or audit an installed skills kit; never auto-commits.
---

# Maintain the kit — the upgrade workflow

Install is the easy half; the kit's durability lives here. This is the bookend to
`ship-feature`: it keeps an *installed* copy current without breaking the user's state, and —
the part most upgraders skip — **re-verifies after upgrading** so a "successful" update that
silently broke something fails loud. Lifecycle discipline mirrors
[garrytan/gstack](https://github.com/garrytan/gstack)'s `gstack-upgrade`; the verify step is ours.

> **Kick it off — paste this to your agent:**
> *"Maintain the skills kit using maintain-skills: detect my install, update it, run migrations,
> re-verify, and show me what changed — stop for my input at every ⛔."*

Keep the checklist visible. A phase isn't done until its **Gate** holds. Every destructive step
is reversible (backup → act → restore-on-failure).

## Phase 0 — Detect  (never assume topology)
- Find the actual install before touching it: a git checkout vs a vendored copy, global
  (`~/.…/skills/`) vs repo-local, and whether *both* exist (dual install). Read its `VERSION`.
- Mirror: gstack detects `global-git / local-git / vendored / vendored-global` and the dir
  before any step (`gstack-upgrade/SKILL.md:86–112`).
- **Same-named-skill collision:** dual-install detection catches two copies of *this* kit, but not
  a *foreign* kit shipping a skill of the same name. Before updating, check each installed skill
  slug against the incoming set; if a same-named skill resolves to a **different source**, ⛔ stop
  and ask — never clobber a differently-sourced skill of the same name.
- **Gate:** install type + directory + current version known, no unresolved same-named-but-foreign
  collision; or a clear "not installed" exit.

## Phase 1 — Update  (backup → act → restore on failure)
- **Provenance first — don't trust a moving `origin/main`.** Pin the update to an *immutable*
  commit SHA recorded in the kit manifest (fetch, then `reset --hard <sha>`), and/or verify a
  **signed** tag against a pre-trusted key — `git verify-tag <tag>` or `git merge/pull
  --verify-signatures` ([git signature-verification docs](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work));
  if the kit ships via npm, `npm audit signatures`
  ([npm provenance](https://docs.npmjs.com/generating-provenance-statements)). Provenance proves
  chain-of-custody, **not** benign code ([SLSA](https://slsa.dev)) — so Phase 3's validator still
  runs regardless.
- **Git install:** `git stash` (warn if it stashed local edits) → `fetch` → `reset --hard` to the
  **pinned/verified SHA** (not a bare `origin/main`). **Vendored:** clone fresh to a temp dir, move
  the old copy to `.bak`, swap in the new, and **restore the `.bak` if anything fails**
  (`gstack-upgrade/SKILL.md:124–147`).
- **Diff-review before the destructive swap:** surface the incoming changed paths (and the diff)
  at a ⛔ **before** overwriting — not only in the Phase 4 after-the-fact report. `git diff
  --stat <old>..<new>` (or over the staged temp clone) so the user approves *what* lands.
- If there's a dual install, sync the second copy from the freshly-updated primary.
- **Gate:** the working copy is at the new version, or fully rolled back to the old one — never
  a half-applied state.

## Phase 2 — Migrate  (idempotent, done-marked, retry-on-incomplete)
- Run any `migrations/v*.sh` whose version is **newer than the old version**, in SemVer order.
  Each migration is idempotent and writes a done-marker **only when every repair succeeded or
  was provably unnecessary** — on any failure it stays unmarked and **retries next upgrade**
  (that's "no silent skip" applied to upgrades). See [`migrations/README.md`](../../../migrations/README.md).
- **Gate:** every applicable migration ran; each is either done-marked or explicitly left to
  retry with the reason — none silently skipped.

## Phase 3 — Verify  (the step gstack doesn't have)
- Run the kit's own runner: `npm test` (self-test + `validate.mjs`). An upgrade that left the
  kit malformed, a workflow unparseable, or the install slug drifted **fails here, loudly**.
- **Gate:** the validator is green on the upgraded copy — or the upgrade is rolled back. A green
  upgrade that can't pass its own validator is not a successful upgrade.

## Phase 4 — Report  (what changed; never auto-commit)
- Read `CHANGELOG.md`; summarize the entries between old→new as 5–7 user-facing bullets.
- For a vendored/dual install, tell the user which paths changed and **let them commit** — like
  the migrations, maintenance **never runs `git commit`/`push`** (`migrations/v1.40.0.0.sh:139–140`).
- **Gate:** the user has a from→to version, a what-changed summary, and any commit left to them.

## How to run it
- **Any harness — drive it manually.** Follow the phases; the agent detects, updates, migrates,
  verifies, reports, pausing at each ⛔.
- **Claude Code — one command.** [`workflows/maintain.mjs`](../../../workflows/maintain.mjs)
  codifies this pipeline as a runnable dynamic workflow.

## Progress checklist (the agent keeps this visible)
```
[ ] 0 Detected   — install type + dir + current version (or "not installed")
[ ] 1 Updated    — at new version, or fully rolled back (never half-applied)
[ ] 2 Migrated   — applicable migrations ran; done-marked or retrying-with-reason
[ ] 3 Verified   — npm test green on the upgraded copy (or rolled back)
[ ] 4 Reported   — from→to + what-changed; commit left to the user
```

## Done when
The installed copy is at the new version (or cleanly rolled back), every applicable migration
either completed or is honestly left to retry, the validator is **green on the upgraded copy**,
and the user has a what-changed summary — with nothing committed on their behalf.

## Receipt

Prove the upgrade landed safely and was re-verified (see [RECEIPTS.md](../../../RECEIPTS.md)):

```
Claim: installed kit updated to the new version safely — or cleanly rolled back
- Version: <from → to>
- Migrations: <which ran · each done-marked or left retrying with its reason>
- Re-verify: <validator green on the upgraded copy — the step that proves it didn't break>
- What's NOT proven: <left to the user — nothing auto-committed; any dual-install path not synced>
```
