# Command reference

Every command, what it does, and who is allowed to run it.

## Human only

These refuse to run when they detect an agent. There is no override flag.

### `rules edit`

Edit the rules section by section, in the terminal.

Arrow keys move, enter selects. You see the current content, type the
replacement, press Ctrl-D, and get a diff before anything is written.

```
  Changes
  @@ -1 +1 @@
  -beta content
  +beta replaced

    s   save
    c   cancel
```

`rules edit --full` opens the whole file in `$EDITOR` instead.

### `rules review`

Work through pending proposals. Each one shows a diff against the current
content, so you judge the change rather than the proposal text.

```
   section     Branch names
   from        non-interactive stdin
   when        2026-11-27T00:54:29Z

  Changes
  @@ -1 +1,2 @@
  -gamma content
  +gamma rewritten
  +second line

    a   accept
    r   reject
    s   skip
    q   quit
```

### `rules approve`

Mark the current content as approved without changing it. Use this after editing
the file by hand, so `rules check` stops reporting it as changed outside the CLI.

## Agent safe

### `rules propose`

Write a change request. Never changes the rules.

```sh
rules propose --section "Branch names" < new-content.txt
rules propose --append < addition.txt
rules propose --replace --file new-rules.md
```

Writes to `~/.config/git-policy/proposals/` and prints the path. A human must run
`rules review` to accept it.

## Read only

### `rules`

The dashboard. Leads with a verdict, then a single-key menu.

### `rules show`

Print the rules file to stdout.

### `rules check`

Health check. Verifies the file exists, matches the last approval, every tool is
linked, and every hook is executable. Exits non-zero if anything is wrong.

### `rules project`

Walk up from the current directory and report which rules file wins.

```
  rules · precedence in ~/code/myproject
  ────────────────────────────────────────────

  /Users/you/code/myproject/CLAUDE.md
  /Users/you/AGENTS.md

  closest file wins
```

### `rules hooks`

Hook status and the last few blocks.

### `rules log`

The audit trail: who proposed, who accepted, who edited.

### `rules test`

Run the hook test suite. Creates a throwaway repo and checks that each hook
actually blocks what it claims to.

### `rules path`

Print the rules file path. Useful in scripts.

## Setup

### `rules init`

Create a starter `~/AGENTS.md` if you do not have one.

### `rules sync`

Re-link the rules file into every agent config. Run this after installing a new
AI tool.

## Environment variables

| Variable | Effect |
|---|---|
| `RULES_FILE` | Use a different rules file |
| `RULES_HOME` | Use a different install directory |
| `RULES_AGENT=1` | Self-identify as an agent, triggering the gate |
| `NO_COLOR=1` | Disable colour |
| `GIT_POLICY_ALLOW_MAIN=1` | Allow one commit on a protected branch |
| `GIT_POLICY_ALLOW_PUSH_MAIN=1` | Allow one push to a protected branch |
| `GIT_POLICY_SKIP_SECRET_SCAN=1` | Skip the secret scan for one commit |

Force-pushing a protected branch has no override.
