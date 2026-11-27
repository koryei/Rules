# Contributing

Thanks for wanting to help. This project is deliberately small and dependency
free, and it should stay that way.

## Ground rules

- **No dependencies.** Plain `bash` 3.2 and standard Unix tools. macOS ships
  bash 3.2, so avoid bash 4 features: no associative arrays, no `${var,,}`, no
  `mapfile`, no `**` globstar.
- **No build step.** Clone it and run it.
- **Keep it readable.** Someone who has never seen the project should be able to
  follow `bin/rules` top to bottom.

## Before you open a PR

```sh
./test/run.sh
```

All tests must pass. If you add a hook behaviour, add a test for it.

## What is welcome

- Bug fixes
- Support for another AI tool's config location
- Better error messages
- Documentation improvements
- Tests

## What needs discussion first

Open an issue before starting on:

- New commands
- Changes to the approval gate
- Anything that adds a dependency
- Anything that changes the file layout

## Style

- Two-space indent in shell.
- Quote variables: `"$var"`, not `$var`.
- Prefer `printf` over `echo`.
- Comments explain why, not what.

## Commit messages

Conventional Commits, same as the hooks enforce:

```
feat: add support for a new tool
fix: handle missing config directory
docs: clarify the approval gate
test: cover force-push detection
```

## Licence

By contributing you agree your work is released under the MIT licence.
