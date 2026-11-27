# Let an AI agent set up Agent Rules

Copy the box below into any AI agent. It works with Claude Code, Codex, Cursor,
Gemini CLI, Windsurf, opencode, or anything else that can run shell commands.

```
Install the `rules` CLI on this machine.

0. Run `git config --global core.hooksPath` and check whether
   ~/.config/git-policy exists. If either one already exists, stop, show me
   what you found, and ask before going on. The installer would replace that
   hooks path.

1. git clone https://github.com/koryei/rules ~/.config/git-policy
2. ~/.config/git-policy/install.sh
3. rules

Show me the output of step 3 and tell me what changed on this machine. If
`rules` is not found, run ~/.local/bin/rules.

Do not edit ~/AGENTS.md directly. If you want to change the rules, run
`rules propose` and tell me a proposal is waiting for my review.
```

## What the agent will do

1. Check for a global git hooks path or an earlier install, and stop to ask if
   it finds one. The installer would replace that hooks path.
2. Clone the repo to `~/.config/git-policy`.
3. Run the installer, which:
   - links `rules` onto your `PATH` at `~/.local/bin/rules`
   - creates `~/AGENTS.md` if it does not exist
   - symlinks that file into every agent config it finds
   - installs the git hook dispatcher and sets `core.hooksPath`, unless you
     already have a hooks path or hooks of your own, which it leaves alone and
     reports
4. Print the dashboard.

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
