# Architecture：引擎 / 组件库 / 产品

三层，**禁止混写职责**：

| 层 | 路径 | 职责 |
|----|------|------|
| **引擎 (Engine)** | `src/engine/` | 迷你实模式 DOM 运行时：`Component` / `ComponentRender` / `D` / `LogProvider` |
| **组件库 (UI)** | `src/ui/` | 对标 antd 的常用组件（Button / Input / Modal…），默认**橙色主色 + 白色面板** |
| **产品 (Product)** | `src/product/` | 示例应用：ProtoLive + Coding Agent + Escape Room + 潮前线（可用引擎 + UI 库） |
| **索引 (Catalog)** | `src/catalog/` | 站点首页：产品与示例入口，本身也是 gd5 应用 |

```
src/engine  ──►  src/ui（组件库）
                    │
                    ▼
         src/catalog（索引） / src/product / 你的应用
```

站点入口 `index.html` 挂 `src/catalog/`：列出 ProtoLive、Coding Agent、Escape Room 和 `examples/`，点击才进入对应 HTML。ProtoLive 本体在 `protolive.html`。

产品示例内部：

```
skills/blocks ──► product components (extends engine.Component)
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
     页面 Component   子 Component.mount(host)
    (ComponentRender)  Toolbar/Palette/Artboard/Inspector
```

Coding Agent（`src/product/agent/`，入口 `agent.html`）同样结构，但面板换成 IDE：

```
agent store ──► Workspace / Settings pages
                   │
     FileTree · CodePane · AgentChat · AgentSide · Toolbar
     (+ UI: Tree, CodeBlock, DiffBlock, TodoList, ChatBubble, CommandPalette)
```

潮前线（`src/product/archipelago/`，入口 `archipelago.html`）是 3D 群岛防御产品 demo：海图进入岛屿视角，左侧布防，敌船从固定码头上岸。战役规则在 `lib/world.js`，岛内布防和登陆战在 `lib/battle.js`。

Escape Room（`src/product/escape/`，入口 `escape.html`）是 2D 密室逃脱产品 demo：

```
escape store ──► Game / Win pages
                   │
     Scene（热点） · Inventory · SidePanel（调查/日志）
```

## 引擎

- `Component`：生命周期 + `setData` / `refresh` + **`mount` / `unmount`**（页面与页内同一套）
- 降噪：`ensureShell` / `paint`、`onClick` 声明式事件、`on(window)`、`ids()`
- **样式**：`static styles = new URL('./X.css', import.meta.url)`，`mount` 时 `adoptStyles` 注入一次
- `ComponentRender`：页面栈走 `component.mount(页槽)`，与子组件一致
- `D` / `bind` / `map`：实 DOM 组合

产品不得另起一套 View 生命周期绕开 `Component`。

## 产品组件怎么拆

| 类型 | 例子 | 挂载方式 |
|------|------|----------|
| 页面 | Boot / Editor / Preview | `ComponentRender` 槽 `#boot` 等 |
| 页内子组件 | Toolbar / Palette / Artboard / Inspector | 父树里直接写 `this.child`（同 div；或 host + `mount`） |
| 节点模块 | `nodes/button.js` | 非 Component：`create` / `update` / `inspectorFields` |

`EditorComponent` 只组合：`ensureShell` 树里写子组件（或 `host-*` + `mount`）→ `store.subscribe → child.refresh`。

## 目录

```
src/engine/
src/catalog/    # 索引页（index.html）
  main.js
  entries.js
  components/   # CatalogPage.js + CatalogPage.css
src/product/
  components/   # ProtoLive: FooComponent.js + FooComponent.css 旁挂
  nodes/        # 画布 kind
  lib/
  css/          # 仅 tokens.css + base.css（全局）
  main.js       # ProtoLive boot
  agent/        # Coding Agent product demo
    main.js
    components/
    lib/
  archipelago/  # 潮前线 3D island defense
    main.js
    lib/        # world.js rules, battle.js, store.js, scenes
    components/
  escape/       # Escape Room (2D) product demo
    main.js
    components/
    lib/
```

组件私有样式不进 `css/app.css`；共享控件（`.btn` / `.field`）放 `base.css`。
