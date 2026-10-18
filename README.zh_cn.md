# gd5 引擎 + UI

精简的 **实 DOM** 运行时（无 VDOM、无 bundler），外加 **antd 风格** 组件库 —— 橙色主色、白面板，主题 `orange` / `blue` / `green`。

`src/product/` 仅为参考应用。

| 层级 | 路径 | 文档 |
|------|------|------|
| 引擎 | `src/engine/` | [`docs/api.md`](docs/api.md) |
| 组件库 | `src/ui/` | [`docs/ui.md`](docs/ui.md) · [画廊](examples/ui-gallery.html) |

[English](README.md)

---

## 设计目标

| 目标 | 做法 |
|------|------|
| 小而完整的表面 | `Component`、`ComponentRender`、`D` / `bind`、`LogProvider` |
| 实 DOM | 直接改动元素 |
| 零构建 | 通过 HTTP 的 ESM `import` |
| 统一生命周期 | 页面与子组件共用 `mount` / `unmount` |
| 难用错 | `ensureShell`、声明式 `onClick`、旁挂 CSS |
| 现成控件 | `src/ui` Button / Input / Modal… |

---

## 安装

无需 `dist/`。用 HTTP 服务打开（ES Module 需要服务器）：

```bash
python3 -m http.server 8080
```

```html
<script type="module">
  import { Component, ComponentRender, bind, LogProvider } from './src/engine/index.js';
</script>
```

---

## 组件库

```html
<link rel="stylesheet" href="./src/ui/css/ui.css">
<script type="module">
  import { Button, Card, Modal, setTheme } from './src/ui/index.js';
  setTheme('blue'); // 或 ConfigProvider({ theme: 'green' }, …)
</script>
```

```js
Button({ type: 'primary', text: 'Save', onClick: () => this.save() })
```

目录：[`docs/ui.md`](docs/ui.md)。在线演示：[`examples/ui-gallery.html`](examples/ui-gallery.html)。

| 橙（默认） | 蓝 | 绿 |
|------------|----|----|
| ![Orange](docs/images/theme-orange.png) | ![Blue](docs/images/theme-blue.png) | ![Green](docs/images/theme-green.png) |

---

## 快速开始

### 1. 页面槽位

```html
<div id="home"></div>
<div id="settings" style="display:none"></div>
<script type="module" src="./app.js"></script>
```

### 2. 组件

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

### 3. 导航

页面通过 `ComponentRender.init` 获得 `this.navigator` / `this.logger`。子组件经 `deps` 传入相同能力。

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

## 核心概念

### 生命周期

```
mount / navigate
  → adoptStyles → componentDidMount → render → componentDidAttachEvents

unmount / goBack
  → componentDidUnMount → 引擎清理 on() 监听与宿主
```

### 清单

1. `extends Component` —— 页面从 `init` 获得 `navigator` / `logger`
2. 旁挂 CSS：`static styles = new URL('./X.css', import.meta.url)`
3. 用 `ensureShell` / `paint` + `bind` 搭 UI
4. 事件写在 props：`onClick`、`onChange`，…（或 `events`）
5. 仅对树外目标使用 `this.on(window, …)`
6. 用 `setData` / `refresh` 更新 —— 不要靠再次 `navigate` 刷新
7. 嵌套：`new Child({ navigator: this.navigator, logger: this.logger, … })`

### 组合

```js
div({ id: 'host-panel', className: 'component-host' });
await this.panel.mount('host-panel');
```

### 声明式 DOM

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

### 样式

| 层级 | 位置 |
|------|------|
| Token / 共享 | 应用级 CSS |
| 组件私有 | `FooComponent.css` 与 `FooComponent.js` 同目录 |

`mount` 会注入一次 `static styles`（经 `data-gd-c` 自动挂到宿主；作者仍写普通的 `.toolbar` / `className: 'toolbar'`）。卸载不会移除已注入样式。

---

## 目录与文档

```
src/engine/     运行时
src/ui/         组件库
src/product/    示例应用（可选）
examples/       标准 gd5 应用（页槽 + ComponentRender）— ui-gallery、各 demo
docs/           api.md · ui.md · engine.md · architecture.md
```

- [`docs/api.md`](docs/api.md) —— 引擎 API
- [`docs/ui.md`](docs/ui.md) —— 组件目录与主题
- [`docs/engine.md`](docs/engine.md) —— 编写指南
- [`docs/architecture.md`](docs/architecture.md) —— 边界
- [`skills/engine/README.md`](skills/engine/README.md) —— 短技能表

---

## 示例与测试

ProtoLive（`src/product/`）在可视化编辑器里演示组合用法。**Coding Agent**（`agent.html` → `src/product/agent/`）是更完整的产品 demo：IDE 壳 + UI 组件嵌入 + store 驱动的 Agent 回合。嵌入引擎时可忽略。

`examples/` 下的 UI 演示都是**标准 gd5 应用**：HTML 页槽 + `ComponentRender` / `LogProvider`（见 `examples/demoApp.js`），结构与 `src/product/main.js` 一致。

```bash
python3 -m http.server 8080
# ProtoLive：     http://localhost:8080/
# Coding Agent：  http://localhost:8080/agent.html
# 画廊：examples/ui-gallery.html
# 演示：examples/*-demo.html
node test/run.mjs
```

---

## 许可证

MIT
