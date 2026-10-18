# Engine skills

编写 / 扩展 ProtoLive **产品页**时遵循的引擎约定。

查「有哪些 API」→ [`docs/api.md`](../../docs/api.md)。

## Skill：新建组件（页面或页内）

1. `extends Component` + `super(deps)` → 用 `this.navigator`（页面由 init 注入；子组件由父写入 deps）
2. 旁挂 **`MyPanel.css`**，声明 `static styles = new URL('./MyPanel.css', import.meta.url)`
3. `render()` 用 **`ensureShell`** 建壳，不要手写 clear/bind/get/append
4. **DOM 事件写在 props**：`onClick` / `onChange` / `onDragStart`…
5. `window` 等非树内目标才用 `this.on`（可放在 `componentDidAttachEvents`）
6. 子组件：`new Child({ navigator: this.navigator, logger: this.logger, store })`
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

// 页面
this.panel = new MyPanel({
  navigator: this.navigator,
  logger: this.logger,
  store: this.store,
});
```

全局只放 `css/tokens.css` + `css/base.css`；组件私有 class 写在旁挂 CSS。

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

## Skill：产品页要薄，靠 Component 组合

- 页面与页内模块**都是** `extends Component`
- 子组件就地写进树（不必先 `this.x = new X`）：`TodoList({…})` / `h(CoverFlow, {…})`
- 子组件自行 `setData` / `refresh`；父 `unmount` 会卸组合子组件
- 一组件一事：Toolbar / Palette / Artboard / Inspector
- 画布 kind 用 `nodes/*` 注册表，禁止在 Editor 里 `switch (kind)`

```js
render() {
  this.ensureShell((ids) => ids.root, ({ div, h }) => {
    div({ id: 'root' }, h(Toolbar, { store: this.store }), TodoList({ items }));
  });
}
```

## Skill：模态页

在 `ComponentRender.init` 里设 `isModal: true`。  
打开：`navigator.navigate('name', params)`；关闭：`navigator.goBack()`。

## Skill：实 DOM 组合

- 组件内优先 `ensureShell` / `paint`，事件用 `on*`
- 节点模块等非 Component 处再用 `bind()` + `get()`
- 尾参 children、`map(..., keyOf)`；避免 `innerHTML`
