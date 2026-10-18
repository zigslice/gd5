/**
 * ProtoLive tests — engine + product helpers
 * Run: node test/run.mjs
 */

import {
  Log,
  LogEnv,
  LogLevel,
  LogProvider,
  Logger,
  formatLogRecord,
  normalizeLogContext,
  Component,
  ComponentRender,
  D,
  Element,
  bind,
  adoptStyles,
  adoptStylesFor,
  adoptedStyleKeys,
  resetAdoptedStyles,
  scopeCssText,
  styleScopeId,
  STYLE_SCOPE_ATTR,
  domEventType,
} from '../src/engine/index.js';
import { createStore, DEFAULT_DOC } from '../src/product/lib/store.js';
import { documentToHtml, escapeHtml, renderNodeHtml } from '../src/product/lib/export.js';
import { FALLBACK_BLOCKS } from '../src/product/lib/skills.js';
import { createNodeElement, inspectorModel, registry } from '../src/product/nodes/index.js';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${message}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${message}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

section('layout: product vs engine');
{
  for (const path of [
    'src/engine/index.js',
    'src/engine/component.js',
    'src/engine/component-render.js',
    'src/engine/element.js',
    'src/engine/log.js',
    'src/product/main.js',
    'src/product/components/EditorComponent.js',
    'src/product/components/PreviewComponent.js',
    'src/product/components/BootComponent.js',
    'src/product/components/ToolbarComponent.js',
    'src/product/components/PaletteComponent.js',
    'src/product/components/ArtboardComponent.js',
    'src/product/components/InspectorComponent.js',
    'src/product/nodes/index.js',
    'src/product/nodes/button.js',
    'docs/architecture.md',
    'docs/api.md',
    'docs/ui.md',
    'skills/engine/README.md',
    'src/ui/index.js',
    'src/ui/button.js',
    'src/ui/control.js',
    'src/ui/Modal.js',
    'src/ui/Drawer.js',
    'src/ui/Toast.js',
    'src/ui/accordion.js',
    'src/ui/tabs.js',
    'src/ui/table.js',
    'src/ui/CommandPalette.js',
    'src/ui/WorkflowDAG.js',
    'src/ui/css/workflow.css',
    'src/ui/JsonTree.js',
    'src/ui/css/json-tree.css',
    'src/ui/code.js',
    'src/ui/css/code-block.css',
    'src/ui/markdown.js',
    'src/ui/css/markdown-editor.css',
    'src/ui/CoverFlow.js',
    'src/ui/css/coverflow.css',
    'src/ui/input-number.js',
    'src/ui/rate.js',
    'src/ui/cascader.js',
    'src/ui/upload.js',
    'src/ui/menu.js',
    'src/ui/layout.js',
    'src/ui/Notification.js',
    'src/ui/css/ui.css',
    'src/ui/css/tokens.css',
    'src/ui/css/control.css',
    'src/ui/css/extra.css',
    'src/ui/css/antd-gap.css',
    'src/ui/theme.js',
    'docs/images/theme-orange.png',
    'docs/images/theme-blue.png',
    'docs/images/theme-green.png',
    'examples/ui-gallery.html',
    'examples/ui-gallery.js',
    'src/engine/styles.js',
    'src/product/css/tokens.css',
    'src/product/css/base.css',
    'src/product/components/ToolbarComponent.css',
    'src/product/components/PaletteComponent.css',
    'src/product/components/ArtboardComponent.css',
    'src/product/components/InspectorComponent.css',
    'src/product/components/EditorComponent.css',
    'src/product/components/PreviewComponent.css',
    'src/product/components/BootComponent.css',
  ]) {
    assert(existsSync(join(root, path)), `${path} exists`);
  }
  assert(!existsSync(join(root, 'src/js')), 'legacy src/js removed');
  assert(!existsSync(join(root, 'src/product/views')), 'ad-hoc views/ removed');
  assert(!existsSync(join(root, 'src/product/css/app.css')), 'monolithic app.css removed');
  assert(!existsSync(join(root, 'index.py')), 'Flask entry removed');
}

section('engine: LogProvider');
{
  const records = [];
  const provider = new LogProvider({
    level: 'debug',
    sink: (record) => records.push(record),
    context: { machId: 't1', userId: 'u1' },
  });

  assert(provider.logger instanceof Logger, 'root logger is Logger');
  assert(provider.level === LogLevel.debug, 'provider level is debug');

  provider.logger.info('hello');
  provider.logger.warn('careful', { step: 2 });
  provider.logger.debug('trace');
  assert(records.length === 3, 'custom sink receives records');
  assert(records[0].level === 'info', 'info level name');
  assert(records[0].message === 'hello', 'info message');
  assert(records[0].context.machId === 't1', 'root context machId');
  assert(records[1].context.step === 2, 'fields merge into context');
  assert(
    formatLogRecord(records[0]).includes('[INFO]') &&
      formatLogRecord(records[0]).includes('machId=t1'),
    'formatLogRecord includes level and context'
  );

  const child = provider.logger.child({ page: 'editor' });
  child.error('boom');
  assert(records[3].level === 'error', 'child error level');
  assert(records[3].context.page === 'editor', 'child merges page context');
  assert(records[3].context.userId === 'u1', 'child keeps parent context');
  assert(child !== provider.logger, 'child is a new logger');
  assert(provider.logger.context.page === undefined, 'parent context unchanged');

  provider.setLevel('warn');
  const before = records.length;
  provider.logger.info('filtered');
  provider.logger.warn('visible');
  assert(records.length === before + 1, 'level filter drops info');
  assert(records[records.length - 1].message === 'visible', 'warn still emitted');

  const silent = new LogProvider({ level: 'silent', sink: (r) => records.push(r) });
  const beforeSilent = records.length;
  silent.logger.error('nope');
  assert(records.length === beforeSilent, 'silent level drops all');

  const parsed = normalizeLogContext(['machId:local, userId:demo, token:']);
  assert(parsed.machId === 'local', 'normalize legacy machId');
  assert(parsed.userId === 'demo', 'normalize legacy userId');

  const legacy = new Log(LogEnv.disable, ['ctx']);
  legacy.i('should not throw');
  assert(legacy.env() === LogEnv.disable, 'Log env is disable');
  const forked = legacy.fork();
  forked.pushContext('more');
  assert(forked !== legacy, 'Log.fork returns new instance');

  const fromEnv = LogProvider.fromEnv(LogEnv.chrome, { app: 'gd5' });
  assert(fromEnv.env === LogEnv.chrome, 'fromEnv chrome');
  assert(fromEnv.logger.context.app === 'gd5', 'fromEnv context');
}

