#!/usr/bin/env bash
# Link ~/AGENTS.md into every AI tool's global instruction location.
# Idempotent: safe to re-run after adding a new tool.
set -uo pipefail

CANON="$HOME/AGENTS.md"
[ -f "$CANON" ] || { echo "missing $CANON" >&2; exit 1; }

linked=0
skipped=0

link() {
  local target="$1"
  mkdir -p "$(dirname "$target")"
  if [ -L "$target" ]; then
    if [ "$(readlink "$target")" = "$CANON" ]; then
      echo "  ok       $target"
      return
    fi
    echo "  relink   $target"
    rm -f "$target"
  elif [ -e "$target" ]; then
    if [ -s "$target" ]; then
      echo "  SKIP     $target (real file with content, not touching)"
      skipped=$((skipped + 1))
      return
    fi
    rm -f "$target"
  fi
  ln -s "$CANON" "$target"
  echo "  linked   $target"
  linked=$((linked + 1))
}

echo "Linking $CANON into agent configs:"

# Tools that read a single global markdown file.
link "$HOME/.codex/AGENTS.md"
link "$HOME/.vibe/AGENTS.md"
link "$HOME/.gemini/GEMINI.md"
link "$HOME/.config/opencode/AGENTS.md"
link "$HOME/.config/crush/CRUSH.md"
link "$HOME/.config/goose/.goosehints"
link "$HOME/.continue/rules/global.md"
link "$HOME/.codeium/windsurf/memories/global_rules.md"

# Claude Code: CLAUDE.md supports @path imports, so append one if absent.
CLAUDE_MD="$HOME/.claude/CLAUDE.md"
mkdir -p "$(dirname "$CLAUDE_MD")"
touch "$CLAUDE_MD"
if grep -qF "@$CANON" "$CLAUDE_MD"; then
  echo "  ok       $CLAUDE_MD (import present)"
else
  printf '\n# Shared rules\n\n@%s\n' "$CANON" >> "$CLAUDE_MD"
  echo "  import   $CLAUDE_MD"
  linked=$((linked + 1))
fi

echo
echo "linked/updated: $linked   skipped: $skipped"
