# gd5 Engine + UI

Minimal **real-DOM** runtime (no VDOM, no bundler) plus an **antd-style** UI kit — orange primary, white panels, themes `orange` / `blue` / `green`.

`src/product/` is a reference app only.

| Layer | Path | Docs |
|-------|------|------|
| Engine | `src/engine/` | [`docs/api.md`](docs/api.md) |
| UI kit | `src/ui/` | [`docs/ui.md`](docs/ui.md) · [gallery](examples/ui-gallery.html) |

[中文](#中文)

---

## Design goals

| Goal | Approach |
|------|----------|
| Small surface | `Component`, `ComponentRender`, `D` / `bind`, `LogProvider` |
| Real DOM | Mutate elements directly |
| Zero build | ESM `import` over HTTP |
| One lifecycle | Pages and children share `mount` / `unmount` |
| Hard to misuse | `ensureShell`, declarative `onClick`, co-located CSS |
| Ready-made chrome | `src/ui` Button / Input / Modal… |

---

## Install

No `dist/` required. Serve over HTTP (ES modules need a server):

```bash
python3 -m http.server 8080
```

```html
<script type="module">
  import { Component, ComponentRender, bind, LogProvider } from './src/engine/index.js';
</script>
```

---

## UI kit

```html
<link rel="stylesheet" href="./src/ui/css/ui.css">
<script type="module">
  import { Button, Card, Modal, setTheme } from './src/ui/index.js';
  setTheme('blue'); // or ConfigProvider({ theme: 'green' }, …)
</script>
```

```js
Button({ type: 'primary', text: 'Save', onClick: () => this.save() })
```

Catalog: [`docs/ui.md`](docs/ui.md). Live demo: [`examples/ui-gallery.html`](examples/ui-gallery.html).

| Orange (default) | Blue | Green |
|------------------|------|-------|
| ![Orange](docs/images/theme-orange.png) | ![Blue](docs/images/theme-blue.png) | ![Green](docs/images/theme-green.png) |

---

## Quick start

### 1. Page slots

```html
<div id="home"></div>
<div id="settings" style="display:none"></div>
<script type="module" src="./app.js"></script>
```

### 2. Component

```js
import { Component } from './src/engine/index.js';

export class HomePage extends Component {
  static styles = new URL('./HomePage.css', import.meta.url);

  async componentDidMount() {
    this.state.data.title = 'Hello';
  }

  render() {
    this.ensureShell((ids) => ids.root, ({ div, h1, button }) => {
      div(
        { id: 'root', className: 'home' },
        h1({ id: 'title', text: this.state.data.title }),
        button({
          id: 'btnNext',
          type: 'button',
          text: 'Settings',
          onClick: () => this.navigator.navigate('settings'),
        })
      );
    });
  }
}
```

### 3. Navigation

Pages get `this.navigator` / `this.logger` from `ComponentRender.init`. Children receive the same via `deps`.

```js
import { ComponentRender, LogProvider } from './src/engine/index.js';
import { HomePage } from './HomePage.js';
import { SettingsPage } from './SettingsPage.js';

const app = new ComponentRender({
  logProvider: new LogProvider({
    level: 'info',
    sink: 'console',
    context: { machId: 'local', userId: 'demo' },
  }),
});
app.init(
  { loading: 'home', home: 'home' },
  {
    home: HomePage,
    settings: { type: SettingsPage, isModal: true },
  }
);

window.addEventListener('DOMContentLoaded', () => app.render());
```

```js
this.toolbar = new ToolbarComponent({
  navigator: this.navigator,
  logger: this.logger,
  store: this.store,
});
this.navigator.navigate('preview', { doc });
```

---

## Core concepts

### Lifecycle

```
mount / navigate
  → adoptStyles → componentDidMount → render → componentDidAttachEvents

unmount / goBack
  → componentDidUnMount → engine clears on() listeners & host
```

### Checklist

1. `extends Component` — pages get `navigator` / `logger` from `init`
2. Co-locate CSS: `static styles = new URL('./X.css', import.meta.url)`
3. Build UI with `ensureShell` / `paint` + `bind`
4. Handlers in props: `onClick`, `onChange`, … (or `events`)
5. `this.on(window, …)` only for non-tree targets
6. Update with `setData` / `refresh` — do not re-`navigate` to refresh
7. Nest with `new Child({ navigator: this.navigator, logger: this.logger, … })`

### Composition

```js
div({ id: 'host-panel', className: 'component-host' });
await this.panel.mount('host-panel');
```

### Declarative DOM

```js
const { div, button, map } = bind();

div(
  { className: 'list', id: 'list' },
  ...map(
    items,
    (item, _i, key) =>
      button({ key, className: 'item', text: item.label, onClick: () => select(item) }),
    (item) => item.id
  )
);
```

### Styles

| Layer | Where |
|-------|--------|
| Tokens / shared | App-level CSS |
| Component-private | `FooComponent.css` next to `FooComponent.js` |

`mount` injects `static styles` once (auto-scoped to the host via `data-gd-c`; authors still write plain `.toolbar` / `className: 'toolbar'`). Unmount does not remove them.

---

## Layout & docs

```
src/engine/     runtime
src/ui/         component library
src/product/    example app (optional)
examples/       ui-gallery.html
docs/           api.md · ui.md · engine.md · architecture.md
```

- [`docs/api.md`](docs/api.md) — engine API
- [`docs/ui.md`](docs/ui.md) — UI catalog & theming
- [`docs/engine.md`](docs/engine.md) — authoring guide
- [`docs/architecture.md`](docs/architecture.md) — boundaries
- [`skills/engine/README.md`](skills/engine/README.md) — short skill sheet

---

## Example & tests

ProtoLive (`src/product/`) shows composition in a real editor. Safe to ignore when embedding the engine.

```bash
python3 -m http.server 8080   # http://localhost:8080
node test/run.mjs
```

---

## License

MIT

---

## 中文

**gd5** = **引擎**（迷你实 DOM 运行时）+ **组件库**（`src/ui/`，白面板；主题 **橙 / 蓝 / 绿**）。`src/product/` 仅为示例。

```html
<link rel="stylesheet" href="./src/ui/css/ui.css">
<script type="module">
  import { Component, ComponentRender } from './src/engine/index.js';
  import { Button, Modal, setTheme } from './src/ui/index.js';
</script>
```

静态服务器打开即可。画廊与主题预览见上文 [UI kit](#ui-kit)；`setTheme('blue'|'green'|'orange')`。

- 页面 / 子组件共用 `mount`；页面自带 `this.navigator`，子组件由父写入 deps
- 常用控件用 `src/ui`，避免手写一堆 `div.btn`
- **API** [`docs/api.md`](docs/api.md) · **组件库** [`docs/ui.md`](docs/ui.md)

```bash
python3 -m http.server 8080
node test/run.mjs
```
