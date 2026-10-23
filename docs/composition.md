# Composition：层级分解与声明式组装

gd5 的设计意图是 **React 同形的声明式组合**：页面只拼树，区域各自是 `Component`，`render` 里写 `div(…, Child(…))`，**不是**在一个 `render` 里用 `createElement` / `appendChild` / `querySelector` 拼 DOM。

本文是「怎么拆、怎么写、禁止什么」的硬约定。API 细节见 [`engine.md`](./engine.md) / [`api.md`](./api.md)。短技能表：[`skills/engine/README.md`](../skills/engine/README.md)。

---

## 为什么 LLM 容易写歪

常见失败形态（与设计意图相反）：

| 失败 | 表现 |
|------|------|
| **不拆层级** | 一个 `HomePage` / `AppPage` 里塞侧栏、详情、日志、地图…… |
| **命令式 render** | `document.createElement`、`host.appendChild`、`querySelector` 改文案 |
| **壳 + 事后灌内容** | `ensureShell` 只建空 `host-*`，再在 `render` 后半段清空 host、手拼子树 |
| **事件与树分离** | 大量逻辑堆在 `componentDidAttachEvents`，DOM 在别处 |

正确形态：先画出组件树，再为每个节点建文件；父组件的 `render` **只声明组装**。

---

## 写 UI 前必须先交树

在写任何 `.js` 之前，先输出（或心里钉死）一棵树，例如：

```text
WorkspacePage          # 页槽：只组合，不画业务细节
├── AppHeader          # 品牌 / 状态 / 主题
├── SideNav            # 搜索 + 树
└── DetailPane         # 标题、动作、日志……
    ├── NodeSummary
    ├── ActionBar
    └── LogPanel
```

规则：

1. **一组件一事**：侧栏、详情、日志、工具栏各一文件（`Foo.js` + `Foo.css`）。
2. **页面要薄**：页面 `render` 里几乎只有布局容器 + 子组件；业务文案与列表在子组件内。
3. **数据下传、事件上抛**：`store` / 回调进 deps 或 props；子组件 `setData` / `refresh`，父不要 `querySelector` 改子 DOM。
4. **超过约 80～120 行 `render`（或一个文件同时负责两块视觉区域）→ 必须再拆。**

没有这棵树，禁止开始写 `ensureShell`。

---

## 声明式组装（唯一推荐写法）

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

等价工厂形式（UI kit / 已有 factory）：

```js
div({ id: 'root' }, TodoList({ items }), EChart({ option }));
```

要点：

- 子组件与 `div` / `Button({})` **同级写进树**；引擎插 `display: contents` 宿主并 `mount`。
- `ensureShell` **只建一次**；refresh 时改的是子组件自己的 `render` / `ids()` 文本，不是父去清 host。
- 事件写在 props：`onClick` / `onChange` / `onSelect`。

参考：[`examples/compose-demo.js`](../examples/compose-demo.js)、[`examples/todo-demo.js`](../examples/todo-demo.js)、Coding Agent 的面板拆分（`src/product/agent/components/`）。

---

## 禁止（LLM 硬约束）

在 `Component.render`（以及为刷新而跑的同类路径）里 **禁止**：

1. `document.createElement` / `appendChild` / `insertBefore` / `removeChild` 拼业务 UI  
2. `host.textContent = ''` 后重新灌一整棵子树  
3. `querySelector` / `getElementById` 去改子区域文案或结构（壳外极少量时长类读数除外）  
4. `innerHTML`  
5. 手写 `D.clear` → `bind` → `get` → `append` 代替 `ensureShell` / `paint`  
6. 把侧栏 + 详情 + 日志写进**同一个** `render` 回调里「画完」

动态列表用 `map(..., keyOf)` 或子组件内部的 `ensureShell` + 局部更新；不要在父级用原生 DOM API 重建。

---

## host + `mount`：何时还能用

早期产品页（ProtoLive Editor、Coding Agent Workspace）用空 `host-*` + `componentDidAttachEvents` 里 `child.mount(id)`。  
**新代码不要学这个当默认。** 默认一律树内就地组合（上一节）。

仍可用 host + `mount` 的情况：

- 传送门 / 挂到 `document.body`（Modal、Toast、CommandPalette）
- 必须把已有实例挂到页外槽位

即便如此：host 的 `render` 仍只声明 host 节点，**不要**在同一 `render` 里再 `createElement` 填内容；内容在子 `Component.render` 里声明式完成。

---

## 嵌入方（如 pyouter）怎么落地

1. 把本仓库 `skills/engine/`（或 Cursor plugin `gd5-compose`）接到消费方 agent 技能列表。  
2. 改 UI 时先交组件树，再改文件；禁止在单页上继续堆 `createElement`。  
3. 存量单体页（一个 `HomePage` 里命令式灌 tree/detail）按树拆成 `SideNav` / `DetailPane` / …，父页只留 `ensureShell` 组装。  
4. 不要只 vendoring `src/engine` + `src/ui` 却丢掉组合约定——LLM 会按现有坏例子继续写。

---

## 自检清单

- [ ] 已有组件树（写在 PR / 对话里）
- [ ] 每个可视区域一个 `Component` 文件 + 旁挂 CSS
- [ ] 页面 `render` 只有布局 + 子组件（或 UI factory）
- [ ] 无 `createElement` / `appendChild` / 清空 host 灌树
- [ ] 事件在 props；`window` 才用 `this.on`
- [ ] 刷新走子组件 `refresh` / `setData`，不是父 `querySelector`
