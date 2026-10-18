# Architecture：引擎 / 组件库 / 产品

三层，**禁止混写职责**：

| 层 | 路径 | 职责 |
|----|------|------|
| **引擎 (Engine)** | `src/engine/` | 迷你实模式 DOM 运行时：`Component` / `ComponentRender` / `D` / `LogProvider` |
| **组件库 (UI)** | `src/ui/` | 对标 antd 的常用组件（Button / Input / Modal…），默认**橙色主色 + 白色面板** |
| **产品 (Product)** | `src/product/` | 示例应用 ProtoLive（可用引擎 + UI 库） |

```
src/engine  ──►  src/ui（组件库）
                    │
                    ▼
              src/product / 你的应用
```

产品示例内部：

```
skills/blocks ──► product components (extends engine.Component)
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
     页面 Component   子 Component.mount(host)
    (ComponentRender)  Toolbar/Palette/Artboard/Inspector
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
src/product/
  components/   # FooComponent.js + FooComponent.css 旁挂
  nodes/        # 画布 kind
  lib/
  css/          # 仅 tokens.css + base.css（全局）
  main.js
```

组件私有样式不进 `css/app.css`；共享控件（`.btn` / `.field`）放 `base.css`。
