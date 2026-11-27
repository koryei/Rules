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

## Open items

- README and docs name Cursor, which the installer does not link.
- The installer itself still replaces an existing `core.hooksPath` silently.
- On 900px-tall desktop screens the lock sits just below the first screen.
