#!/usr/bin/env bash
#
# ai-git-commit.sh — Ask OpenAI for a commit message, then add / commit / push.
#
# Copyright (C) 2026 Lorin
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Usage:
#   ./scripts/ai-git-commit.sh          # confirm before commit/push
#   ./scripts/ai-git-commit.sh -y       # skip confirmation
#   ./scripts/ai-git-commit.sh --dry-run
#
# Requires: git, curl, jq
# Env: OPENAI_API_KEY (or in .env.local at repo root)

set -euo pipefail

AUTO_YES=0
DRY_RUN=0

for arg in "$@"; do
  case "$arg" in
    -y|--yes) AUTO_YES=1 ;;
    --dry-run) DRY_RUN=1 ;;
    -h|--help)
      sed -n '1,20p' "$0" | tail -n +3
      exit 0
      ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "Not a git repository." >&2
  exit 1
}
cd "$ROOT"

load_env() {
  for f in .env.local .env; do
    if [[ -f "$f" ]]; then
      set -a
      # shellcheck disable=SC1090
      source "$f"
      set +a
      return
    fi
  done
}

load_env

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY is not set (export it or add to .env.local)." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required (brew install jq)." >&2
  exit 1
fi

if git diff --quiet && git diff --cached --quiet && [[ -z "$(git ls-files --others --exclude-standard)" ]]; then
  echo "Nothing to commit."
  exit 0
fi

STATUS="$(git status --short)"
DIFF="$(git diff HEAD 2>/dev/null || true)"
STAGED="$(git diff --cached)"
# head closes the pipe early; with pipefail that SIGPIPE would exit 141
UNTRACKED="$(git ls-files --others --exclude-standard | head -200 || true)"

# Keep prompt within reasonable size
truncate() {
  local max=120000
  local s="$1"
  if ((${#s} > max)); then
    printf '%s\n\n[... diff truncated ...]' "${s:0:max}"
  else
    printf '%s' "$s"
  fi
}

DIFF_TRUNC="$(truncate "$DIFF")"
LOG_STYLE="$(git log -5 --oneline 2>/dev/null || true)"

PROMPT="$(cat <<EOF
You are a git commit message assistant. Write ONE commit message for these changes.

Rules:
- 1-2 sentences, imperative mood, focus on why not a file list
- No markdown, no quotes around the whole message, no "Commit message:" prefix
- Match the style of recent commits when possible
- If changes mix unrelated concerns, pick the dominant theme

Recent commits:
${LOG_STYLE}

git status --short:
${STATUS}

Staged diff:
${STAGED:-(none)}

Unstaged diff (vs HEAD):
${DIFF_TRUNC:-(none)}

Untracked files (names only):
${UNTRACKED:-(none)}

Reply with ONLY the commit message text.
EOF
)"

MODEL="${OPENAI_COMMIT_MODEL:-gpt-4o-mini}"

PAYLOAD="$(jq -n \
  --arg model "$MODEL" \
  --arg content "$PROMPT" \
  '{
    model: $model,
    temperature: 0.3,
    messages: [
      { role: "system", content: "You write concise git commit messages." },
      { role: "user", content: $content }
    ]
  }')"

RESPONSE="$(curl -fsS https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer ${OPENAI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")"

COMMIT_MSG="$(echo "$RESPONSE" | jq -r '.choices[0].message.content // empty' \
  | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' \
        -e 's/^["'\''`]//' -e 's/["'\''`]$//' \
        -e '/^Commit message:/Id')"

if [[ -z "$COMMIT_MSG" ]]; then
  echo "OpenAI returned no message:" >&2
  echo "$RESPONSE" | jq . >&2 2>/dev/null || echo "$RESPONSE" >&2
  exit 1
fi

echo ""
echo "Proposed commit message:"
echo "────────────────────────"
echo "$COMMIT_MSG"
echo "────────────────────────"
echo ""

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "Dry run — no git commands executed."
  exit 0
fi

if [[ "$AUTO_YES" -ne 1 ]]; then
  read -r -p "Run: git add . && git commit && git push? [y/N] " confirm
  case "$confirm" in
    y|Y|yes|YES) ;;
    *) echo "Aborted."; exit 0 ;;
  esac
fi

git add .
git commit -m "$COMMIT_MSG"
git push

echo "Done."