section('engine: Component + ComponentRender navigation');
{
  const mounts = {};
  const displays = {};
  globalThis.document = {
    getElementById(id) {
      if (!mounts[id]) mounts[id] = { style: { display: 'none' }, id };
      return mounts[id];
    },
  };

  class PageA extends Component {
    constructor(deps) {
      super(deps);
      this.mounted = 0;
      this.unmounted = 0;
    }
    async componentDidMount() {
      this.mounted += 1;
    }
    componentDidUnMount() {
      this.unmounted += 1;
    }
    componentDidAttachEvents() {}
    render() {}
  }

  class PageB extends Component {
    constructor(deps) {
      super(deps);
      this.mounted = 0;
    }
    async componentDidMount() {
      this.mounted += 1;
    }
    componentDidUnMount() {}
    componentDidAttachEvents() {}
    render() {}
  }

  const render = new ComponentRender({
    logProvider: new LogProvider({ level: 'silent', sink: 'noop' }),
  });
  render.init(
    { loading: 'boot', home: 'editor' },
    {
      boot: PageA,
      editor: PageA,
      preview: { type: PageB, isModal: true },
    }
  );
  assert(render.state.components.editor.id === 'editor', 'init defaults id to name');
  assert(render.state.components.editor.isMount === false, 'init defaults isMount false');
  assert(!!render.state.components.editor.component.navigator, 'page gets navigator by default');
  assert(!!render.state.components.editor.component.logger, 'page gets logger by default');

  await new Promise((resolve) => {
    render._navigate('editor', null, resolve);
  });
  // hide boot after home
  render._renderPage('boot', 'none');

  assert(render.state.components.editor.component.mounted === 1, 'editor mounted once');
  assert(document.getElementById('editor').style.display === 'block', 'editor visible');

  await new Promise((resolve) => {
    // modal navigate
    const prev = render.state.componentState.current;
    render._navigate('preview', { doc: { meta: {}, nodes: [] } }, resolve);
    assert(prev === 'editor', 'editor was current before preview');
  });
  assert(document.getElementById('editor').style.display === 'block', 'modal keeps editor visible');
  assert(document.getElementById('preview').style.display === 'block', 'preview visible');
  assert(render.state.components.preview.component.mounted === 1, 'preview mounted');

  render._goBack();
  assert(document.getElementById('preview').style.display === 'none', 'preview hidden after goBack');
  assert(render.state.components.preview.isMount === false, 'preview unmounted flag');
  assert(render.state.components.editor.component.unmounted === 0, 'editor not unmounted by modal close');
}

section('engine: setData / refresh');
{
  class RefreshPage extends Component {
    constructor(deps) {
      super(deps);
      this.renderCount = 0;
      this.attachCount = 0;
      this.state.data.label = 'a';
    }
    async componentDidMount() {}
    componentDidUnMount() {}
    componentDidAttachEvents() {
      this.attachCount += 1;
    }
    render() {
      this.renderCount += 1;
    }
  }

  const mounts = {};
  globalThis.document = {
    getElementById(id) {
      if (!mounts[id]) mounts[id] = { style: { display: 'none' }, id };
      return mounts[id];
    },
  };

  const host = new ComponentRender({ logEnv: LogEnv.disable });
  host.init(
    { loading: 'boot', home: 'page' },
    {
      boot: RefreshPage,
      page: RefreshPage,
    }
  );

  await new Promise((resolve) => {
    host._navigate('page', null, resolve);
  });

  const page = host.state.components.page.component;
  assert(page.renderCount === 1, 'initial render once');
  assert(page.attachCount === 1, 'AttachEvents once on mount');

  page.setData({ label: 'b' });
  assert(page.state.data.label === 'b', 'setData merges state.data');
  assert(page.renderCount === 2, 'setData triggers refresh/render');
  assert(page.attachCount === 1, 'refresh does not re-AttachEvents');

  host.refresh();
  assert(page.renderCount === 3, 'navigator.refresh re-renders current page');
  assert(page.attachCount === 1, 'navigator.refresh still skips AttachEvents');

  page.setData({ label: 'c' }, { refresh: false });
  assert(page.state.data.label === 'c' && page.renderCount === 3, 'setData can skip refresh');
}

section('engine: Component.mount composition');
{
  class Child extends Component {
    constructor(deps) {
      super(deps);
      this.mounts = 0;
      this.unmounts = 0;
      this.renders = 0;
      this.attaches = 0;
      this.state.data.n = 0;
    }
    async componentDidMount() {
      this.mounts += 1;
    }
    componentDidUnMount() {
      this.unmounts += 1;
    }
    componentDidAttachEvents() {
      this.attaches += 1;
    }
    render() {
      this.renders += 1;
    }
  }

  const child = new Child();
  const hostEl = { id: 'host-x', firstChild: null, removeChild() {} };
  await child.mount(hostEl);
  assert(child.isMounted() && child.host() === hostEl, 'mount sets host');
  assert(child.mounts === 1 && child.renders === 1 && child.attaches === 1, 'mount runs full lifecycle');
  child.setData({ n: 1 });
  assert(child.renders === 2 && child.attaches === 1, 'setData refresh skips AttachEvents');
  child.unmount();
  assert(!child.isMounted() && child.unmounts === 1, 'unmount runs DidUnMount');
}

