# Design

The website in `site/`. The scene is a canal lock at night: boats are the
agents, the shut gates are the approval step, the lit window is the person.

## Colour

| Token | Value | Use |
|---|---|---|
| `--ground` | `#090b10` | page |
| `--surface`, `--raised`, `--raised-hover` | `#10131b`, `#1a1f2c`, `#232a3a` | cards, controls |
| `--ink`, `--ink-2`, `--ink-3` | `#f2f1ee`, `#b2b7c6`, `#8b91a3` | three text roles |
| `--lantern` | `#ff8a3d` | the copy action, lanterns, the window |
| `--ok`, `--stop` | `#7ed3a0`, `#ff8f86` | terminal output only |

## Type

Geist for text, Geist Mono for buttons, tabs and terminal output, both
self-hosted. Sizes: 13, 15, 17, 20px and two fluid headings. Weights 400 and 550.

## Shape and motion

4px grid. Radius 3 to 8px. Hairline rules at the page edges. One entrance (the
lanterns light) and one response (the gates open on copy). Nothing loops.
Easing `cubic-bezier(0.22, 1, 0.36, 1)`.

## Painting

`site/scene.js` draws the 640x360 scene in code. Run
`node scripts/render-poster.mjs` after changing it to refresh the fallback image
and the link preview.
