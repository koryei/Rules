#!/usr/bin/env bash
# Install rules: put the CLI on PATH, create the rules file, fan it out.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"
CANON="${RULES_FILE:-$HOME/AGENTS.md}"

say() { printf '  %s\n' "$1"; }
ok()  { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn(){ printf '  \033[33m!\033[0m %s\n' "$1"; }

printf '\n  Agent Rules installer\n  ────────────────────────────────────────────\n\n'

# 1. CLI on PATH
mkdir -p "$BIN_DIR"
chmod +x "$HERE/bin/rules" "$HERE/hooks/"* "$HERE/bin/sync-agent-rules.sh" 2>/dev/null
ln -sf "$HERE/bin/rules" "$BIN_DIR/rules"
ok "linked $BIN_DIR/rules"

case ":$PATH:" in
  *":$BIN_DIR:"*) ok "$BIN_DIR is on PATH" ;;
  *)
    warn "$BIN_DIR is not on PATH"
    say "  add this to your shell profile:"
    case "${SHELL:-}" in
      */fish) say "    fish_add_path $BIN_DIR" ;;
      */zsh)  say "    echo 'export PATH=\"$BIN_DIR:\$PATH\"' >> ~/.zshrc" ;;
      *)      say "    echo 'export PATH=\"$BIN_DIR:\$PATH\"' >> ~/.bashrc" ;;
    esac
    ;;
esac

# 2. rules file
if [ -f "$CANON" ]; then
  ok "$CANON already exists, leaving it alone"
else
  "$BIN_DIR/rules" init >/dev/null 2>&1 && ok "created $CANON"
fi

# 3. fan out
printf '\n'
"$HERE/bin/sync-agent-rules.sh"

# 4. git hooks
# Anything of yours stays: a hooks path, a hook file or a customised
# dispatcher is never replaced. A dispatcher from before _policy is the one
# exception: it cannot be repointed, so it is replaced and the installer says so.
printf '\n'
HOOKS_DIR="$HOME/.git-hooks"
mkdir -p "$HOOKS_DIR"
current=$(git config --global --path --get core.hooksPath 2>/dev/null)
usable=1
kept=""

if [ ! -e "$HOOKS_DIR/_dispatch" ] && [ ! -L "$HOOKS_DIR/_dispatch" ]; then
  cp "$HERE/hooks/_dispatch" "$HOOKS_DIR/_dispatch"
  chmod +x "$HOOKS_DIR/_dispatch"
  ok "installed the hook dispatcher"
elif grep -q 'git-policy/hooks' "$HOOKS_DIR/_dispatch" 2>/dev/null; then
  if grep -q '_policy' "$HOOKS_DIR/_dispatch" 2>/dev/null; then
    ok "kept the dispatcher at $HOOKS_DIR/_dispatch"
  else
    cp "$HERE/hooks/_dispatch" "$HOOKS_DIR/_dispatch"
    chmod +x "$HOOKS_DIR/_dispatch"
    warn "replaced the old dispatcher at $HOOKS_DIR/_dispatch"
    say "  it looked for the policy hooks in one fixed path; re-add any local edits"
  fi
else
  usable=0
  warn "existing dispatcher at $HOOKS_DIR/_dispatch does not call the policy hooks"
  say "  add this before its local-hook handoff:"
  say '    policy="$(cat "$HOME/.git-hooks/_policy")/$name"'
  say '    [ -x "$policy" ] && { "$policy" "$@" || exit $?; }'
fi

# Record where the policy hooks live, so the dispatcher finds them from any
# clone location.
printf '%s\n' "$HERE/hooks" > "$HOOKS_DIR/_policy"

if [ "$usable" = "1" ]; then
  for h in applypatch-msg commit-msg post-applypatch post-checkout post-commit \
           post-merge post-rewrite pre-applypatch pre-auto-gc pre-commit \
           pre-merge-commit pre-push pre-rebase prepare-commit-msg; do
    target="$HOOKS_DIR/$h"
    if [ -L "$target" ] && [ "$(readlink "$target")" = "_dispatch" ]; then
      continue
    elif [ -e "$target" ] || [ -L "$target" ]; then
      kept="$kept $h"
    else
      ln -s _dispatch "$target"
    fi
  done
  [ -n "$kept" ] && warn "kept your own hooks in $HOOKS_DIR:$kept"
fi

if [ -n "$current" ] && [ ! "$current" -ef "$HOOKS_DIR" ]; then
  warn "left your git hooks alone: git already runs them from $current"
  say "  the Agent Rules hooks are not active. call them from your hooks, or"
  say "  switch git over yourself:"
  say "    git config --global core.hooksPath $HOOKS_DIR"
elif [ "$usable" = "1" ] && [ -z "$current" ] && [ -n "$kept" ]; then
  warn "left your git hooks alone: turning on $HOOKS_DIR would start running yours"
  say "  the Agent Rules hooks are not active. to turn them all on:"
  say "    git config --global core.hooksPath $HOOKS_DIR"
elif [ "$usable" = "1" ] && [ -z "$current" ]; then
  git config --global core.hooksPath "$HOOKS_DIR"
  ok "set core.hooksPath to $HOOKS_DIR"
elif [ "$usable" = "1" ]; then
  ok "core.hooksPath already points to $HOOKS_DIR"
fi

printf '\n  done. run: rules\n\n'
