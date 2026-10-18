# Engine

迷你实模式 HTML 组件引擎（原 gd5 框架，ES module 化）。

**完整 API 列表**见 [`api.md`](./api.md)（本页偏写法与坑）。

## 入口

```js
import {
  Component,
  ComponentRender,
  D,
  Element,
  LogProvider,
  LogLevel,
  Logger,
  bind,
} from '../src/engine/index.js';
```


## 生命周期

页面与页内子组件**共用** `mount` / `unmount`：

```
ComponentRender.navigate / 树里写子 Component → child.mount(host)
  → componentDidMount(params)
  → render()
  → componentDidAttachEvents()

goBack / parent.unmount()
  → 先卸组合子组件
  → componentDidUnMount()   // 只做业务清理
  → 引擎卸 on() 监听、清宿主、重置 ref
```

子组件和 `div` / `Button({})` 一样写进树（就地组合，不必先 `this.x = new …`）：

```js
div(
  { id: 'root' },
  h1({ text: 'Hi' }),
  TodoList({ items }),           // factory → Component（有 .dom()）
  EChart({ option }),            // 同上：ECharts 嵌入
  ThreeView({ onInit }),         // 同上：three.js 3D
  SparkView({ url }),            // 同上：Spark.js Gaussian Splatting
  PeleView({ source }),          // 同上：Pele Mermaid→SVG
  h(CoverFlow, { items }),       // Component class ≈ React createElement
);
```

`ensureShell` 只建一次，就地 `TodoList({…})` / `EChart` / `ThreeView` / `SparkView` / `PeleView` 也只创建一次。引擎插入 `display: contents` 宿主再 `mount`。

## 写组件时怎么少踩坑

| 易错点 | 引擎做法 |
|--------|----------|
| 手写 `D.clear` → `bind` → `get` → `append` | `paint(build)` / `ensureShell(probe, build)` |
| refresh 拆掉壳 → AttachEvents 失效 | `ensureShell`：壳只建一次 |
| 子组件事后 `ids().host` + `_mounted` flag | 树里直接写 `this.child`（同 div） |
| `getElementById` 与 `host()` 两套 | 页面也走 `mount`，统一 `this.host()` |
| 事件写在 AttachEvents，和 DOM 分离 | props 里 `onClick` / `onChange` |
| window 监听忘卸 | `this.on(window, …)`，unmount 自动卸 |
| 每个组件手写 `state = { data, ref }` | 基类已提供 |
| DidUnMount 里再清 DOM | 不必；引擎 teardown 统一清 |
| 样式堆在全局 `app.css` | 旁挂 `FooComponent.css` + `static styles` |

## 声明式事件（与 DOM 同写）

```js
button({
  id: 'btnSave',
  type: 'button',
  text: '保存',
  onClick: () => this.save(),
});

input({ id: 'name', onChange: (e) => this.setData({ name: e.target.value }) });

// 也可用 events 袋：events: { click: fn, dragstart: fn }
```

- `onClick` → `click`，`onPointerDown` → `pointerdown`，`onDoubleClick` → `dblclick`
- 壳用 `ensureShell` 只建一次，监听随节点；动态区重建时把 `on*` 写在新 props 里即可
- **不要**再为树上的节点单独写 `componentDidAttachEvents` + `onId`
- `window` / `document` 仍用 `this.on(target, type, fn)`

## 样式与组件同目录

```js
export class ToolbarComponent extends Component {
  static styles = new URL('./ToolbarComponent.css', import.meta.url);
  // CSS 仍写 .toolbar；className 仍写 'toolbar' —— 不必加前缀
}
```

- `mount` 前会 `adoptStylesFor(this.constructor)`，相同 URL / 文本只注入一次
- **自动 scope（默认开）**：引擎把选择器改写成 `[data-gd-c="ToolbarComponent"] .toolbar`，并在 host 上打 `data-gd-c`。作者 / 使用方都零前缀噪音
- 关闭：`static stylesScoped = false`；自定义 id：`static styleScope = 'toolbar'`
- **全局**：`css/tokens.css` + `css/base.css`（以及 UI kit 的 `gd-*`）；**组件私有**旁挂 CSS

