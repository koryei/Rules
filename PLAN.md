# Plan: one-page website

Goal: the visitor copies the setup prompt and their agent installs Agent Rules.

## Decisions

- Hero art: pixel-art canal lock, drawn in code (no image generator was
  connected).
- The prompt checks for an existing global hooks path or install and stops to
  ask, because the installer replaces the hooks path.
- Hosting: GitHub Pages through GitHub Actions, no build step.
- Page order: prompt, approval, blocked commits, limits, closing action.

## Status

- [x] Page, painting, copy behaviour
- [x] Prompt synced into README and setup guide
- [x] Merged (PR #1) and live at https://koryei.github.io/Rules/

## Open items, in review

- [ ] PR #3: installer keeps existing git hooks; prompt and docs updated
- [ ] PR #4: docs say Cursor is not linked
- [ ] PR #5: lock visible on laptop screens (merge after #3)

## Decisions on open items

- Cursor is documented, not linked: its global rules live in app settings. A
  local Cursor plugin could be added later if wanted.