section('engine: paint / ensureShell / on');
{
  const listeners = new Map();
  function makeEl(id) {
    return {
      id,
      children: [],
      firstChild: null,
      style: {},
      dataset: {},
      appendChild(child) {
        this.children.push(child);
        this.firstChild = this.children[0] || null;
      },
      removeChild(child) {
        this.children = this.children.filter((c) => c !== child);
        this.firstChild = this.children[0] || null;
      },
      addEventListener(type, handler) {
        const key = `${type}`;
        if (!listeners.has(this)) listeners.set(this, []);
        listeners.get(this).push({ type, handler });
      },
      removeEventListener(type, handler) {
        const list = listeners.get(this) || [];
        listeners.set(
          this,
          list.filter((l) => !(l.type === type && l.handler === handler))
        );
      },
    };
  }

  globalThis.document = {
    createElement(tag) {
      return makeEl(tag);
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: String(text) };
    },
    getElementById() {
      return null;
    },
  };

  class Panel extends Component {
    constructor() {
      super();
      this.clicks = 0;
    }
    componentDidAttachEvents() {
      this.onId('btn', 'click', () => {
        this.clicks += 1;
      });
    }
    render() {
      this.ensureShell(
        (ids) => ids.panel,
        ({ div, button }) => {
          div(
            { className: 'panel', id: 'panel' },
            button({ id: 'btn', type: 'button', text: 'Go' })
          );
        }
      );
    }
  }

  const host = makeEl('host');
  const panel = new Panel();
  await panel.mount(host);
  assert(!!panel.ids().panel && !!panel.ids().btn, 'paint/ensureShell indexes ids');
  assert(host.children.length === 1, 'paint appends root once');

  panel.refresh();
  assert(host.children.length === 1, 'ensureShell skips rebuild on refresh');

  const btn = panel.ids().btn;
  const click = listeners.get(btn)?.find((l) => l.type === 'click');
  assert(!!click, 'onId registered listener');
  click.handler();
  assert(panel.clicks === 1, 'onId handler runs');

  panel.unmount();
  assert((listeners.get(btn) || []).length === 0, 'unmount removes listeners');
  assert(host.children.length === 0, 'unmount clears host');
  assert(Object.keys(panel.ids()).length === 0, 'unmount resets ref');
}

section('product: component ergonomics');
{
  const toolbarSrc = readFileSync(join(root, 'src/product/components/ToolbarComponent.js'), 'utf8');
  const editorSrc = readFileSync(join(root, 'src/product/components/EditorComponent.js'), 'utf8');
  assert(toolbarSrc.includes('ensureShell'), 'Toolbar uses ensureShell');
  assert(toolbarSrc.includes('onClick'), 'Toolbar uses declarative onClick');
  assert(!toolbarSrc.includes('onId'), 'Toolbar no longer uses onId AttachEvents');
  assert(!toolbarSrc.includes('componentDidAttachEvents'), 'Toolbar has no AttachEvents split');
  assert(!toolbarSrc.includes('D.clear'), 'Toolbar does not hand-clear host');
  assert(editorSrc.includes('ensureShell') && editorSrc.includes("this.on(window"), 'Editor uses ensureShell + on(window)');
  assert(toolbarSrc.includes('static styles'), 'Toolbar declares static styles');
  assert(editorSrc.includes('EditorComponent.css'), 'Editor styles co-located');
  assert(editorSrc.includes('new ToolbarComponent'), 'Editor composes with new Child(deps)');
  assert(editorSrc.includes('navigator: this.navigator'), 'Editor forwards navigator in deps');
  assert(toolbarSrc.includes('this.navigator.navigate'), 'Toolbar uses navigator like a page');
  assert(!toolbarSrc.includes('constructor(navigator'), 'Toolbar no positional navigator ctor');
  const mainSrc = readFileSync(join(root, 'src/product/main.js'), 'utf8');
  assert(mainSrc.includes('boot: BootComponent'), 'main uses init shorthand');
}

section('engine: adoptStyles');
{
  resetAdoptedStyles();
  const headKids = [];
  globalThis.document = {
    head: {
      appendChild(el) {
        headKids.push(el);
        if (el.tagName === 'LINK' && typeof el.onload === 'function') {
          queueMicrotask(() => el.onload());
        }
      },
    },
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(),
        dataset: {},
        rel: '',
        href: '',
        textContent: '',
        onload: null,
        onerror: null,
      };
    },
  };

  await adoptStyles('.x { color: red }', 'text-x');
  assert(headKids.some((el) => el.tagName === 'STYLE' && el.textContent.includes('color: red')), 'adoptStyles injects style text');
  const before = headKids.length;
  await adoptStyles('.x { color: red }', 'text-x');
  assert(headKids.length === before, 'adoptStyles dedupes by key');
  assert(adoptedStyleKeys().includes('text-x'), 'adoptedStyleKeys lists keys');

  // Auto-scope: authors write .panel; engine prefixes [data-gd-c="…"]
  const scoped = scopeCssText('.toolbar { color: red } .toolbar:hover { color: blue }', 'ToolbarComponent');
  assert(scoped.includes('[data-gd-c="ToolbarComponent"] .toolbar'), 'scopeCssText prefixes class selectors');
  assert(scoped.includes('[data-gd-c="ToolbarComponent"] .toolbar:hover'), 'scopeCssText keeps pseudo');
  assert(!scoped.includes('[data-gd-c="ToolbarComponent"] .toolbar { color: red } .toolbar:hover'), 'each selector prefixed');
  const media = scopeCssText('@media (min-width: 1px) { .x { a: 1 } }', 'A');
  assert(media.includes('@media') && media.includes('[data-gd-c="A"] .x'), 'scopeCssText recurses into @media');
  const frames = scopeCssText('@keyframes spin { from { opacity: 0 } } .y { animation: spin 1s }', 'B');
  assert(frames.includes('@keyframes spin'), 'scopeCssText leaves @keyframes global');
  assert(frames.includes('[data-gd-c="B"] .y'), 'scopeCssText still scopes sibling rules');
  assert(
    /^:root\s*\{/.test(scopeCssText(':root { --x: 1 }', 'C').trim()) &&
      !scopeCssText(':root { --x: 1 }', 'C').includes('[data-gd-c'),
    'scopeCssText leaves :root'
  );
  assert(styleScopeId({ name: 'Foo' }) === 'Foo', 'styleScopeId uses class name');
  assert(styleScopeId({ name: 'Foo', styleScope: 'bar' }) === 'bar', 'styleScopeId respects styleScope');
  assert(STYLE_SCOPE_ATTR === 'data-gd-c', 'STYLE_SCOPE_ATTR stable');

  class Styled extends Component {
    static styles = '.panel { display: block }';
  }
  await adoptStylesFor(Styled);
  assert(
    headKids.some(
      (el) =>
        el.tagName === 'STYLE' &&
        el.textContent.includes('[data-gd-c="Styled"] .panel') &&
        el.textContent.includes('display: block')
    ),
    'adoptStylesFor auto-scopes static styles'
  );

  class GlobalStyled extends Component {
    static styles = '.naked { display: flex }';
    static stylesScoped = false;
  }
  await adoptStylesFor(GlobalStyled);
  assert(
    headKids.some(
      (el) => el.tagName === 'STYLE' && el.textContent.includes('.naked { display: flex }') && !el.textContent.includes('[data-gd-c="GlobalStyled"]')
    ),
    'stylesScoped=false keeps global selectors'
  );

  class Linked extends Component {
    static styles = new URL('http://example.test/panel.css');
    static stylesScoped = false; // URL link path (no fetch in this mock)
    render() {}
  }
  const host = {
    id: 'h',
    firstChild: null,
    removeChild() {},
    appendChild() {},
    setAttribute(name, value) {
      this[name] = value;
    },
  };
  const linked = new Linked();
  await linked.mount(host);
  assert(
    headKids.some((el) => el.tagName === 'LINK' && el.href.includes('panel.css')),
    'mount adopts URL stylesheet when unscoped'
  );
  // stylesScoped=false → no data-gd-c stamp required; scoped components stamp host
  class Local extends Component {
    static styles = '.z { color: #000 }';
    render() {}
  }
  const host2 = {
    attrs: {},
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
    firstChild: null,
    removeChild() {},
    appendChild() {},
  };
  await new Local().mount(host2);
  assert(host2.attrs['data-gd-c'] === 'Local', 'mount stamps data-gd-c on host');
  assert(
    headKids.some((el) => el.tagName === 'STYLE' && el.textContent.includes('[data-gd-c="Local"] .z')),
    'mount injects scoped CSS for Local'
  );
  resetAdoptedStyles();
}

