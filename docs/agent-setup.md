# Let an AI agent set up Agent Rules

Copy the box below into any AI agent that can run shell commands. Cursor can run
the install too, but it is not one of the linked tools. See
[Cursor](../README.md#cursor).

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

## What the agent will do

1. Clone the repo to `~/.config/git-policy`.
2. Run the installer, which:
   - links `rules` onto your `PATH` at `~/.local/bin/rules`
   - creates `~/AGENTS.md` if it does not exist
   - symlinks that file into every agent config it finds
   - installs the git hook dispatcher and sets `core.hooksPath`, unless you
     already have a hooks path or hooks of your own, which it leaves alone and
     reports
3. Print the dashboard.

Nothing is pushed anywhere. Nothing leaves your machine.

## Why the last paragraph matters

An agent that can edit your rules can quietly change the rules it is judged by.
The last paragraph tells it to use `rules propose` instead, which writes a
proposal and changes nothing.

That is a request, not a guarantee — an agent could ignore it. What makes it
hold is the gate in the CLI: `rules edit`, `rules review`, and `rules approve`
detect agent environments and non-interactive stdin, and refuse to run.

## If the agent gets refused

That is the gate working. It will see:

```
  ╭────────────────────────────────────────────────────────────╮
  │ HUMAN APPROVAL REQUIRED                                    │
  ╰────────────────────────────────────────────────────────────╯

  This looks like an AI agent (non-interactive stdin).
  Editing the global rules is a human-only action. It is not
  available to you, and no flag or env var unlocks it.
```

You then run `rules review` yourself to accept or reject whatever it proposed.

## Verifying it worked

```sh
rules check
```

You want:

```
   rules file   ✓ ~/AGENTS.md
   approval     ✓ matches last human approval
   tools        ✓ 9/9 linked
   hooks        ✓ 3/3 active

  ✓ All checks passed.
```

If `tools` is short, run `rules sync`. If `hooks` is short, `rules hooks` shows
which ones git is not running.
