# Agent Rules

Project context. This file adds context only and overrides none of the global
agent rules.

- One rules file for every AI coding tool, with human approval to change it.
  Bash CLI in `bin/rules`, git hooks in `hooks/`, installer in `install.sh`.
- GitHub: `koryei/Rules`. Website: https://koryei.github.io/Rules/
- Local checkout folder is named `Agent Rules`. The command stays `rules`.
- Website is static files in `site/`, deployed by
  `.github/workflows/pages.yml` when `site/` changes on `main`.
- The setup prompt exists in three places that must say the same thing:
  `site/index.html`, `README.md`, `docs/agent-setup.md`.
- The site is one screen: nav, hero, prompt card, painting behind. The page
  never scrolls; the card scrolls inside itself when the prompt does not fit.
  Check any layout change at phone, tablet, laptop and landscape sizes.
- Tests: `test/run.sh` (hooks) and `test/install.sh` (installer). Product and
  design notes: `PRODUCT.md`, `DESIGN.md`.
