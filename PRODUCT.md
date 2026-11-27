# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

The app is dependency-free bash. The website is plain HTML, CSS and JavaScript
in `site/`, deployed to GitHub Pages with no build step.

## Users

Developers on macOS or Linux who work with AI coding agents and want one set of
rules that every agent follows.

## Product Purpose

Agent Rules keeps one rules file (`~/AGENTS.md`), links it into nine agent
configs, lets agents propose changes that only a person can apply, and runs git
hooks that block common mistakes. The website has one goal: the visitor copies
the setup prompt and has their agent install the app.

## Positioning

Agents can propose changes to the rules. Only the person can apply them.

## Operating Context

The visitor pastes a prompt into an agent that can run shell commands. The
installer changes global git settings and agent config files on their machine.

## Capabilities and Constraints

- Linked tools: Claude Code, Codex, Gemini CLI, Windsurf, opencode, crush,
  goose, Continue, Mistral Vibe. Cursor is not linked by the installer.
- The approval gate is detection plus refusal, not a security boundary.
- Hooks can be skipped with `--no-verify` or the printed override variables.

## Brand Commitments

Name shown to people: Agent Rules. Command typed: `rules`. MIT licensed.
Website reference chosen by the owner: one screen, dark page, left-aligned
headline, a "copy setup prompt" button, and a pixel-art night scene with a card
on it.

## Evidence on Hand

Real terminal output from an install in an empty home folder. No users,
testimonials or usage numbers. Do not invent any.

## Product Principles

- One action per page.
- Say what changes on the person's machine before they run anything.
- Show real output, and state the limits.

## Accessibility & Inclusion

Keyboard operable, WCAG 2.2 AA contrast, reduced motion respected, readable
without JavaScript. The single-key shortcut never fires while you are typing.
