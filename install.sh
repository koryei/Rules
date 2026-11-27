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
printf '\n'
HOOKS_DIR="$HOME/.git-hooks"
mkdir -p "$HOOKS_DIR"
if [ -f "$HOOKS_DIR/_dispatch" ] && ! grep -q 'git-policy/hooks' "$HOOKS_DIR/_dispatch"; then
  warn "existing dispatcher at $HOOKS_DIR/_dispatch does not call the policy hooks"
  say "  add this before its local-hook handoff:"
  say '    policy="$HOME/.config/git-policy/hooks/$name"'
  say '    [ -x "$policy" ] && { "$policy" "$@" || exit $?; }'
else
  cp "$HERE/hooks/_dispatch" "$HOOKS_DIR/_dispatch"
  chmod +x "$HOOKS_DIR/_dispatch"
  for h in applypatch-msg commit-msg post-applypatch post-checkout post-commit \
           post-merge post-rewrite pre-applypatch pre-auto-gc pre-commit \
           pre-merge-commit pre-push pre-rebase prepare-commit-msg; do
    ln -sf _dispatch "$HOOKS_DIR/$h"
  done
  git config --global core.hooksPath "$HOOKS_DIR"
  ok "installed dispatcher and set core.hooksPath"
fi

printf '\n  done. run: rules\n\n'
