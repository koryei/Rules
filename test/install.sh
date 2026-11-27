#!/usr/bin/env bash
# Installer tests: nothing the person already has in their git setup is replaced.
#
#   ./test/install.sh
#
# Each case installs into its own throwaway HOME. Your real files and git
# config are never touched. Exits non-zero on failure.
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="$(mktemp -d)"
pass=0
fail=0

t() { # name expected actual
  if [ "$2" = "$3" ]; then
    printf '  ✓ %s\n' "$1"; pass=$((pass+1))
  else
    printf '  ✗ %s (want %s, got %s)\n' "$1" "$2" "$3"; fail=$((fail+1))
  fi
}

# A fresh HOME holding a copy of this checkout where the installer expects it.
new_home() {
  H="$ROOT/$1"
  mkdir -p "$H/.config/git-policy" "$H/.git-hooks"
  cp -R "$REPO/bin" "$REPO/hooks" "$REPO/install.sh" "$H/.config/git-policy/"
}

# A fresh HOME holding the checkout somewhere else entirely.
new_home_elsewhere() {
  H="$ROOT/$1"
  mkdir -p "$H/src/rules" "$H/.git-hooks"
  cp -R "$REPO/bin" "$REPO/hooks" "$REPO/install.sh" "$H/src/rules/"
}

in_home() {
  env -i HOME="$H" PATH="$H/.local/bin:$PATH" TERM=dumb GIT_CONFIG_NOSYSTEM=1 "$@" </dev/null
}

install_from() { OUT="$(in_home "$1" 2>&1)"; STATUS=$?; }
install_here() { install_from "$H/.config/git-policy/install.sh"; }
hooks_path()   { in_home git config --global --get core.hooksPath || echo unset; }
said()         { case "$OUT" in *"$1"*) echo yes ;; *) echo no ;; esac; }
check_status() { in_home rules check >/dev/null 2>&1; echo $?; }
active()       { local o; o="$(in_home rules check 2>/dev/null)"; printf '%s' "$o" | grep -o '[0-3]/3 active' || echo none; }

printf '\n  Agent Rules · installer tests\n\n'

new_home fresh
install_here
t "fresh install succeeds" 0 "$STATUS"
t "fresh install sets the hooks path" "$H/.git-hooks" "$(hooks_path)"
t "fresh install passes the health check" 0 "$(check_status)"
install_here
t "second run keeps the same hooks path" "$H/.git-hooks" "$(hooks_path)"
t "second run still passes the health check" 0 "$(check_status)"

new_home elsewhere
in_home git config --global core.hooksPath "$H/my-hooks"
install_here
t "existing hooks path is not replaced" "$H/my-hooks" "$(hooks_path)"
t "installer says it left it alone" yes "$(said 'left your git hooks alone')"
t "health check reports inactive hooks" "0/3 active" "$(active)"
t "health check fails while inactive" 1 "$(check_status)"

new_home tilde
in_home git config --global core.hooksPath '~/.git-hooks'
install_here
t "a ~ path to the same folder counts as ours" "3/3 active" "$(active)"

new_home dormant
printf '#!/bin/sh\necho mine\n' > "$H/.git-hooks/pre-commit"
install_here
t "own hook file survives" "echo mine" "$(sed -n 2p "$H/.git-hooks/pre-commit")"
t "dormant hooks are not switched on" unset "$(hooks_path)"

new_home mixed
printf '#!/bin/sh\necho mine\n' > "$H/.git-hooks/pre-commit"
chmod +x "$H/.git-hooks/pre-commit"
in_home git config --global core.hooksPath "$H/.git-hooks"
install_here
t "own active hook survives" "echo mine" "$(sed -n 2p "$H/.git-hooks/pre-commit")"
t "health check counts only ours" "2/3 active" "$(active)"

new_home custom
{ cat "$REPO/hooks/_dispatch"; echo '# my addition'; } > "$H/.git-hooks/_dispatch"
chmod +x "$H/.git-hooks/_dispatch"
install_here
t "customised dispatcher survives" "# my addition" "$(tail -1 "$H/.git-hooks/_dispatch")"
t "customised dispatcher still runs the hooks" "3/3 active" "$(active)"

new_home foreign
printf '#!/bin/sh\nexit 0\n' > "$H/.git-hooks/_dispatch"
install_here
t "unrelated dispatcher survives" "exit 0" "$(sed -n 2p "$H/.git-hooks/_dispatch")"
t "unrelated dispatcher is not switched on" unset "$(hooks_path)"

# A clone outside ~/.config/git-policy: the dispatcher has to find the policy
# hooks from wherever the repo actually lives.
new_home_elsewhere relocated
install_from "$H/src/rules/install.sh"
t "install from another path succeeds" 0 "$STATUS"
t "install from another path records the hooks directory" "$H/src/rules/hooks" "$(cat "$H/.git-hooks/_policy")"
t "install from another path activates the hooks" "3/3 active" "$(active)"

# Active is a claim; this is the proof. A commit on main must be refused.
commit_on_main() {
  in_home sh -c 'T=$(mktemp -d); cd "$T" || exit 9
    git init -q -b main
    git config user.email t@e.com; git config user.name T
    echo a > a; git add a; git commit -qm "chore: init" >/dev/null 2>&1
    echo b >> a; git add a; git commit -qm "feat: second" >/dev/null 2>&1
    echo $?'
}
t "hooks fire from another install path" 1 "$(commit_on_main)"

# A pointer that no longer resolves must not read as healthy.
new_home stale
install_here
printf '%s\n' "$H/nowhere" > "$H/.git-hooks/_policy"
t "a stale policy path is reported inactive" "0/3 active" "$(active)"
t "a stale policy path fails the health check" 1 "$(check_status)"

# A dispatcher from before _policy cannot be repointed, so it is replaced.
new_home oldstyle
printf '#!/bin/sh\npolicy="$HOME/.config/git-policy/hooks/$name"\n' > "$H/.git-hooks/_dispatch"
chmod +x "$H/.git-hooks/_dispatch"
install_here
t "an old dispatcher is replaced" yes "$(said 'replaced the old dispatcher')"
t "an old dispatcher is replaced with one that works" "3/3 active" "$(active)"

rm -rf "$ROOT"
printf '\n  %d passed' "$pass"
[ "$fail" -eq 0 ] && { printf '\n\n'; exit 0; }
printf ', %d failed\n\n' "$fail"
exit 1
