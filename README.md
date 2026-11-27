# Agent Rules

One file of rules for every AI coding tool.

You write your engineering rules once. Claude Code, Codex, Gemini CLI,
Windsurf, opencode, crush, goose, Continue, and Mistral Vibe all read the same
file. Change it once and every tool follows.

Agents can propose changes. Only you can apply them.

```
  Agent Rules
  ────────────────────────────────────────────────────────────

  ✓ Everything is in order.

  ────────────────────────────────────────────────────────────
   rules       ~/AGENTS.md
   approved    163 lines · 13 sections · edited 2h ago
   tools       9/9 linked
   hooks       3 active
   proposals   none waiting
  ────────────────────────────────────────────────────────────

    e   edit the rules
    r   review proposals
    c   health check
    ?   all commands
    q   quit

  ›
```

---

## The problem

Every AI tool wants its own config file.

| Tool | File it reads |
|---|---|
| Claude Code | `~/.claude/CLAUDE.md` |
| Codex | `~/.codex/AGENTS.md` |
| Gemini CLI | `~/.gemini/GEMINI.md` |
| Windsurf | `~/.codeium/windsurf/memories/global_rules.md` |
| opencode | `~/.config/opencode/AGENTS.md` |
| crush | `~/.config/crush/CRUSH.md` |
| goose | `~/.config/goose/.goosehints` |
| Continue | `~/.continue/rules/global.md` |

Keep them in sync by hand and they drift within a week. `rules` points them all
at one file, so they cannot drift.

The second problem is quieter. An agent that finds your commit conventions
inconvenient will edit the file that defines them. `rules` makes that a two-step
process with a human in the middle.

## Install

```sh
git clone https://github.com/koryei/rules ~/.config/git-policy
~/.config/git-policy/install.sh
```

The installer links `rules` into `~/.local/bin` (usually already on your
`PATH`), creates `~/AGENTS.md` if you do not have one, and links it into every
agent config it finds.

It never replaces your git setup. If git already has a global hooks path, or
`~/.git-hooks` holds hooks or a dispatcher of yours, the installer leaves them
alone and tells you which hooks are inactive. `rules hooks` shows the same.

## Use

```sh
rules
```

That is the whole interface. Press a key to do something.

## Let an AI agent set it up for you

Copy everything in the box below into any AI agent — Claude Code, Codex, Cursor,
Gemini, whatever you use.

```
Install the `rules` CLI on this machine.

1. git clone https://github.com/koryei/rules ~/.config/git-policy
2. ~/.config/git-policy/install.sh
3. rules

Show me the output of steps 2 and 3 and tell me what changed on this
machine. If `rules` is not found, run ~/.local/bin/rules.

If the folder in step 1 already exists, or the installer says it left any
git hooks alone, ask me before changing anything.

Do not edit ~/AGENTS.md directly. If you want to change the rules, run
`rules propose` and tell me a proposal is waiting for my review.
```

That is it. The agent installs it, and from then on it can only *propose* rule
changes — you approve them.

## What you get

**One rules file.** `~/AGENTS.md`, linked into every tool. Edit it once.

**A human approval gate.** `rules edit`, `rules review`, and `rules approve`
refuse to run when they detect an agent. There is no flag that unlocks them.

**Git hooks that hold.** Three global hooks fire on `git commit` and `git push`,
no matter which agent ran the command:

| Hook | Blocks |
|---|---|
| `pre-commit` | commits on `main`/`master`/`develop`/`release/*`, staged secrets, credentials in the diff, files over 5MB, conflict markers, build artifacts |
| `commit-msg` | non-Conventional-Commit subjects, subjects over 72 chars, content-free messages like `wip` or `fix stuff` |
| `pre-push` | direct pushes to protected branches, force-pushes to protected branches, deleting protected branches |

**Project overrides.** A repo can put its own `AGENTS.md` or `CLAUDE.md` at the
root. Closest file wins.

```
project/AGENTS.md   or   project/CLAUDE.md     <- wins
        ~/AGENTS.md                            <- default
```

## Commands

| Command | Who | What |
|---|---|---|
| `rules` | anyone | dashboard |
| `rules edit` | **human only** | edit sections in-terminal |
| `rules review` | **human only** | accept or reject proposals |
| `rules approve` | **human only** | mark current content approved |
| `rules propose` | agents | write a change request, applies nothing |
| `rules show` | anyone | print the rules |
| `rules check` | anyone | health check |
| `rules project` | anyone | which rules file wins here |
| `rules hooks` | anyone | hook status and recent blocks |
| `rules log` | anyone | audit trail |
| `rules test` | anyone | run the hook test suite |
| `rules sync` | anyone | re-link after installing a new tool |
| `rules init` | anyone | create a starter rules file |

Full reference: [docs/commands.md](docs/commands.md)

## Editing

`rules edit` is a section picker. Arrow keys to move, enter to select. You see
the current content, type the replacement, press Ctrl-D, and get a diff before
anything is written.

```
  Changes
  @@ -1 +1 @@
  -beta content
  +beta replaced

    s   save
    c   cancel
```

## Honest limits

The approval gate stops an agent that follows instructions. It does not stop one
that runs `echo >> ~/AGENTS.md` directly — nothing running as your user can.

What it does give you is **detection**. `rules check` compares the file against
the hash recorded at your last approval, so an edit made outside the CLI shows up
as `changed outside the CLI`. `rules log` records who did what.

For the layer that cannot be bypassed at all, use GitHub rulesets:

```sh
./scripts/apply-github-ruleset.sh --dry-run --all
./scripts/apply-github-ruleset.sh --all
```

## Requirements

- macOS or Linux
- `bash` 3.2 or newer (the version macOS ships)
- `git`
- No other dependencies

## Layout

```
bin/rules                    the CLI
bin/sync-agent-rules.sh      fan-out to every agent config
hooks/_dispatch              git hook dispatcher
hooks/pre-commit             policy hooks
hooks/commit-msg
hooks/pre-push
scripts/apply-github-ruleset.sh   GitHub-side enforcement
test/run.sh                  hook test suite
test/install.sh              installer tests
examples/AGENTS.md           a starter rules file
docs/                        longer explanations
```

## License

MIT. Free for everyone, forever.
