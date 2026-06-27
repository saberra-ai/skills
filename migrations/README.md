# Migrations

State fixes that an `npm`/`git` update alone can't cover — stale config, orphaned files, a
changed directory layout in a user's *installed* copy. Run by the `maintain-skills` workflow
during an upgrade. The pattern is adapted from
[garrytan/gstack](https://github.com/garrytan/gstack)'s `gstack-upgrade/migrations/`.

## Rules (every migration honors these)

1. **Named `v{VERSION}.sh`** (SemVer). The runner applies a migration only when upgrading
   *from an older version* than its name, in `sort -V` order.
2. **Idempotent.** Every change is gated on "not already present" — re-running is a no-op.
   Never assume the prior state; check, then act.
3. **Done-marked, retry-on-incomplete.** Track an `incomplete` flag. Write the
   `.migrations/v{VERSION}.done` marker **only when every repair succeeded or was provably
   unnecessary.** On *any* failure (missing tool, broken file, failed write), set
   `incomplete=1` and **skip the marker** so the next upgrade retries. This is the kit's
   "no silent skip" rule applied to upgrades — a migration that couldn't finish must not
   claim it did.
4. **Per-item independent.** If one file/step can't be repaired, still repair the others.
5. **Degrade gracefully.** A missing dependency or malformed input → warn to stderr and mark
   incomplete; never crash the upgrade.
6. **Reversible-minded & never auto-commit.** Back up before destructive edits. **Never run
   `git commit`/`push`** — the user controls when changes ship.

Start from [`_template.sh`](_template.sh) (copy it to `v{VERSION}.sh`). The validator
(`scripts/validate.mjs`) checks every `migrations/*.sh` parses (`bash -n`).
