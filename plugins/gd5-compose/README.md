# gd5-compose

Cursor plugin that steers agents toward **gd5's design intent**: thin pages, one component per region, declarative `ensureShell` trees — not a single mega-`render` full of `createElement` / `appendChild`.

## Install

- **Local (this machine):** copy or symlink this folder to `~/.cursor/plugins/local/gd5-compose/`
- **From the gd5 repo:** the canonical copy lives at `plugins/gd5-compose/`

Consumers that only vendor `src/engine` + `src/ui` (e.g. pyouter) should still install this plugin or copy `skills/engine/` + `docs/composition.md` into their agent skills — otherwise the LLM will imitate any existing imperative `HomePage`.

## What it enforces

1. Output a component tree **before** editing UI files
2. One visual region → one `Component` (+ co-located CSS)
3. Parent `render` only declares `h(Child, …)` / factory children
4. Ban `createElement` / `appendChild` / host-clearing / `querySelector` mutation in `render`

Canonical docs in the gd5 repo: `docs/composition.md`, `skills/engine/README.md`, `examples/compose-demo.js`.
