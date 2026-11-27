#!/usr/bin/env bash
# Apply a "protect the default branch" ruleset to GitHub repos.
#
# This is the layer that cannot be bypassed: it holds even when an agent runs
# `git commit --no-verify`, edits a file in the web UI, or works from another
# machine.
#
#   ./apply-github-ruleset.sh --dry-run --all
#   ./apply-github-ruleset.sh --all
#   ./apply-github-ruleset.sh koryei/some-repo koryei/other-repo
#
# Flags:
#   --all        every repo you own (skips forks and archived repos)
#   --dry-run    print what would change, touch nothing
#   --linear     also require linear history (no merge commits)
#   --checks     also require status checks to pass before merge
set -uo pipefail

RULESET_NAME="protect-default-branch"
DRY_RUN=0
ALL=0
LINEAR=0
CHECKS=0
REPOS=()

while [ $# -gt 0 ]; do
  case "$1" in
    --all)     ALL=1 ;;
    --dry-run) DRY_RUN=1 ;;
    --linear)  LINEAR=1 ;;
    --checks)  CHECKS=1 ;;
    -h|--help) sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)         REPOS+=("$1") ;;
  esac
  shift
done

command -v gh >/dev/null || { echo "gh not installed" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "gh not authenticated: run 'gh auth login'" >&2; exit 1; }

OWNER=$(gh api user -q .login)

if [ "$ALL" = "1" ]; then
  while IFS= read -r r; do REPOS+=("$r"); done < <(
    gh repo list "$OWNER" --limit 1000 --json name,isFork,isArchived \
      -q '.[] | select(.isFork==false and .isArchived==false) | "'"$OWNER"'/" + .name'
  )
fi

if [ ${#REPOS[@]} -eq 0 ]; then
  echo "no repos given. pass --all or a list of owner/repo." >&2
  exit 1
fi

build_payload() {
  local rules
  rules='{"type":"deletion"},{"type":"non_fast_forward"},{"type":"pull_request","parameters":{"required_approving_review_count":0,"dismiss_stale_reviews_on_push":false,"require_code_owner_review":false,"require_last_push_approval":false,"required_review_thread_resolution":false}}'
  [ "$LINEAR" = "1" ] && rules="$rules"',{"type":"required_linear_history"}'
  [ "$CHECKS" = "1" ] && rules="$rules"',{"type":"required_status_checks","parameters":{"strict_required_status_checks_policy":true,"required_status_checks":[]}}'
  cat <<JSON
{
  "name": "$RULESET_NAME",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] }
  },
  "rules": [ $rules ]
}
JSON
}

PAYLOAD=$(build_payload)
ok=0; skipped=0; failed=0

for repo in "${REPOS[@]}"; do
  # Skip empty repos: a ruleset on a repo with no commits is pointless and noisy.
  if ! gh api "repos/$repo" -q .default_branch >/dev/null 2>&1; then
    printf '  skip    %s (not accessible)\n' "$repo"; skipped=$((skipped+1)); continue
  fi

  existing=$(gh api "repos/$repo/rulesets" -q \
    ".[] | select(.name==\"$RULESET_NAME\") | .id" 2>/dev/null | head -1)

  if [ "$DRY_RUN" = "1" ]; then
    if [ -n "$existing" ]; then
      printf '  update  %s (ruleset %s)\n' "$repo" "$existing"
    else
      printf '  create  %s\n' "$repo"
    fi
    ok=$((ok+1)); continue
  fi

  if [ -n "$existing" ]; then
    if printf '%s' "$PAYLOAD" | gh api -X PUT "repos/$repo/rulesets/$existing" --input - >/dev/null 2>&1; then
      printf '  updated %s\n' "$repo"; ok=$((ok+1))
    else
      printf '  FAILED  %s (update)\n' "$repo"; failed=$((failed+1))
    fi
  else
    if printf '%s' "$PAYLOAD" | gh api -X POST "repos/$repo/rulesets" --input - >/dev/null 2>&1; then
      printf '  created %s\n' "$repo"; ok=$((ok+1))
    else
      printf '  FAILED  %s (create)\n' "$repo"; failed=$((failed+1))
    fi
  fi
done

echo
printf 'ok: %d   skipped: %d   failed: %d\n' "$ok" "$skipped" "$failed"
[ "$DRY_RUN" = "1" ] && echo "(dry run, nothing changed)"
[ "$failed" -gt 0 ] && exit 1
exit 0
