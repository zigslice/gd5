# gd5 UI — Component library

Ant Design–style **UI kit on top of the engine**. Catalog aligned with [NameThatUI](https://namethatui.com/) **web** elements **and** [Ant Design](https://ant.design/components/overview) controls (macOS-only chrome maps to the closest web control).

**Themes (selectable):** `orange` (default), `blue`, `green` — white panels, accent via `--gd-*` / `setTheme()` / `ConfigProvider`.

**Jelly (selectable, default off):** `setJelly(true)` writes `data-gd-jelly="on"` on `<html>`, the same level as the theme. `loadUi()` restores the choice from `gd5-jelly`. Solid primary and default buttons, floating action buttons, and chips grow a soft-body fill. Ghost, text, danger, switches, segmented controls, tags, inputs, cards, and overlays stay rigid. `prefers-reduced-motion` keeps the switch but skips the canvas.

```
Engine (runtime)     →  src/engine/
UI kit (components)  →  src/ui/
App / product        →  your code or src/product/
```

## Install

```html
<link rel="stylesheet" href="./src/ui/css/ui.css">
<script type="module">
  import { Button, Input, Modal, loadUi } from './src/ui/index.js';
</script>
```

## Usage (inside a Component)

```js
import { Button, Space, Card, Input, Field } from '../ui/index.js';

render() {
  this.ensureShell((ids) => ids.root, ({ div }) => {
    div(
      { id: 'root' },
      Card(
        { title: 'Profile' },
        Space(
          { direction: 'vertical' },
          Field({ label: 'Name', control: Input({ id: 'name' }) }),
          Button({ type: 'primary', text: 'Save', onClick: () => this.save() })
        )
      )
    );
  });
}
```

Primitives return **real-DOM `Element`s**. Overlay widgets are **`Component`s** with portal `mount()`.

## Catalog ↔ NameThatUI

| NameThatUI (web) | gd5 export | Kind |
|------------------|------------|------|
| Accordion / Disclosure | `Accordion`, `Collapse` | primitive |
| Alert / Callout / Banner | `Alert`, `Callout`, `Banner` | primitive |
| Avatar Group / Status Dot | `Avatar`, `AvatarGroup`, `StatusDot` | primitive |
| Badge / Chip / Pill / Tag | `Badge`, `Chip`, `Pill`, `Tag` | primitive |
| Bento Grid / Masonry | `BentoGrid`, `BentoTile`, `Masonry` | primitive |
| Bottom Navigation | `BottomNav` | primitive |
| Breadcrumbs | `Breadcrumbs` | primitive |
| Card | `Card` | primitive |
| Carousel / Page Control | `Carousel`, `PageControl` | primitive |
| Cover Flow (封面流) | `CoverFlow`, `CoverflowCarousel`, `createCoverFlow` | **Component** |
| To-dos | `TodoList`, `Todos`, `createTodoList`, `normalizeTodoItems` | **Component** |
| ECharts embed | `EChart`, `EChartView`, `createEChart`, `loadEcharts` | **Component** (CDN) |
| three.js 3D | `ThreeView`, `ThreeScene`, `createThreeView`, `loadThree` | **Component** (CDN) |
| Spark.js GS | `SparkView`, `SplatView`, `createSparkView`, `loadSpark` | **Component** (CDN) |
| Pele Mermaid | `PeleView`, `MermaidView`, `createPeleView`, `loadPele` | **Component** (CDN) |
| Chat Bubble | `ChatBubble` | primitive |
| Combobox | `Combobox` | primitive |
| Command Palette | `CommandPalette` | **Component** |
| Data Table | `Table` / `DataTable` | primitive |
| Date / Time pickers | `DatePicker`, `TimeField` | primitive |
| Divider / Separator | `Divider` | primitive |
| Drag & Drop cues | `DragHandle`, `DropZone` | primitive |
| Empty State | `Empty` | primitive |
| Floating buttons | `Fab`, `ChatLauncher`, `BackToTop` | primitive |
| Focus ring | `.gd-focus-ring` | CSS |
| Form Field | `Field`, `Input`, `TextArea`, `Select` | primitive |
| Hamburger / Nav Drawer | `HamburgerButton`, `Drawer` | mixed |
| Header / Navbar | `SiteHeader`, `Navbar` | primitive |
| Hover Card | `HoverCard` | primitive |
| Lightbox | `Lightbox` | **Component** |
| Marquee | `Marquee` | primitive |
| Modal / Dialog | `Modal` | **Component** |
| Drawer / Sheet | `Drawer`, `Sheet` | **Component** |
| Multi-select / Transfer | `MultiSelect`, `Transfer`, `TagInput` | primitive |
| Overflow / Three dots | `OverflowMenu` | primitive |
| Pagination | `Pagination` | primitive |
| Pie / Donut Chart | `PieChart`, `DonutChart` | primitive |
| Popover / Dropdown / Tooltip | `Popover`, `DropdownMenu`, `Tooltip` | primitive |
| Context Menu | `ContextMenu` | primitive |
| Progress / Spinner | `ProgressBar`, `ProgressRing`, `Spin`, `Meter` | primitive |
| Resize Handle | `ResizeHandle` | primitive |
| Scrim | `Scrim` | primitive |
| Scroll Area / Sticky / Fixed | `ScrollArea`, `Sticky`, `Fixed` | primitive |
| Scrollspy | `Scrollspy` | primitive |
| Search Field | `SearchInput` | primitive |
| Sidebar | `Sidebar` | primitive |
| Sign-in Form | `SignInForm`, `PasswordInput`, `OrDivider` | primitive |
| Skeleton | `Skeleton`, `SkeletonParagraph` | primitive |
| Slider / Color Well | `Slider`, `ColorWell` | primitive |
| Split View | `Splitter` / `SplitView` | primitive |
| Split Button | `SplitButton` | primitive |
| Steps / Quantity Stepper | `Steps`, `QuantityStepper` | primitive |
| Switch / Checkbox / Radio | `Switch`, `Checkbox`, `Radio`, `RadioGroup` | primitive |
| Tabs / Toggle Group | `Tabs`, `ToggleGroup`, `SegmentedControl` | primitive |
| Timeline | `Timeline` | primitive |
| Toast / Snackbar | `Toast` | **Component** |
| Toolbar | `Toolbar` | primitive |
| Tree / Outline / Disclosure | `Tree` (`accordion` 手风琴单路径), `OutlineView`, `DisclosureTriangle` | primitive |
| Workflow DAG (multi-column) | `WorkflowDAG`, `WorkflowBoard` | **Component** / primitive |
| JSON Tree (virtualized) | `JsonTree`, `createJsonTree` | **Component** |
| Code block (line numbers) | `CodeBlock`, `Code` | primitive |
| Diff block (unified) | `DiffBlock`, `Diff`, `parseDiffLines` | primitive |
| Markdown editor | `MarkdownEditor`, `createMarkdownEditor`, `renderMarkdown` | **Component** |
| Truncation | `Truncate` | primitive |
| Typography | `Title`, `Text` | primitive |
| Button | `Button` (`loading`) | primitive |
| Loading Button | `LoadingButton`, `AsyncButton`, `createLoadingButton` | **Component** |

### Ant Design coverage (gap fill)

| Ant Design | gd5 export |
|------------|------------|
| InputNumber | `InputNumber` |
| Rate | `Rate` |
| Cascader | `Cascader` |
| Upload | `Upload` |
| Mentions | `Mentions` |
| TreeSelect | `TreeSelect` |
| Form / Form.Item | `Form`, `FormItem` |
| List | `List`, `ListItem` |
| Descriptions | `Descriptions` |
| Statistic | `Statistic` |
| Calendar | `Calendar` |
| Image | `Image` (+ `Lightbox` for preview) |
| Result | `Result` |
| Popconfirm | `Popconfirm` |
| Notification / message | `Notification`, `messageApi` |
| Watermark | `Watermark` |
| Flex | `Flex` |
| Grid (Row/Col) | `Row`, `Col` |
| Layout | `Layout`, `LayoutHeader`, `LayoutSider`, `LayoutContent`, `LayoutFooter` |
| Menu | `Menu` |
| Affix | `Affix` |
| Anchor | `Anchor` |
| Icon | `Icon` |
| ConfigProvider | `ConfigProvider` |

**Still not shipped** (intentionally light / app-level): Tour, QRCode, App shell runtime, BorderBeam, ProComponents. Motion/vibe-only NameThatUI entries remain CSS/app concerns.

**Not shipped as components** (CSS motion / vibe, not controls): easing, spring, text scramble, parallax, hover-lift effects, Name That Vibe styles. Use CSS / your app layer.

Live gallery: [`examples/ui-gallery.html`](../examples/ui-gallery.html) (standard gd5 app: `#home` slot + `ComponentRender`). Other demos (`examples/*-demo.html`) use the same bootstrap via [`examples/demoApp.js`](../examples/demoApp.js).

## Modal / Drawer / Toast

```js
const modal = new Modal({});
await modal.mount();
modal.open({ title: 'Delete?', content: 'Cannot undo.', onOk: () => {} });

const drawer = new Drawer({});
await drawer.mount();
drawer.open({ title: 'Menu', placement: 'left', content: '…' });

const toast = new Toast({});
await toast.mount();
toast.show({ message: 'Saved', type: 'success' });
```

## Code block

Native line-numbered code viewer (principle from [highlightjs-line-numbers.js](https://github.com/fanfeilong/highlightjs-line-numbers.js), **no dependency**). Fixes table-copy blank lines, multiline-token splitting, and trailing-newline line-count drift.

```js
import { CodeBlock } from './src/ui/index.js';

CodeBlock({
  language: 'javascript',
  startFrom: 1,
  highlightLines: [3, 4],
  code: `function add(a, b) {\n  return a + b;\n}\n`,
})
```

### Diff block

Unified diff viewer with dual gutters (old | new) and `+`/`-` markers. Accepts a full unified patch or simplified `+/-/space` lines. `CodeBlock({ mode: 'diff', diff })` delegates to the same renderer.

```js
import { DiffBlock, parseDiffLines } from './src/ui/index.js';

DiffBlock({
  language: 'javascript',
  diff: `@@ -1,3 +1,4 @@\n function add(a, b) {\n-  return a + b;\n+  // keep precision\n+  return a + b;\n }\n`,
})

parseDiffLines(diff) // → [{ type, text, oldLine, newLine, marker, raw }, …]
```

## Loading Button

Async **Loading Button**：点击后进入 busy（换色 + 散点/转圈），期间忽略重复点击；Promise 结束后恢复纯文本。受控也可用 `Button({ loading: true })`。

```js
import { LoadingButton, Button } from './src/ui/index.js';

const btn = new LoadingButton({
  text: 'Save',
  loadingText: 'Saving',
  type: 'default',
  loadingType: 'primary',
  indicator: 'dots', // or 'spin'
  onClick: async () => {
    await fetch('/api/save', { method: 'POST' });
  },
});
await btn.mount(host);

Button({ type: 'primary', text: 'Wait', loading: true, indicator: 'spin' })
```

## To-dos

Cursor-style checklist card (Component): header title + `done/total`, active item with filled arrow disc, pending with dashed ring, done with check.

Compose like React / like `Button({})` — call in the tree, no pre-`new` on `this`.

```js
import { TodoList, nextTodoStatus } from './src/ui/index.js';

// render — <div><TodoList items={…} /></div>
this.ensureShell((ids) => ids.root, ({ div }) => {
  div(
    { id: 'root' },
    TodoList({
      title: 'To-dos',
      items: [
        { key: '1', text: 'Ship LoadingButton', status: 'active' },
        { key: '2', text: 'Write docs', status: 'pending' },
        { key: '3', text: 'Open PR', status: 'pending' },
      ],
      onItemClick(item, i) {
        // `this` is the TodoList instance
        this.setItems(
          this.getItems().map((t, idx) =>
            idx === i ? { ...t, status: nextTodoStatus(t.status) } : t
          )
        );
      },
    })
  );
});
```

Component classes use `h(CoverFlow, { items })` the same way (`h` ≈ React `createElement`).

Statuses: `pending` · `active` (`in_progress`) · `done` (`completed`).

## EChart / ThreeView

Thin hosts for **ECharts** and **three.js** (3D). Same nesting as `TodoList` — call in the tree; libraries load once from CDN ESM (or inject your own module). Not core deps.

```js
import { EChart, ThreeView } from './src/ui/index.js';

this.ensureShell((ids) => ids.root, ({ div }) => {
  div(
    { id: 'root' },
    EChart({
      height: 280,
      option: {
        xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed'] },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: [12, 18, 9] }],
      },
    }),
    ThreeView({
      height: 320,
      onInit({ THREE, scene }) {
        scene.add(
          new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshNormalMaterial())
        );
      },
      onFrame(dt, { scene }) {
        const mesh = scene.children.find((c) => c.isMesh);
        if (mesh) mesh.rotation.y += dt;
      },
    })
  );
});
```

- `EChart({ option, height, onReady, echarts })` — `getChart()` / `setOption()` / `resize()`
- `ThreeView({ onInit, onFrame, three, background })` — `getContext()`; `onInit` may return a dispose fn
- Demo: [`examples/embed-demo.html`](../examples/embed-demo.html)

## SparkView

Thin host for **[Spark.js](https://sparkjs.dev/)** (`@sparkjsdev/spark`) — 3D Gaussian Splatting on THREE.js. Same nesting as `TodoList`. Not a core dep.

Requires Spark **2.x** + **three ≥ 0.180**, and an HTML **importmap** for bare `three` / `three/addons/` / `@sparkjsdev/spark` (see the demo). Renderer uses `antialias: false` (GS requirement).

```js
import { SparkView } from './src/ui/index.js';

this.ensureShell((ids) => ids.root, ({ div }) => {
  div(
    { id: 'root' },
    SparkView({
      height: 420,
      url: 'https://sparkjs.dev/assets/splats/butterfly.spz',
      onReady({ splat, spark, renderer }) {
        splat.position.set(0, 0, -3);
      },
    })
  );
});
```

- `SparkView({ url, onReady, onFrame, autoRotate, spark, three })` — `getContext()` / `getSpark()` / `getSplat()`
- Upstream: [sparkjsdev/spark](https://github.com/sparkjsdev/spark)
- Demo: [`examples/spark-demo.html`](../examples/spark-demo.html)

## PeleView

Thin host for **[Pele](https://pele.run/)** ([obsidianmd/pele](https://github.com/obsidianmd/pele)) — Mermaid → themeable SVG. Same nesting as `TodoList`. Not a core dep.

```js
import { PeleView } from './src/ui/index.js';

this.ensureShell((ids) => ids.root, ({ div }) => {
  div(
    { id: 'root' },
    PeleView({
      height: 280,
      source: `flowchart LR
  A[Ask] --> B[Plan] --> C[Ship]`,
      onReady({ mounted, result }) {
        // mounted.update(nextSource)
      },
    })
  );
});
```

- `PeleView({ source, onReady, onError, options, pele, zoom })` — `setSource()` / `getMounted()` / `getResult()`
- CSS maps `--gd-*` → `--pele-*` on `.gd-pele`
- Upstream: [obsidianmd/pele](https://github.com/obsidianmd/pele)
- Demo: [`examples/pele-demo.html`](../examples/pele-demo.html)

## Cover Flow

**Cover Flow（封面流）** — the Apple / game character-select pattern: the active card faces forward in the center; neighbors are smaller, perspective-tilted, and stacked. Also called coverflow carousel / 3D card carousel (Swiper: `effect: 'coverflow'`).

```js
import { CoverFlow } from './src/ui/index.js';

const cf = new CoverFlow({
  height: 300,
  items: [
    { key: 'knight', title: 'Knight', subtitle: 'Tank', color: '#4a5568' },
    { key: 'mage', title: 'Mage', subtitle: 'Caster', color: '#6b46c1' },
  ],
  onChange: (i, item) => console.log(i, item),
});
await cf.mount(host);
cf.next(); // or cf.prev() / cf.setIndex(1)
```

Drag the stage, use arrows / dots, or click a side card. Keyboard: ← →.

## Markdown editor

Markdown-first editor with a basic top toolbar and live preview. Modes: **编辑** / **分栏** (default) / **预览**. Toolbar wraps the selection (bold, italic, heading, quote, code, link, lists). Preview uses a small built-in `renderMarkdown` (no marked/remark dependency).

```js
import { MarkdownEditor, renderMarkdown } from './src/ui/index.js';

const ed = new MarkdownEditor({
  mode: 'split',
  height: 280,
  value: '# Hello\n\nWrite **markdown**.',
  onChange: (v) => console.log(v),
});
await ed.mount(host);
ed.setMode('preview');
ed.getValue();
```

## JSON Tree

High-performance virtualized JSON viewer (inspired by [jsonTreeViewer](https://github.com/fanfeilong/jsonTreeViewer)). Only visible rows are in the DOM; works with gd5 orange / blue / green themes.

```js
import { JsonTree } from './src/ui/index.js';

const jt = new JsonTree({ height: 360, defaultExpand: 1, onPath: (p) => console.log(p) });
await jt.mount(host);
jt.loadData({ name: 'Ada', tags: ['math', 'code'] });
jt.expand();   // or jt.collapse()
```

Shortcuts: click expand · Ctrl/⌘+click recursive · Alt+click mark · Shift+click JSONPath.

## Workflow DAG

Multi-column stage board with bezier edges. Scroll freely, drag blank area to pan, click a node for a right `Drawer`.

```js
import { WorkflowDAG } from './src/ui/index.js';

const wf = new WorkflowDAG({});
await wf.mount(document.getElementById('host'));
wf.setGraph({
  columns: [
    { key: 'ingest', title: 'Ingest', nodes: [{ key: 'a', title: 'Source', status: 'success' }] },
    { key: 'deliver', title: 'Deliver', nodes: [{ key: 'b', title: 'Load', status: 'pending' }] },
  ],
  edges: [{ from: 'a', to: 'b' }],
});
// optional: wf.setRenderDetail((node) => `…`)
```

## Theming

Built-in accents (all keep **white panels**):

| Name | Primary | Page / panel bg | API |
|------|---------|-----------------|-----|
| `orange` (default) | `#e86a17` | `#ffffff` | `setTheme('orange')` |
| `blue` | `#2f6fed` | `#f3f6fb` | `setTheme('blue')` |
| `green` | `#2f8f5b` | `#f3f8f4` | `setTheme('green')` |

```js
import { setTheme, ConfigProvider, Button } from './src/ui/index.js';

setTheme('blue'); // <html data-gd-theme="blue">

ConfigProvider({ theme: 'green' },
  Button({ type: 'primary', text: 'Scoped green' })
);
```

Or override tokens manually:

```css
:root {
  --gd-primary: #e86a17;
  --gd-bg: #ffffff;
  --gd-bg-elevated: #ffffff;
  --gd-mask: rgba(0, 0, 0, 0.45);
}
```

## 中文

- 引擎 = 运行时；**组件库** = `src/ui/`（对标 [antd](https://ant.design/components/overview) + [NameThatUI](https://namethatui.com/) Web 清单）
- **主题可选：`orange` / `blue` / `green`**（白面板 + 主色切换）；`setTheme()` 或 `ConfigProvider`
- 基础件返回实 DOM；`Modal` / `Drawer` / `Toast` / `Notification` / `Lightbox` / `CommandPalette` / `WorkflowDAG` / `JsonTree` 是 `Component`
- 画廊：`examples/ui-gallery.html`
