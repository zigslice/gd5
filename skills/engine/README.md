# Engine skills

编写 / 扩展 **任何 gd5 产品页或嵌入页**（含外部仓库 vendoring 引擎）时遵循的约定。

查「有哪些 API」→ [`docs/api.md`](../../docs/api.md)。  
查「怎么拆层级 / 禁止什么」→ [`docs/composition.md`](../../docs/composition.md)（必读）。

**顺序：先层级分解 → 再新建组件 → 再写声明式 render。** 禁止先开一个大 `HomePage.render` 再往里堆 DOM。

---

## Skill：先拆层级（强制，写代码前）

在创建或大改任何 UI 文件之前，先输出组件树，例如：

```text
WorkspacePage
├── AppHeader
├── SideNav
└── DetailPane
    ├── NodeSummary
    ├── ActionBar
    └── LogPanel
```

硬规则：

1. **一组件一事**：每个独立可视区域（侧栏、详情、日志、工具栏…）一个 `Foo.js` + `Foo.css`。
2. **页面要薄**：页组件只负责布局与组装子组件，不写业务 DOM 细节。
3. **一个 `render` 里出现两块以上完整 UI 区域 → 必须拆文件**，不要「先写完再重构」。
4. **`render` 体量过大（约 80～120 行或持续 `createElement`）→ 立刻拆**，不要继续加。

没有树，禁止开始写 `ensureShell`。

---

## Skill：声明式组装（唯一推荐）

父组件的 `render` **只拼树**，像 React JSX：

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

或 factory：`TodoList({ items })` / `EChart({ option })` / `Tree({ … })`。

- 子组件与 `div` / `Button({})` 同级写进树；不必先 `this.x = new X` 再事后 `mount`（传送门除外）。
- 子组件自行 `setData` / `refresh`；父 `unmount` 会卸组合子组件。
- 画布 kind 用 `nodes/*` 注册表，禁止在 Editor 里 `switch (kind)`。

金样例：[`examples/compose-demo.js`](../../examples/compose-demo.js)、[`examples/todo-demo.js`](../../examples/todo-demo.js)。

---

## Skill：禁止（LLM 硬约束）

在 `Component.render`（及同类刷新路径）里 **不要**：

| 禁止 | 应改成 |
|------|--------|
| `document.createElement` / `appendChild` 拼业务 UI | `ensureShell` / `bind` 树，或子 `Component` |
| `host.textContent = ''` 再灌子树 | 子组件自己的 `render` + `refresh` |
| `querySelector` 改子区域结构/文案 | props / `setData` / 子组件 `ids()` |
| `innerHTML` | `text` props 或子节点 |
| 手写 `D.clear`→`bind`→`get`→`append` 建壳 | `ensureShell` / `paint` |
| 单文件画完侧栏+详情+日志 | 先拆树，再多文件 |

`window` / `document` 监听仍用 `this.on`（可放 `componentDidAttachEvents`）。

---

## Skill：新建组件（页面或页内）

1. `extends Component` + `super(deps)` → 用 `this.navigator`（页面由 init 注入；子组件由父写入 deps）
2. 旁挂 **`MyPanel.css`**，声明 `static styles = new URL('./MyPanel.css', import.meta.url)`
3. `render()` 用 **`ensureShell`** 建壳，不要手写 clear/bind/get/append
4. **DOM 事件写在 props**：`onClick` / `onChange` / `onDragStart`…
5. `window` 等非树内目标才用 `this.on`
6. 组合优先树内 `h(Child, deps)` / `Child(props)`；仅传送门才 `new` + `mount(document.body)`
7. `componentDidUnMount` 只清业务；**不必** `D.clear(host)`
8. Mount 后改数据用 `setData` / `refresh`，不要重复 `navigate`

```js
export class MyPanel extends Component {
  static styles = new URL('./MyPanel.css', import.meta.url);

  constructor(deps = {}) {
    super(deps);
    this.store = deps.store;
  }

  render() {
    this.ensureShell(
      (ids) => ids.root,
      ({ div, button }) => {
        div(
          { id: 'root', className: 'panel' },
          button({
            id: 'btn',
            type: 'button',
            text: 'Go',
            onClick: () => this.navigator.navigate('next'),
          })
        );
      }
    );
  }
}
```

全局只放 `css/tokens.css` + `css/base.css`；组件私有 class 写在旁挂 CSS。

---

## Skill：可刷新 render

```js
render() {
  this.ensureShell((ids) => ids.root, ({ div, button }) => {
    div(
      { id: 'root' },
      button({ id: 'btn', text: 'Go', onClick: () => this.doIt() })
    );
  });
  const { title } = this.ids();
  if (title) title.textContent = this.state.data.title;
}
```

动态列表可局部清节点再画，并在新 props 上带 `on*`；**不要**在 refresh 路径 `paint` 整棵壳。  
父级刷新优先 `child.refresh()`，不要父 `querySelector` 改子 DOM。

---

## Skill：模态页

在 `ComponentRender.init` 里设 `isModal: true`。  
打开：`navigator.navigate('name', params)`；关闭：`navigator.goBack()`。

---

## Skill：实 DOM 组合

- 组件内优先 `ensureShell` / `paint`，事件用 `on*`
- 节点模块等非 Component 处再用 `bind()` + `get()`
- 尾参 children、`map(..., keyOf)`；避免 `innerHTML`

---

## Skill：host + mount（非默认）

空 `host-*` + `AttachEvents` 里 `child.mount(id)` 是旧产品页写法。  
**新代码默认用树内就地组合。** 仅传送门 / 页外槽位再用 host + `mount`。详见 [`docs/composition.md`](../../docs/composition.md)。