section('engine: declarative on* events');
{
  assert(domEventType('onClick') === 'click', 'onClick → click');
  assert(domEventType('onPointerDown') === 'pointerdown', 'onPointerDown → pointerdown');
  assert(domEventType('onDoubleClick') === 'dblclick', 'onDoubleClick → dblclick');
  assert(domEventType('onclick') == null, 'lowercase onclick ignored');
  assert(domEventType('className') == null, 'non-event prop ignored');

  const listeners = [];
  globalThis.document = {
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(),
        children: [],
        style: {},
        dataset: {},
        appendChild(child) {
          this.children.push(child);
        },
        setAttribute(name, value) {
          this[name] = value;
        },
        addEventListener(type, handler) {
          listeners.push({ type, handler, el: this });
        },
      };
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: String(text) };
    },
  };

  let clicks = 0;
  const { button, get } = bind();
  button({
    id: 'go',
    type: 'button',
    text: 'Go',
    onClick: () => {
      clicks += 1;
    },
    events: {
      dragstart: () => {
        clicks += 10;
      },
    },
  });
  const [ref] = get();
  assert(!!ref.id.go, 'button created with id');
  assert(
    listeners.some((l) => l.type === 'click') && listeners.some((l) => l.type === 'dragstart'),
    'onClick and events bag register listeners'
  );
  listeners.find((l) => l.type === 'click').handler();
  listeners.find((l) => l.type === 'dragstart').handler();
  assert(clicks === 11, 'declarative handlers run');
  assert(ref.id.go.onClick == null, 'onClick not assigned as DOM property');
}

section('engine: D / Element');
{
  globalThis.document = {
    createElement(tag) {
      const el = {
        tagName: tag.toUpperCase(),
        children: [],
        style: {},
        dataset: {},
        appendChild(child) {
          this.children.push(child);
        },
        setAttribute(name, value) {
          this[name] = value;
        },
        addEventListener() {},
      };
      return el;
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: String(text) };
    },
  };
  const d = new D();
  d.div({ className: 'wrap', id: 'wrap' }).childList([
    d.div({ className: 'child', text: 'hi' }),
  ]);
  const [ref, root] = d.get();
  assert(!!ref.class.wrap && !!ref.id.wrap, 'D indexes class and id');
  assert(root.children.length === 1, 'D.childList appends child');
  assert(root.children[0].innerText === 'hi', 'Element text attribute sets innerText');
  assert(Element === Element, 'Element export available');

  const d2 = new D();
  d2.button({
    key: 'save',
    className: 'btn btn--primary',
    type: 'button',
    text: '保存',
    dataset: { action: 'save' },
    style: { marginTop: '8px' },
  });
  // 同构建再写一个同 class 前缀，不应 throw/alert
  d2.button({
    key: 'cancel',
    className: 'btn btn--ghost',
    type: 'button',
    text: '取消',
  });
  const [ref2] = d2.get();
  assert(ref2.key.save && ref2.key.cancel, 'D key indexes list items');
  assert(ref2.key.save.className === 'btn btn--primary', 'multi className allowed');
  assert(ref2.key.save.dataset.action === 'save', 'dataset assigned');
  assert(ref2.key.save.style.marginTop === '8px', 'style object assigned');
  assert(typeof d2.el === 'function', 'd.el helper exists');

  // trailing children
  const d3 = new D();
  d3.div({ className: 'parent', id: 'parent' }, d3.span({ className: 'kid', text: 'k' }));
  const [ref3, root3] = d3.get();
  assert(root3.children.length === 1 && root3.children[0].innerText === 'k', 'trailing children work');
  assert(ref3.id.parent, 'trailing-children root keeps id');

  // bind + map
  const { div, button, map, get, h } = bind();
  div(
    { className: 'list', id: 'list' },
    ...map(
      [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
      (item, _i, key) => button({ key, className: 'item', text: item.label }),
      (item) => item.id
    )
  );
  const [ref4, root4] = get();
  assert(ref4.key.a && ref4.key.b, 'map auto-keys items');
  assert(root4.children.length === 2, 'map children appended via spread');
  assert(typeof h === 'function', 'bind exposes h');
  const nav = h('nav', { className: 'nav', id: 'navX' }, h('span', { text: 'n' }));
  assert(nav.e.tagName === 'NAV' && nav.e.children.length === 1, 'h builds arbitrary tags');
}

