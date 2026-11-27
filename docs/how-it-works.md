# How Agent Rules works

Three mechanisms, each doing one job.

## 1. One file, many symlinks

`~/AGENTS.md` is the only real file. Every tool's config is a symlink to it.

```
~/.codex/AGENTS.md                                    -> ~/AGENTS.md
~/.vibe/AGENTS.md                                     -> ~/AGENTS.md
~/.gemini/GEMINI.md                                   -> ~/AGENTS.md
~/.config/opencode/AGENTS.md                          -> ~/AGENTS.md
~/.config/crush/CRUSH.md                              -> ~/AGENTS.md
~/.config/goose/.goosehints                           -> ~/AGENTS.md
~/.continue/rules/global.md                           -> ~/AGENTS.md
~/.codeium/windsurf/memories/global_rules.md          -> ~/AGENTS.md
```

Claude Code is the exception. Its `CLAUDE.md` supports `@path` imports, so
`~/.claude/CLAUDE.md` gets one line:

```
@/Users/you/AGENTS.md
```

Symlinks mean there is no sync step and no drift. Edit the file, every tool sees
it immediately.

`rules sync` re-creates the links. Run it after installing a new AI tool.

## 2. A hook dispatcher

`core.hooksPath` points at `~/.git-hooks`, where every hook name is a symlink to
one dispatcher:

```
~/.git-hooks/pre-commit   -> _dispatch
~/.git-hooks/commit-msg   -> _dispatch
~/.git-hooks/pre-push     -> _dispatch
```

`_dispatch` does two things in order:

```sh
name=$(basename "$0")

# 1. the policy hook
policy="$HOME/.config/git-policy/hooks/$name"
[ -x "$policy" ] && { "$policy" "$@" || exit $?; }

# 2. the repo's own hook, if it has one
local="$(git rev-parse --git-common-dir)/hooks/$name"
[ -x "$local" ] && exec "$local" "$@"
```

Because this lives in git config rather than in any agent, it fires no matter
which tool ran `git commit`. Claude, Codex, Cursor, a human in a terminal — all
the same.

The installer only sets this up where nothing is in the way. An existing global
hooks path, a hook file of yours or your own dispatcher is never replaced. To
use both, add the policy call above to your own hooks. `rules check` counts a
hook as active only when git will run it.

The dispatcher is also where machine-local behaviour goes. If you already have a
hook that pings a counter or sends a notification, put it above the policy call.

## 3. The approval gate

`rules edit`, `rules review`, and `rules approve` call `require_human` first.
Three signals, any one of which refuses:

**Agent environment.** A list of variables agents set:

```sh
CLAUDECODE  CLAUDE_CODE_ENTRYPOINT  CURSOR_AGENT  CODEX_SANDBOX
CODEX_SESSION_ID  VIBE_SESSION  AIDER_MODEL  GEMINI_CLI
COPILOT_AGENT  OPENCODE_AGENT  WINDSURF_AGENT  AMP_AGENT
CONTINUE_AGENT  DEVIN_AGENT
```

An agent can also self-identify with `RULES_AGENT=1`.

**Non-interactive stdin.** No TTY means no human at the keyboard.

**Content hash.** `rules check` compares the file against the hash written at the
last approval. An edit made outside the CLI shows up as `changed outside the CLI`.

### What the gate cannot do

It cannot stop an agent that runs `echo >> ~/AGENTS.md`. Nothing running as your
user can. The gate stops an agent that follows instructions, and the hash catches
the ones that do not.

That is why the third layer exists.

## 4. GitHub rulesets

Local hooks can be bypassed with `--no-verify`, and they do not apply to edits
made in the GitHub web UI. A branch ruleset does not care how the commit was
made.

```sh
./scripts/apply-github-ruleset.sh --dry-run --all
./scripts/apply-github-ruleset.sh --all
```

Creates a `protect-default-branch` ruleset requiring a PR, blocking force pushes,
and blocking branch deletion.

Note: rulesets on **private** repos need a paid GitHub plan. Public repos are
free.

## The proposal flow

```
agent                    CLI                      human
  |                       |                         |
  |-- rules propose ----->|                         |
  |                       |-- writes proposal ----->|
  |<-- "waiting for you" -|                         |
  |                       |<---- rules review ------|
  |                       |---- shows diff -------->|
  |                       |<---- accept/reject -----|
  |                       |-- applies, re-hashes -->|
```

A proposal is a file in `~/.config/git-policy/proposals/`:

```
kind: section
section: Branch names
created: 2026-11-27T00:54:29Z
author: non-interactive stdin
---
Use `main` as the default branch. Never `master`.
```

`rules review` diffs the proposed content against the current section, so you see
the change rather than the request.

## Precedence

Closest file wins.

```
project/AGENTS.md   or   project/CLAUDE.md     <- wins
        ~/AGENTS.md                            <- default
```

`rules project` walks up from `$PWD` and tells you which one is in effect.
