---
name: gd5-compose
description: >-
  Use when writing or refactoring gd5 UI: Component, ensureShell, bind, page
  slots, or any file under a vendored gd5 engine/ui tree (including pyouter
  webui). Forces hierarchy decomposition and declarative assembly before code.
---

# gd5 composition (mandatory)

gd5 is a real-DOM runtime with **React-shaped declarative composition**. Design intent: thin pages that only assemble child `Component`s. Full rules: if the gd5 repo is available, read `docs/composition.md` and `skills/engine/README.md`.

## Before any UI edit

1. Print a component tree in the conversation, e.g.:

```text
WorkspacePage
├── AppHeader
├── SideNav
└── DetailPane
    ├── NodeSummary
    └── LogPanel
```

2. Do **not** open a mega-`HomePage.render` and keep stacking DOM.
3. One visual region → one `Foo.js` + `Foo.css`. Page file only layouts + children.

## How to write `render`

```js
render() {
  this.ensureShell((ids) => ids.root, ({ div, h }) => {
    div(
      { id: 'root', className: 'workspace' },
      h(AppHeader, { store: this.store }),
      div(
        { className: 'workspace__body' },
        h(SideNav, { store: this.store, onSelect: (p) => this.select(p) }),
        h(DetailPane, { store: this.store })
      )
    );
  });
}
```

Factories are fine: `TodoList({ items })`, `Tree({ … })`, `Button({ onClick })`.
Events live in props (`onClick`, `onChange`). Use `this.on(window, …)` only for non-tree targets.

## Hard bans inside `Component.render`

- `document.createElement` / `appendChild` / `insertBefore` for business UI
- `host.textContent = ''` then rebuild a subtree
- `querySelector` / `getElementById` to mutate child regions
- `innerHTML`
- Hand-rolled `D.clear` → `bind` → `get` → `append` instead of `ensureShell` / `paint`
- Drawing sidebar + detail + logs in **one** `render` callback

Refresh: child `setData` / `refresh`, or update text via `this.ids()`. Parents must not scrape the DOM of children.

## Legacy `host-*` + `mount`

Empty hosts + `child.mount(id)` in `componentDidAttachEvents` is an old product pattern. **Do not use as the default for new code.** Prefer in-tree `h(Child, …)`. Hosts are OK for portals (`document.body`: Modal, Toast, CommandPalette).

## Refactoring an existing mega-page

1. Name regions from the current UI (sider / detail / log / …)
2. Extract each into a `Component` with its own `ensureShell`
3. Leave the page as a thin assembler
4. Delete `createElement` / `appendChild` paths as you go — do not add more

Gold sample in gd5: `examples/compose-demo.js`.