section('product: store + export');
{
  const store = createStore();
  const block = FALLBACK_BLOCKS.find((b) => b.id === 'button');
  const id = store.addNode(block, { x: 10, y: 20 });
  assert(store.getSelected()?.id === id, 'store selects new node');
  store.updateNode(id, { x: 40 });
  store.undo();
  assert(store.getSelected().x === 10, 'store undo works');

  assert(escapeHtml('<a>') === '&lt;a&gt;', 'escapeHtml works');
  const html = documentToHtml({
    meta: { ...DEFAULT_DOC.meta, name: 'Demo' },
    nodes: [
      {
        id: 'n1',
        kind: 'button',
        x: 1,
        y: 2,
        width: 100,
        height: 40,
        props: { text: 'Go' },
        style: {},
      },
    ],
  });
  assert(html.includes('Demo') && html.includes('Go'), 'documentToHtml includes content');
  assert(FALLBACK_BLOCKS.length >= 6, 'fallback blocks present');
}

section('product: nodes registry');
{
  assert(Object.keys(registry).length >= 6, 'node kinds registered');

  globalThis.document = {
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(),
        children: [],
        style: {},
        dataset: {},
        classList: { toggle() {} },
        appendChild(child) {
          this.children.push(child);
        },
      };
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: String(text) };
    },
  };

  const node = {
    id: 'n_btn',
    kind: 'button',
    label: '按钮',
    x: 0,
    y: 0,
    width: 100,
    height: 40,
    props: { text: 'Hi' },
    style: { background: '#2bb0a6' },
  };
  const el = createNodeElement(node);
  assert(el.dataset.kind === 'button' && el.innerText === 'Hi', 'button node create via registry');

  const model = inspectorModel(node);
  assert(model.props.some((f) => f.prop === 'text'), 'inspectorModel uses kind fields');
  assert(model.geometry.length === 4, 'inspectorModel includes geometry');

  const editorSrc = readFileSync(join(root, 'src/product/components/EditorComponent.js'), 'utf8');
  assert(!/switch\s*\(\s*node\.kind/.test(editorSrc), 'EditorComponent has no kind switch');
  assert(editorSrc.includes('ToolbarComponent') && editorSrc.includes('.mount('), 'Editor mounts child Components');
  assert(!editorSrc.includes('ToolbarView'), 'Editor no longer uses View pattern');
}

