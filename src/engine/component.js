import { D, bind } from './element.js';
import { adoptStyles, adoptStylesFor, applyStyleScope } from './styles.js';

/**
 * 迷你实模式 HTML 组件规范（引擎）
 *
 * this.state = {
 *   data: {}, // 视图展示所依赖的数据
 *   ref: {}   // 视图 HTML Element 的索引
 * };
 *
 * 两种挂载方式（同一套生命周期）：
 * 1. 页面：ComponentRender.navigate → mount(页槽)
 * 2. 组合：父组件 ensureShell/paint 出宿主后，子组件 mount(host)
 *
 * 样式与组件同目录：
 *   static styles = new URL('./FooComponent.css', import.meta.url);
 * mount 时按 key 注入一次（见 adoptStyles）。
 *
 * 刷新约定（Mount 之后）：
 * - setData(patch) 合并 this.state.data，并默认调用 refresh()
 * - refresh() 默认再跑 render()；AttachEvents 只在首次 mount
 * - render 用 ensureShell 建壳，refresh 路径不要 D.clear 整棵树（否则事件丢失）
 *
 * 易错点由引擎收掉：
 * - paint / ensureShell：不必手写 clear → bind → get → append
 * - DOM 事件写在 props（onClick…）；window 等用 on()，unmount 自动卸
 * - unmount 默认清宿主 DOM + 重置 ref（DidUnMount 只做业务清理）
 * - 样式旁挂 + mount 注入，不必在 index.html 堆全量 CSS
 * - `static styles` 默认自动 scope：CSS / className 仍写 `.toolbar`，引擎改写选择器并在 host 打 `data-gd-c`；`stylesScoped = false` 关闭
 * - navigator / logger：页面由 ComponentRender 注入；子组件由父写入 deps，用法同为 this.navigator
 *
 * API 一览：docs/api.md
 */
export class Component {
  /**
   * 可选：旁挂样式。URL | CSS 文本 | 数组。
   * @type {string|URL|Array<string|URL>|null}
   */
  static styles = null;

  /**
   * 是否对 `static styles` 自动 scope（默认 true）。
   * 作者不写前缀；注入时改写成 `[data-gd-c="Name"] …`。
   * @type {boolean}
   */
  static stylesScoped = true;

  /**
   * 覆盖 scope id（默认用 class name）。
   * @type {string|null}
   */
  static styleScope = null;

  /** @see {adoptStyles} */
  static adoptStyles = adoptStyles;

  /** @see {adoptStylesFor} */
  static adoptStylesFor = adoptStylesFor;

  /**
   * @param {object} [deps]
   * @param {object} [deps.navigator] 页栈遥控器（页面由引擎注入；子组件通常不需要）
   * @param {import('./log.js').Logger} [deps.logger]
   */
  constructor(deps = {}) {
    this._host = null;
    this._mounted = false;
    this._listeners = [];
    this.state = { data: {}, ref: {} };
    this.navigator = deps.navigator ?? null;
    this.logger = deps.logger ?? null;
  }

  /**
   * 当前宿主 DOM（页槽或父组件给出的 mount 点）
   * @returns {HTMLElement|null}
   */
  host() {
    return this._host;
  }

  /**
   * 是否已 mount（含页内子组件）
   */
  isMounted() {
    return this._mounted;
  }

  /**
   * `this.state.ref.id` 快捷访问（AttachEvents / sync 常用）
   * @returns {Record<string, HTMLElement>}
   */
  ids() {
    return this.state.ref?.id || {};
  }

  /**
   * `this.state.ref.key` 快捷访问
   * @returns {Record<string, HTMLElement>}
   */
  keys() {
    return this.state.ref?.key || {};
  }

