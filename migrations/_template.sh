#!/usr/bin/env bash
# Migration template — copy to v{VERSION}.sh and fill in the repairs.
# Pattern: idempotent · done-marked · retry-on-incomplete · per-item independent · never commit.
# Mirrors garrytan/gstack gstack-upgrade/migrations/v1.40.0.0.sh.
set -u

STATE_ROOT="${HOME}/.saberra-skills"          # where an installed copy keeps its state
MIGRATION_DIR="${STATE_ROOT}/.migrations"
DONE="${MIGRATION_DIR}/_template.done"        # rename to v{VERSION}.done

mkdir -p "${MIGRATION_DIR}" 2>/dev/null || true
[ -f "${DONE}" ] && exit 0                      # already applied → no-op

incomplete=0                                    # any failed/partial repair flips this to 1

# ---- repairs (each idempotent + per-item independent) --------------------
# Example shape — replace with the real fix:
#
#   TARGET="${STATE_ROOT}/config.yaml"
#   if [ -f "${TARGET}" ]; then
#     if ! grep -Fq 'new_setting:' "${TARGET}" 2>/dev/null; then        # gate: not already present
#       if printf '%s\n' 'new_setting: true' >> "${TARGET}" 2>/dev/null; then
#         echo "  [_template] added new_setting" >&2
#       else
#         echo "  [_template] WARN: failed to write ${TARGET}; will retry next upgrade." >&2
#         incomplete=1                                                    # → skip the marker
#       fi
#     fi
#   fi

# ---- done-marker discipline ----------------------------------------------
if [ "${incomplete}" = "0" ]; then
  touch "${DONE}"                               # only when fully applied or provably unnecessary
else
  echo "  [_template] INFO: marker not written; will retry on next upgrade." >&2
fi

# NEVER `git commit` / `git push` from a migration — the user controls when changes ship.
exit 0
