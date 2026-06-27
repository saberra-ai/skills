#!/bin/sh
# Portable installer for the saberra-ai/skills kit.
#
# POSIX sh — no bash arrays, no [[ ]], no PATH assumptions. It is meant to be PIPED TO sh,
# so your interactive shell does not parse it (fish / zsh / etc. are all fine):
#
#   curl -fsSL https://raw.githubusercontent.com/saberra-ai/skills/main/install.sh | sh
#   wget -qO-  https://raw.githubusercontent.com/saberra-ai/skills/main/install.sh | sh
#
# Override destinations with env vars (still shell-agnostic — set them inline before `sh`):
#   curl -fsSL .../install.sh | SKILLS_DIR=$HOME/.codex/skills sh
#
#   SKILLS_DIR     where SKILL.md files go     (default: ~/.claude/skills)
#   AGENTS_DIR     where subagent .md files go  (default: ~/.claude/agents)
#   WORKFLOWS_DIR  where .mjs orchestrators go  (default: ~/.claude/workflows)
#   REF           git ref to install from       (default: main)

set -eu

REF="${REF:-main}"
RAW="https://raw.githubusercontent.com/saberra-ai/skills/${REF}"
SKILLS_DIR="${SKILLS_DIR:-${HOME}/.claude/skills}"
AGENTS_DIR="${AGENTS_DIR:-${HOME}/.claude/agents}"
WORKFLOWS_DIR="${WORKFLOWS_DIR:-${HOME}/.claude/workflows}"

# fetch <url> -> stdout, using whichever of curl/wget exists (no PATH assumptions).
fetch() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- "$1"
  else
    echo "error: need curl or wget on PATH" >&2
    exit 1
  fi
}

echo "saberra-ai/skills — installing from ${REF}"
echo "  skills    -> ${SKILLS_DIR}"
echo "  agents    -> ${AGENTS_DIR}"
echo "  workflows -> ${WORKFLOWS_DIR}"

manifest="$(fetch "${RAW}/manifest.json")"

# Parse the "path" values without jq. The manifest is machine-generated with one path per
# line, so a grep/sed extraction is stable and dependency-free. No arrays — a newline list
# fed through `while read`, which every POSIX shell handles identically.
paths="$(printf '%s\n' "${manifest}" | grep -o '"path"[ ]*:[ ]*"[^"]*"' | sed 's/.*"path"[ ]*:[ ]*"//; s/"$//')"

if [ -z "${paths}" ]; then
  echo "error: no paths found in manifest.json (is ${RAW}/manifest.json reachable?)" >&2
  exit 1
fi

count=0
printf '%s\n' "${paths}" | while IFS= read -r p; do
  [ -n "${p}" ] || continue
  case "${p}" in
    skills/*)
      name="$(basename "$(dirname "${p}")")"
      dest="${SKILLS_DIR}/${name}/SKILL.md" ;;
    agents/*)
      name="$(basename "${p}" .md)"
      dest="${AGENTS_DIR}/${name}.md" ;;
    workflows/*)
      dest="${WORKFLOWS_DIR}/$(basename "${p}")" ;;
    *)
      continue ;;
  esac
  mkdir -p "$(dirname "${dest}")"
  fetch "${RAW}/${p}" > "${dest}"
  echo "  + ${dest}"
  count=$((count + 1))
done

# Doctrine: save it next to the skills and tell the user to point their AGENTS.md / CLAUDE.md at it.
mkdir -p "${SKILLS_DIR}"
doctrine="${SKILLS_DIR}/saberra-ai.AGENTS.md"
fetch "${RAW}/AGENTS.md" > "${doctrine}"
echo "  + ${doctrine}  (the build doctrine)"

echo ""
echo "Done. Point your AGENTS.md / CLAUDE.md at: ${doctrine}"
echo "Use it: ask your agent to e.g. \"use the verify-capability skill\", or \"Ship X using ship-feature\"."