  /**
   * 挂到宿主并走完整生命周期（页面与页内组合共用）。
   * @param {string|HTMLElement} host id 或元素
   * @param {object} [params]
   */
  async mount(host, params = {}) {
    if (this._mounted) {
      this.refresh();
      return this;
    }
    this._host = typeof host === 'string' ? document.getElementById(host) : host;
    if (!this._host) {
      throw new Error('Component.mount: host not found');
    }
    await adoptStylesFor(this.constructor);
    applyStyleScope(this._host, this.constructor);
    await this.componentDidMount(params);
    this.render();
    this.componentDidAttachEvents();
    this._mounted = true;
    return this;
  }

  /**
   * 卸载：先业务 DidUnMount，再卸监听、清宿主、重置 ref。
   */
  unmount() {
    if (!this._mounted) return;
    this.componentDidUnMount();
    this._teardown();
    this._mounted = false;
    this._host = null;
  }

  /**
   * 合并视图数据并刷新。
   * @param {object} patch
   * @param {{ refresh?: boolean }} [options] refresh 默认 true
   */
  setData(patch = {}, options = {}) {
    if (!this.state) {
      this.state = { data: {}, ref: {} };
    }
    if (!this.state.data || typeof this.state.data !== 'object') {
      this.state.data = {};
    }
    Object.assign(this.state.data, patch);
    if (options.refresh !== false) {
      this.refresh();
    }
    return this.state.data;
  }

  /**
   * Mount 之后的刷新入口：默认再次 render()。
   * 不重新 AttachEvents / 不走 UnMount。
   */
  refresh() {
    this.render();
  }

  /**
   * 清宿主 → bind 建树 → 写入 state.ref → append。
   * 只用于「整棵重建」；可刷新壳请用 ensureShell。
   * @param {(api: ReturnType<typeof bind>) => void} build
   * @param {HTMLElement} [host]
   */
  paint(build, host = this.host()) {
    if (!host) {
      throw new Error('Component.paint: no host');
    }
    D.clear(host);
    const api = bind();
    build(api);
    const [ref, root] = api.get();
    this.state.ref = ref;
    if (root) host.appendChild(root);
    return ref;
  }

  /**
   * 壳只建一次：probe(ids) 已有则跳过，否则 paint。
   * 解决「refresh 拆掉已绑事件节点」的常见错误。
   * @param {(ids: Record<string, HTMLElement>) => any} probe
   * @param {(api: ReturnType<typeof bind>) => void} build
   * @returns {boolean} true = 本次新建了壳
   */
  ensureShell(probe, build) {
    if (probe(this.ids())) return false;
    this.paint(build);
    return true;
  }

  /**
   * 绑事件并登记，unmount 时自动 removeEventListener。
   * target 为空则跳过（避免 ids.xxx 拼错直接炸）。
   * @param {EventTarget|null|undefined} target
   * @param {string} type
   * @param {EventListener} handler
   * @param {boolean|AddEventListenerOptions} [options]
   */
  on(target, type, handler, options) {
    if (!target) return this;
    target.addEventListener(type, handler, options);
    this._listeners.push({ target, type, handler, options });
    return this;
  }

  /**
   * this.ids()[id] 上绑事件（同上，自动清理）。
   * @param {string} id
   * @param {string} type
   * @param {EventListener} handler
   * @param {boolean|AddEventListenerOptions} [options]
   */
  onId(id, type, handler, options) {
    return this.on(this.ids()[id], type, handler, options);
  }

  /** @private */
  _teardown() {
    for (const { target, type, handler, options } of this._listeners) {
      try {
        target.removeEventListener(type, handler, options);
      } catch {
        /* ignore */
      }
    }
    this._listeners = [];
    const host = this._host;
    if (host) D.clear(host);
    this.state.ref = {};
  }

  /** virtual method — 业务挂载（取数、订阅前准备） */
  async componentDidMount() {}

  /**
   * virtual method — 业务卸载（卸订阅、停动画等）。
   * 不必再 D.clear(host) / 重置 ref：unmount 会统一做。
   */
  componentDidUnMount() {}

  /** virtual method — 首次 render 之后绑事件（用 on / onId） */
  componentDidAttachEvents() {}

  /** virtual method — 绑定 state.data → DOM；壳用 ensureShell */
  render() {}
}
