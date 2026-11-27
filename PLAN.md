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
- [x] Installer keeps existing git hooks; prompt and docs updated (PR #3)
- [x] Docs say Cursor is not linked (PR #4)
- [x] Lock visible on laptop screens (PR #5)
- [x] Site cut to one screen: hero and prompt card only, painting behind

## Decisions on open items

- Cursor is documented, not linked: its global rules live in app settings. A
  local Cursor plugin could be added later if wanted.
- The page is one screen with no page scroll. The prompt card scrolls inside
  itself when the prompt does not fit, which is the case on phones.