section('ui kit');
{
  const tokens = readFileSync(join(root, 'src/ui/css/tokens.css'), 'utf8');
  assert(tokens.includes('--gd-primary'), 'UI tokens define --gd-primary');
  assert(/#e86a17|#E86A17/.test(tokens), 'default primary is orange');
  assert(tokens.includes('--gd-bg-container: #ffffff') || tokens.includes('--gd-bg-elevated: #ffffff'), 'panels default to white');
  assert(/--gd-bg:\s*#ffffff/.test(tokens), 'orange page background is pure white');
  assert(tokens.includes('--gd-mask:') && tokens.includes('rgba(0, 0, 0,'), 'overlay masks use neutral black');
  assert(tokens.includes("data-gd-theme='blue'") || tokens.includes('data-gd-theme="blue"'), 'blue theme tokens present');
  assert(tokens.includes("data-gd-theme='green'") || tokens.includes('data-gd-theme="green"'), 'green theme tokens present');
  assert(/#2f6fed/i.test(tokens), 'blue primary token present');
  assert(/#2f8f5b/i.test(tokens), 'green primary token present');

  const ui = await import('../src/ui/index.js');
  const {
    Button,
    cx,
    Space,
    Card,
    Checkbox,
    Switch,
    Badge,
    Tabs,
    Accordion,
    Breadcrumbs,
    Drawer,
    Toast,
    CommandPalette,
    Table,
    Tree,
    ProgressBar,
  } = ui;
  assert(typeof Button === 'function' && typeof Space === 'function', 'UI primitives exported');
  assert(typeof Checkbox === 'function' && typeof Switch === 'function' && typeof Badge === 'function', 'control primitives exported');
  assert(typeof Tabs === 'function' && typeof Accordion === 'function', 'Tabs/Accordion exported');
  assert(typeof Drawer === 'function' && typeof Toast === 'function', 'Drawer/Toast components exported');
  assert(typeof CommandPalette === 'function', 'CommandPalette exported');
  assert(typeof Table === 'function' && typeof Tree === 'function', 'Table/Tree exported');
  assert(typeof ProgressBar === 'function', 'ProgressBar exported');
  assert(typeof ui.WorkflowDAG === 'function', 'WorkflowDAG component exported');
  assert(typeof ui.WorkflowBoard === 'function', 'WorkflowBoard primitive exported');
  {
    const wf = new ui.WorkflowDAG({});
    assert(typeof wf.setGraph === 'function' && typeof wf.openDrawerFor === 'function', 'WorkflowDAG graph/drawer API');
    wf.setGraph({
      columns: [{ key: 'a', title: 'A', nodes: [{ key: 'n1', title: 'N1' }] }],
      edges: [],
    });
    assert(wf.state.data.columns.length === 1 && wf.findNode('n1')?.title === 'N1', 'WorkflowDAG setGraph + findNode');
  }
  assert(typeof ui.JsonTree === 'function', 'JsonTree component exported');
  assert(typeof ui.flattenJsonTree === 'function', 'flattenJsonTree helper exported');
  {
    const sample = { a: 1, b: { c: true, d: [null, 'x'] } };
    assert(ui.jsonValueType(null) === 'null' && ui.jsonValueType([]) === 'array', 'jsonValueType covers null/array');
    const collapsed = ui.flattenJsonTree(sample, new Set());
    assert(collapsed.length === 1 && collapsed[0].path === '$', 'collapsed JSON tree is a single root row');
    const open = ui.flattenJsonTree(sample, new Set(['$', "$['b']", "$['b']['d']"]));
    assert(open.length >= 6, 'expanded JSON tree flattens nested rows');
    assert(open.some((r) => r.type === 'string' && r.value === 'x'), 'flatten includes leaf string values');
    const jt = new ui.JsonTree({ defaultExpand: 1 });
    jt.loadData(sample);
    assert(jt.state.data.expanded.has('$'), 'JsonTree defaultExpand opens root');
    jt.expand();
    assert(jt.state.data.expanded.size >= 3, 'JsonTree.expand opens complex paths');
    jt.collapse();
    assert(jt.state.data.expanded.size === 0, 'JsonTree.collapse clears expansion');
  }
  assert(typeof ui.CodeBlock === 'function', 'CodeBlock exported');
  assert(typeof ui.DiffBlock === 'function', 'DiffBlock exported');
  assert(typeof ui.parseDiffLines === 'function', 'parseDiffLines exported');
  assert(ui.parseUnifiedDiff === ui.parseDiffLines, 'parseUnifiedDiff aliases parseDiffLines');
  assert(typeof ui.MarkdownEditor === 'function', 'MarkdownEditor exported');
  assert(typeof ui.renderMarkdown === 'function', 'renderMarkdown exported');
  assert(typeof ui.createMarkdownEditor === 'function', 'createMarkdownEditor exported');
  assert(typeof ui.CoverFlow === 'function', 'CoverFlow exported');
  assert(ui.CoverflowCarousel === ui.CoverFlow, 'CoverflowCarousel aliases CoverFlow');
  assert(typeof ui.normalizeCoverFlowItems === 'function', 'normalizeCoverFlowItems exported');
  {
    const items = ui.normalizeCoverFlowItems(['A', { key: 'b', title: 'Bee', subtitle: 'x' }]);
    assert(items.length === 2 && items[0].title === 'A' && items[1].key === 'b', 'normalizeCoverFlowItems shapes items');
    const cf = new ui.CoverFlow({ items: ['one', 'two', 'three'], index: 1 });
    assert(cf.getIndex() === 1, 'CoverFlow initial index');
    assert(cf.getActiveItem()?.title === 'two', 'CoverFlow active item');
    cf.next();
    assert(cf.getIndex() === 2, 'CoverFlow.next advances');
    cf.next();
    assert(cf.getIndex() === 0, 'CoverFlow loops by default');
    cf.setIndex(1);
    assert(cf.getIndex() === 1, 'CoverFlow.setIndex');
  }
  {
    const html = ui.renderMarkdown(
      '# Title\n\nHello **world** and *it*.\n\n- a\n- b\n\n```js\nconst x = 1;\n```\n\n> quote\n\n[link](https://example.com)\n'
    );
    assert(html.includes('<h1>') && html.includes('Title'), 'renderMarkdown heading');
    assert(html.includes('<strong>world</strong>'), 'renderMarkdown bold');
    assert(html.includes('<em>it</em>'), 'renderMarkdown italic');
    assert(html.includes('<ul>') && html.includes('<li>'), 'renderMarkdown list');
    assert(html.includes('<pre') && html.includes('const x = 1;'), 'renderMarkdown fence');
    assert(html.includes('<blockquote>'), 'renderMarkdown quote');
    assert(html.includes('href="https://example.com"'), 'renderMarkdown link');
    assert(ui.escapeHtml('<script>') === '&lt;script&gt;', 'escapeHtml encodes tags');
    assert(
      !ui.renderMarkdown('`<script>alert(1)</script>`').includes('<script>'),
      'inline code escapes raw HTML'
    );
    const ta = {
      value: 'hello',
      selectionStart: 0,
      selectionEnd: 5,
      focus() {},
      setSelectionRange(a, b) {
        this.selectionStart = a;
        this.selectionEnd = b;
      },
    };
    assert(ui.wrapSelection(ta, '**', '**') === '**hello**', 'wrapSelection wraps selection');
    const ed = new ui.MarkdownEditor({ value: '# hi', mode: 'edit' });
    assert(ed.getValue() === '# hi', 'MarkdownEditor.getValue');
    ed.setValue('## next', { refresh: false });
    assert(ed.getValue() === '## next', 'MarkdownEditor.setValue');
    ed.setMode('preview');
    assert(ed.state.data.mode === 'preview', 'MarkdownEditor.setMode');
  }
  {
    // --- experiments that document / lock fixes vs highlightjs-line-numbers.js ---
    // Bug 1: trailing newline should keep an empty display line (hljs-ln pops it).
    const withTrail = ui.splitCodeLines('a\nb\n');
    assert(withTrail.length === 3 && withTrail[2] === '', 'trailing newline keeps empty line');
    const noTrail = ui.splitCodeLines('a\nb');
    assert(noTrail.length === 2, 'no trailing newline → exact line count');
    assert(ui.splitCodeLines('').length === 1, 'empty source is one empty line');
    assert(ui.splitCodeLines('a\r\nb').length === 2, 'CRLF splits to two lines');

    // Bug 2: multiline tokens must not be split via HTML rewrite — token→line map.
    const multi = '/*\n line2\n*/\nconst x = 1;';
    const toks = ui.tokenizeCode(multi, 'javascript');
    assert(toks.some((t) => t.type === 'comment' && t.text.includes('\n')), 'comment token may span newlines');
    const mapped = ui.tokensToLineNodes(toks);
    assert(mapped.length === ui.splitCodeLines(multi).length, 'token map line count matches source');
    assert(mapped[0].some((p) => p.type === 'comment'), 'first line keeps comment token type');
    assert(mapped[1].some((p) => p.type === 'comment'), 'continuation line keeps comment token type');

    const hi = ui.codeToHighlightedLines(multi, 'javascript');
    assert(hi.length === 4, 'highlighted lines honor trailing structure');
  }
  {
    const patch =
      '--- a/x.js\n+++ b/x.js\n@@ -1,3 +1,4 @@\n keep\n-old\n+new\n+extra\n keep2\n';
    const rows = ui.parseDiffLines(patch);
    assert(rows[0].type === 'meta' && rows[1].type === 'meta', 'diff headers are meta');
    assert(rows[2].type === 'hunk', 'hunk header parsed');
    const types = rows.map((r) => r.type).join(',');
    assert(types.includes('del') && types.includes('add') && types.includes('ctx'), 'add/del/ctx present');
    const del = rows.find((r) => r.type === 'del');
    const add = rows.find((r) => r.type === 'add');
    assert(del && del.text === 'old' && del.oldLine === 2 && del.newLine == null, 'del tracks old line');
    assert(add && add.text === 'new' && add.newLine === 2 && add.oldLine == null, 'add tracks new line');
    const simple = ui.parseDiffLines('-a\n+b\n c\n');
    assert(simple.length === 3, 'hunk-less +/-/space parses');
    assert(simple[0].type === 'del' && simple[1].type === 'add' && simple[2].type === 'ctx', 'hunk-less types');
  }

  {
    const { treePathKeys, nextTreeExpandedKeys } = ui;
    assert(typeof treePathKeys === 'function' && typeof nextTreeExpandedKeys === 'function', 'tree accordion helpers exported');
    const sample = [
      {
        key: 'root',
        children: [
          { key: 'ui', children: [{ key: 'btn' }, { key: 'tree' }] },
          { key: 'engine', children: [{ key: 'log' }] },
        ],
      },
    ];
    assert(treePathKeys(sample, 'tree').join(',') === 'root,ui,tree', 'treePathKeys finds root→node path');
    assert(
      nextTreeExpandedKeys({
        treeData: sample,
        expandedKeys: ['root', 'ui'],
        key: 'engine',
        accordion: true,
      }).join(',') === 'root,engine',
      'accordion open keeps only root→node path'
    );
    assert(
      nextTreeExpandedKeys({
        treeData: sample,
        expandedKeys: ['root', 'engine'],
        key: 'engine',
        accordion: true,
      }).join(',') === 'root',
      'accordion close keeps ancestors only'
    );
    const multi = nextTreeExpandedKeys({
      treeData: sample,
      expandedKeys: ['root'],
      key: 'ui',
      accordion: false,
    });
    assert(multi.includes('root') && multi.includes('ui'), 'non-accordion expands without clearing');
  }

  const namedExports = [
    'Radio', 'Chip', 'Pill', 'Banner', 'Callout', 'Skeleton', 'Avatar', 'AvatarGroup',
    'StatusDot', 'Collapse', 'ToggleGroup', 'Steps', 'Pagination', 'Navbar', 'SiteHeader',
    'BottomNav', 'Sidebar', 'Toolbar', 'Tooltip', 'Popover', 'DropdownMenu', 'HoverCard',
    'Combobox', 'TagInput', 'MultiSelect', 'Transfer', 'Slider', 'ColorWell', 'DatePicker',
    'Timeline', 'ChatBubble', 'Carousel', 'CoverFlow', 'BentoGrid', 'Marquee', 'Fab', 'Lightbox',
    'PieChart', 'DonutChart', 'SearchInput', 'SignInForm', 'Truncate', 'Splitter',
    'InputNumber', 'Rate', 'Cascader', 'Upload', 'Mentions', 'TreeSelect', 'Form', 'FormItem',
    'List', 'Descriptions', 'Statistic', 'Calendar', 'Image', 'Result', 'Popconfirm',
    'Notification', 'Watermark', 'Flex', 'Row', 'Col', 'Layout', 'Menu', 'Affix', 'Anchor',
    'Icon', 'ConfigProvider',
  ];
  for (const name of namedExports) {
    assert(typeof ui[name] === 'function', `export ${name}`);
  }
  assert(ui.themes && ui.themes.orange && ui.themes.blue && ui.themes.green, 'themes catalog exported');
  assert(typeof ui.setTheme === 'function' && typeof ui.getTheme === 'function', 'setTheme/getTheme exported');

  const docs = readFileSync(join(root, 'docs/ui.md'), 'utf8');
  assert(docs.includes('namethatui.com') || docs.includes('NameThatUI'), 'docs reference NameThatUI');
  assert(docs.includes('Ant Design') || docs.includes('ant.design'), 'docs reference Ant Design');
  assert(docs.includes('DiffBlock') && docs.includes('parseDiffLines'), 'docs cover DiffBlock');
  assert(docs.includes('MarkdownEditor') && docs.includes('renderMarkdown'), 'docs cover MarkdownEditor');
  assert(docs.includes('CoverFlow') && docs.includes('封面流'), 'docs cover CoverFlow');
  assert(docs.includes('LoadingButton') && docs.includes('Loading Button'), 'docs cover LoadingButton');

  const listeners = [];
  globalThis.document = {
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(),
        children: [],
        style: {},
        dataset: {},
        classList: { toggle() {} },
        appendChild(child) {
          this.children.push(child);
        },
        setAttribute(name, value) {
          this[name] = value;
        },
        addEventListener(type, handler) {
          listeners.push({ type, handler });
        },
      };
    },
    createElementNS(_ns, tag) {
      return globalThis.document.createElement(tag);
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: String(text) };
    },
    head: { appendChild() {} },
  };

  let clicked = false;
  const btn = Button({
    type: 'primary',
    text: 'Save',
    onClick: () => {
      clicked = true;
    },
  });
  assert(btn.e.className.includes('gd-btn--primary'), 'Button applies primary class');
  {
    const label = (btn.e.children || []).find((c) => String(c.className || '').includes('gd-btn__label'));
    assert(
      (label && label.innerText === 'Save') || btn.e.innerText === 'Save',
      'Button text set'
    );
  }
  listeners.find((l) => l.type === 'click')?.handler();
  assert(clicked, 'Button onClick fires');

  const busy = Button({ type: 'primary', text: 'Go', loading: true, indicator: 'dots' });
  assert(busy.e.className.includes('gd-btn--loading'), 'Button loading class');
  assert(busy.e.disabled === true, 'Button loading disables');
  assert(
    (busy.e.children || []).some((c) => String(c.className || '').includes('gd-btn__indicator--dots')),
    'Button loading shows dots indicator'
  );
  let busyClicks = 0;
  const locked = Button({
    text: 'Lock',
    loading: true,
    onClick: () => {
      busyClicks += 1;
    },
  });
  listeners.filter((l) => l.type === 'click').at(-1)?.handler({ preventDefault() {}, stopPropagation() {} });
  assert(busyClicks === 0, 'Button loading blocks onClick');

  assert(typeof ui.LoadingButton === 'function', 'LoadingButton exported');
  assert(ui.AsyncButton === ui.LoadingButton, 'AsyncButton aliases LoadingButton');
  {
    let runs = 0;
    const lb = new ui.LoadingButton({
      text: 'Save',
      onClick: async () => {
        runs += 1;
        await Promise.resolve();
      },
    });
    assert(lb.isLoading() === false, 'LoadingButton idle');
    const p1 = lb.trigger();
    assert(lb.isLoading() === true, 'LoadingButton busy after trigger');
    const p2 = lb.trigger();
    await Promise.all([p1, p2]);
    assert(runs === 1, 'LoadingButton ignores re-entry while pending');
    assert(lb.isLoading() === false, 'LoadingButton settles');
  }

  const card = Card({ title: 'Hi' }, Button({ text: 'Go' }));
  assert(card.e.className.includes('gd-card'), 'Card root class');
  assert(typeof cx('a', false, 'b') === 'string' && cx('a', false, 'b') === 'a b', 'cx helper');

  // CodeBlock DOM (needs setAttribute mock above)
  {
    const find = (node, pred, out = []) => {
      if (!node) return out;
      if (pred(node)) out.push(node);
      for (const c of node.children || []) find(c, pred, out);
      return out;
    };
    const one = ui.CodeBlock({ code: 'const a = 1;', language: 'javascript', lineNumbers: true });
    const lines = find(one.e, (n) => String(n.className || '').includes('gd-code__line'));
    assert(lines.length === 1, 'single-line still numbered');
    assert(
      find(one.e, (n) => String(n.className || '').includes('gd-code__n')).length === 1,
      'single-line renders gutter'
    );
    const block = ui.CodeBlock({
      code: 'one\ntwo\nthree\n',
      language: 'plaintext',
      startFrom: 10,
      highlightLines: [11],
      showCopy: false,
    });
    assert(block.e['data-start-from'] === '10' || block.e.getAttribute?.('data-start-from') === '10', 'startFrom stamped on root');
    const hl = find(block.e, (n) => String(n.className || '').includes('gd-code__line--hl'));
    assert(hl.length === 1, 'highlightLines marks target');
    assert(find(block.e, (n) => n.tagName === 'TABLE').length === 0, 'CodeBlock does not use table layout');

    const diff = ui.DiffBlock({
      language: 'javascript',
      showCopy: false,
      diff: '@@ -1,2 +1,2 @@\n-a\n+b\n',
    });
    assert(String(diff.e.className || '').includes('gd-code--diff'), 'DiffBlock root has gd-code--diff');
    assert(
      find(diff.e, (n) => String(n.className || '').includes('gd-code__line--del')).length === 1,
      'DiffBlock marks deleted line'
    );
    assert(
      find(diff.e, (n) => String(n.className || '').includes('gd-code__line--add')).length === 1,
      'DiffBlock marks added line'
    );
    assert(
      find(diff.e, (n) => String(n.className || '').includes('gd-code__n--old')).length >= 1,
      'DiffBlock dual old gutter'
    );
    assert(
      find(diff.e, (n) => String(n.className || '').includes('gd-code__n--new')).length >= 1,
      'DiffBlock dual new gutter'
    );
    const viaMode = ui.CodeBlock({ mode: 'diff', diff: '+x\n' });
    assert(String(viaMode.e.className || '').includes('gd-code--diff'), 'CodeBlock mode=diff → DiffBlock');
  }

  listeners.length = 0;
  let switched = null;
  const sw = Switch({
    checked: true,
    onChange: (on) => {
      switched = on;
    },
  });
  assert(sw.e.className.includes('gd-switch--checked'), 'Switch checked class');
  assert(listeners.some((l) => l.type === 'click'), 'Switch registers click');
  listeners.find((l) => l.type === 'click')?.handler({});
  assert(switched === false, 'Switch onChange receives next value');

  const badge = Badge({ count: 12 }, Button({ text: 'Mail' }));
  assert(badge.e.className.includes('gd-badge'), 'Badge wraps child');

  const modalSrc = readFileSync(join(root, 'src/ui/Modal.js'), 'utf8');
  assert(modalSrc.includes('gd-modal-portal'), 'Modal mounts via portal (avoids clearing body)');
  assert(modalSrc.includes('super.mount(this._portal'), 'Modal delegates mount to portal host');

  const crumbs = Breadcrumbs({
    items: [{ label: 'Home' }, { label: 'UI' }, { label: 'Here' }],
  });
  assert(crumbs.e.className.includes('gd-breadcrumb'), 'Breadcrumbs root class');

  const bar = ProgressBar({ percent: 50, showInfo: true });
  assert(bar.e.className.includes('gd-progress'), 'ProgressBar root class');

  const rate = ui.Rate({ value: 3, onChange: () => {} });
  assert(rate.e.className.includes('gd-rate'), 'Rate root class');
  const inputNumber = ui.InputNumber({ value: 1, onChange: () => {} });
  assert(inputNumber.e.className.includes('gd-input-number'), 'InputNumber root class');
  const menu = ui.Menu({
    items: [{ key: '1', label: 'One' }],
    selectedKey: '1',
  });
  assert(menu.e.className.includes('gd-menu'), 'Menu root class');

  const htmlEl = {
    attrs: {},
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
    getAttribute(name) {
      return this.attrs[name];
    },
  };
  globalThis.document.documentElement = htmlEl;
  assert(ui.setTheme('blue') === 'blue', 'setTheme returns blue');
  assert(htmlEl.attrs['data-gd-theme'] === 'blue', 'setTheme writes data-gd-theme');
  assert(ui.getTheme() === 'blue', 'getTheme reads blue');
  assert(ui.setTheme('green') === 'green', 'setTheme green');
  assert(ui.setTheme('nope') === 'orange', 'invalid theme falls back to orange');

  const scoped = ui.ConfigProvider({ theme: 'blue' }, ui.Button({ type: 'primary', text: 'Hi' }));
  assert(scoped.e.className.includes('gd-config-provider'), 'ConfigProvider root');
}

section('skills blocks');
{
  const manifest = JSON.parse(readFileSync(join(root, 'skills/blocks/manifest.json'), 'utf8'));
  for (const file of manifest.blocks) {
    assert(existsSync(join(root, 'skills/blocks', file)), `block ${file}`);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
