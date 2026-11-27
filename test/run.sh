#!/usr/bin/env bash
# Test suite for the git policy hooks.
#
#   ./test/run.sh
#
# Creates a throwaway repo, tries the things the hooks are meant to block,
# and checks that each one is actually blocked. Exits non-zero on failure.
set -uo pipefail

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  R=$'\033[31m'; G=$'\033[32m'; D=$'\033[2m'; B=$'\033[1m'; X=$'\033[0m'
else
  R=""; G=""; D=""; B=""; X=""
fi

pass=0
fail=0

t() { # name expected actual
  if [ "$2" = "$3" ]; then
    printf '  %s✓%s %s\n' "$G" "$X" "$1"; pass=$((pass+1))
  else
    printf '  %s✗%s %s %s(want %s, got %s)%s\n' "$R" "$X" "$1" "$D" "$2" "$3" "$X"
    fail=$((fail+1))
  fi
}

printf '\n  %sAgent Rules%s %s· hook test suite%s\n' "$B" "$X" "$D" "$X"
printf '  %s%s%s\n\n' "$D" "$(printf '─%.0s' $(seq 1 60))" "$X"

T=$(mktemp -d)/rules-test
mkdir -p "$T" && cd "$T" || exit 1
git init -q -b main
git config user.email test@example.com
git config user.name Test
echo hello > a.txt

# --- branch protection ---
git add a.txt
git commit -qm "chore: initial scaffold" >/dev/null 2>&1
t "initial commit on main allowed" 0 $?

echo more >> a.txt; git add a.txt
git commit -qm "feat: add more" >/dev/null 2>&1
t "commit on main blocked" 1 $?

# --- commit message format ---
git switch -qc feat/test
git commit -qm "updated stuff" >/dev/null 2>&1
t "non-conventional message blocked" 1 $?

git commit -qm "feat: this subject is deliberately far too long to fit inside the seventy two character limit" >/dev/null 2>&1
t "overlong subject blocked" 1 $?

git commit -qm "feat(core): add more content" >/dev/null 2>&1
t "conventional commit allowed" 0 $?

# --- secrets ---
echo "SECRET=1" > .env; git add -f .env
git commit -qm "chore: add env" >/dev/null 2>&1
t ".env blocked" 1 $?
git restore --staged .env 2>/dev/null; rm -f .env

FAKE="ghp_$(printf 'a%.0s' $(seq 1 36))"
printf 'k="%s"\n' "$FAKE" > leak.js; git add leak.js
git commit -qm "feat: add client" >/dev/null 2>&1
t "github token blocked" 1 $?
git restore --staged leak.js 2>/dev/null; rm -f leak.js

# --- conflict markers ---
printf '<<<<<<< HEAD\nx\n=======\ny\n>>>>>>> other\n' > c.txt; git add c.txt
git commit -qm "feat: resolve" >/dev/null 2>&1
t "conflict markers blocked" 1 $?
git restore --staged c.txt 2>/dev/null; rm -f c.txt

# --- push protection ---
git init -q --bare ../remote.git
git remote add origin ../remote.git
git switch -q main
git push -q origin main >/dev/null 2>&1
t "push to main blocked" 1 $?

git switch -q feat/test
git push -q origin feat/test >/dev/null 2>&1
t "push feature branch allowed" 0 $?

printf '\n'
if [ "$fail" -eq 0 ]; then
  printf '  %s%d passed%s\n\n' "$G" "$pass" "$X"
  exit 0
else
  printf '  %s%d passed, %d failed%s\n\n' "$R" "$pass" "$fail" "$X"
  exit 1
fi