### navigator / logger：同一套用法

构造里 `super(deps)` 后，组件一律用 `this.navigator` / `this.logger`。

| 谁创建 | 怎么带上 runtime |
|------|------------------|
| `ComponentRender.init` | 自动传入页面 |
| 父组件 `new Child(deps)` | 父把 `navigator: this.navigator, logger: this.logger` 写进 deps |

子组件与页面同一套 `this.navigator` / `this.logger`；组合方式与 React 同形——实例当 children。

```js
app.init({ loading: 'home', home: 'home' }, {
  home: HomePage,
  preview: { type: PreviewPage, isModal: true },
});

// 页面构造（像保留 Child 的 ref）
this.toolbar = new Toolbar({
  navigator: this.navigator,
  logger: this.logger,
  store: this.store,
});

// Toolbar 内（与页面相同）
this.navigator.navigate('preview', { doc });
```

### 推荐骨架

```js
export class Panel extends Component {
  constructor(deps) {
    super(deps); // 已带 navigator / logger
    this.store = deps.store;
  }

  componentDidAttachEvents() {
    // 仅非树内目标（window 等）
    this.on(window, 'keydown', (e) => { /* … */ });
  }

  render() {
    this.ensureShell(
      (ids) => ids.panel,
      ({ div, button }) => {
        div(
          { className: 'panel', id: 'panel' },
          button({
            id: 'btnSave',
            type: 'button',
            text: '保存',
            onClick: () => this.save(),
          }),
          // 像 React：<div><TodoList items={…} /></div>
          TodoList({ items: this.store.getTodos() })
        );
      }
    );
    const { title } = this.ids();
    if (title) title.textContent = this.state.data.title;
  }
}
```

## 刷新（Mount 之后）

```js
this.setData({ title: '新标题' });
this.refresh();
this.navigator.refresh();
```

- 壳用 `ensureShell`；动态区可局部 `D.clear` 再画，并在新节点 props 上带 `on*`

## API 速查

完整表与参数说明 → **[`api.md`](./api.md)**。

常用：`mount` / `unmount` / `ensureShell` / `setData` / `ids` / `on` / `static styles` / `this.navigator.*`。

## D / Element（实 DOM DSL）

```js
const { div, header, h1, button, map, get } = bind();

div({ className: 'app', id: 'appRoot' },
  header({ className: 'toolbar' },
    h1({ className: 'toolbar__title', text: 'ProtoLive' }),
    ...map(
      actions,
      (a, _i, key) => button({ key, className: 'btn', text: a.label }),
      (a) => a.id,
    ),
  ),
);

const [ref, root] = get();
```

在 Component 里优先用 `ensureShell` / `paint`，一般不必自己 `get` + `append`。

| 字段 | 作用 |
|------|------|
| `className` | 真实 CSS（可多个） |
| `id` | DOM id + `ref.id` |
| `key` | 逻辑索引 → `ref.key` |
| `dataset` / `style` / `attrs` | 数据属性、样式、setAttribute |
| `text` | innerText |

## 页面槽

`index.html` 里为每个组件准备同名 `id` 节点。`ComponentRender.init` 的 `id` 必须与之对应。

UI 示例（`examples/*-demo.html`、`examples/ui-gallery.html`）同样是标准 gd5 应用：页槽 + `ComponentRender` / `LogProvider`，引导代码见 [`examples/demoApp.js`](../examples/demoApp.js)。

## 与产品的边界

| 属于引擎 | 属于产品 |
|----------|----------|
| 导航栈、挂载时序、paint/on | 编辑器业务、积木、导出 HTML |
| `D` / `Element` API | 具体面板布局与样式 |
| `LogProvider` / `Logger` | 原型文档模型 (store) |
