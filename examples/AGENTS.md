# Global agent rules

These rules apply to every project, in every AI tool, with every model.

Edit this file any time with `rules`. Check what applies where with `rules project`.

## Precedence

Closest file wins. A project that needs different rules puts them in its own
`AGENTS.md` or `CLAUDE.md` at the repo root, and that file overrides this one
wherever they conflict.

```
project/AGENTS.md   or   project/CLAUDE.md     <- wins
        ~/AGENTS.md                            <- this file, the default
```

## Changing these rules

This file is human-owned. Never edit it directly.

- To propose a change, run `rules propose --section "<name>"` and pipe the new
  content in. That writes a proposal; it does not change anything.
- Then tell the human a proposal is waiting and stop.
- The human runs `rules review` to accept or reject it.

## 1. Never commit to a protected branch

`main`, `master`, `develop`, and `release/*` are protected.

- Before your first commit in a session, run `git branch --show-current`.
- If it is a protected branch, create a branch first:
  `git switch -c <type>/<short-slug>`
- Never `git commit` on a protected branch. Never `git push` to one.

## 2. Branch names

`<type>/<short-kebab-slug>` — lowercase, no spaces.

```
feat/oauth-login        fix/null-deref-on-empty-cart
chore/bump-deps         docs/readme-quickstart
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `revert`.

## 3. Commit messages

```
<type>(<optional scope>): <subject>

<optional body: what changed and why, wrapped at 72>

<optional footer: BREAKING CHANGE:, Refs: #123>
```

- Subject: imperative mood, lowercase, no trailing period, 72 chars or fewer.
- `feat: add retry to upload` — not `added retries` or `Adds retries.`
- One logical change per commit. If the subject needs "and", split the commit.
- Body explains why, not what. The diff already shows what.

## 4. Staging discipline

- Run `git status` and `git diff` before staging.
- Stage explicit paths. Avoid `git add -A` unless you have listed every changed
  file and confirmed each belongs.
- Never stage `.env`, `node_modules/`, `dist/`, `build/`, `.DS_Store`, or logs.
- Never commit commented-out code or debug prints.
- Never commit a file you have not read.

## 5. Secrets

Never commit credentials, tokens, keys, or connection strings with passwords.

- If you find a secret in the working tree, stop. Do not commit it. Tell the
  human and add the path to `.gitignore`.
- If a secret is already committed, say so immediately. It must be rotated.

## 6. Pushing

- Push only your own feature branch: `git push -u origin <branch>`.
- Never `git push --force` to a shared branch.
- Never `git push --force` to `main`/`master`/`release/*`. No exceptions.
- If a push is rejected, do not force. `git pull --rebase` and resolve.

## 7. History

- Do not rewrite history that has been pushed to a shared branch.
- Do not `git commit --amend` a commit that is already pushed.
- Before opening a PR, rebase onto the base branch.

## 8. Pull requests

- Every change to a protected branch goes through a PR.
- PR title follows the same Conventional Commits format as the commit subject.
- PR body states what changed, why, and how to verify.
- Keep PRs small. One concern per PR.
- Do not merge your own PR unless the human explicitly asked you to.

## 9. Destructive commands

Never run these without explicit confirmation from the human in the current
session:

```
git reset --hard      git clean -fd        git checkout -- <file>
git stash drop        git stash clear      git branch -D
git push --force      rm -rf
```

State the blast radius in one line, then wait.

## 10. Before you say "done"

- `git status` is clean, or every remaining change is explained.
- The branch is pushed and the PR link is given.
- Tests were actually run, and you read the output. If you could not run them,
  say so.
- Never claim "tested", "verified", or "working" without a command and its output
  in the transcript.
