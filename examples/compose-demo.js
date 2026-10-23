/**
 * Gold-path composition demo.
 *
 * Design intent:
 * 1. Plan the tree first (comment below).
 * 2. One concern per Component (Header / SideNav / DetailPane).
 * 3. Page render only declares assembly — no imperative DOM soup.
 *
 * Real apps: put each class in its own Foo.js + Foo.css file.
 */
import { Component } from '../src/engine/index.js';
import { Button, loadUi } from '../src/ui/index.js';
import { startDemoApp } from './demoApp.js';

/**
 * WorkspacePage
 * ├── AppHeader
 * ├── SideNav
 * └── DetailPane
 */

const ROUTES = [
  {
    id: 'overview',
    label: 'Overview',
    path: 'app.overview',
    body: 'Page shell only composes children. Each panel owns its DOM tree.',
  },
  {
    id: 'nav',
    label: 'Side nav',
    path: 'app.nav',
    body: 'Selection goes through shared state + refresh — parents do not scrape child DOM.',
  },
  {
    id: 'detail',
    label: 'Detail pane',
    path: 'app.detail',
    body: 'Actions stay in the child that draws them (onClick on Button props).',
  },
];

class AppHeader extends Component {
  static styles = new URL('./compose-demo.css', import.meta.url);

  constructor(deps = {}) {
    super(deps);
    this.store = deps.store;
  }

  render() {
    const selected = this.store.getSelected();
    this.ensureShell((ids) => ids.composeHeader, ({ header, h1, p }) => {
      header(
        { id: 'composeHeader', className: 'compose-header' },
        h1({ className: 'compose-header__brand', text: 'gd5 compose' }),
        p({
          id: 'composeHeaderMeta',
          className: 'compose-header__meta',
          text: selected ? `Selected · ${selected.label}` : 'Select a route',
        })
      );
    });
    const { composeHeaderMeta } = this.ids();
    if (composeHeaderMeta) {
      composeHeaderMeta.textContent = selected
        ? `Selected · ${selected.label}`
        : 'Select a route';
    }
  }
}

class SideNav extends Component {
  static styles = new URL('./compose-demo.css', import.meta.url);

  constructor(deps = {}) {
    super(deps);
    this.store = deps.store;
  }

  render() {
    const selectedId = this.store.selectedId;
    this.ensureShell((ids) => ids.composeNav, ({ aside, h2, div, button, map }) => {
      // `nav` is not in bind()'s short-tag list — use aside (or h('nav', …)).
      aside(
        { id: 'composeNav', className: 'compose-nav' },
        h2({ className: 'compose-nav__title', text: 'Routes' }),
        div(
          { className: 'compose-nav__list', id: 'composeNavList' },
          ...map(
            ROUTES,
            (route, _i, key) =>
              button({
                key,
                id: `composeNav-${route.id}`,
                type: 'button',
                className: 'compose-nav__item',
                text: route.label,
                onClick: () => this.store.select(route.id),
              }),
            (route) => route.id
          )
        )
      );
    });
    for (const route of ROUTES) {
      const btn = this.ids()[`composeNav-${route.id}`];
      if (!btn) continue;
      btn.classList.toggle('is-active', route.id === selectedId);
    }
  }
}

class DetailPane extends Component {
  static styles = new URL('./compose-demo.css', import.meta.url);

  constructor(deps = {}) {
    super(deps);
    this.store = deps.store;
  }

  render() {
    const selected = this.store.getSelected();
    this.ensureShell((ids) => ids.composeDetail, ({ section, h1, p, div }) => {
      section(
        { id: 'composeDetail', className: 'compose-detail' },
        h1({
          id: 'composeDetailTitle',
          className: 'compose-detail__title',
          text: selected?.label || 'Nothing selected',
        }),
        p({
          id: 'composeDetailPath',
          className: 'compose-detail__path',
          text: selected?.path || '—',
        }),
        p({
          id: 'composeDetailBody',
          className: 'compose-detail__body',
          text: selected?.body || 'Pick a route in the side nav.',
        }),
        div(
          { className: 'compose-detail__actions', id: 'composeDetailActions' },
          Button({
            type: 'primary',
            text: 'Primary action',
            onClick: () => this.store.ping('primary'),
          }),
          Button({
            type: 'default',
            text: 'Secondary',
            onClick: () => this.store.ping('secondary'),
          })
        )
      );
    });

    const { composeDetailTitle, composeDetailPath, composeDetailBody } = this.ids();
    if (composeDetailTitle) composeDetailTitle.textContent = selected?.label || 'Nothing selected';
    if (composeDetailPath) composeDetailPath.textContent = selected?.path || '—';
    if (composeDetailBody) {
      composeDetailBody.textContent = selected?.body || 'Pick a route in the side nav.';
    }
  }
}

/** Tiny shared state — stand-in for a real store. */
function createComposeStore() {
  let selectedId = ROUTES[0].id;
  let lastAction = '';
  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn());
  return {
    get selectedId() {
      return selectedId;
    },
    get lastAction() {
      return lastAction;
    },
    getSelected() {
      return ROUTES.find((r) => r.id === selectedId) || null;
    },
    select(id) {
      selectedId = id;
      emit();
    },
    ping(which) {
      lastAction = which;
      emit();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

class WorkspacePage extends Component {
  static styles = new URL('./compose-demo.css', import.meta.url);

  constructor(deps = {}) {
    super(deps);
    this.store = createComposeStore();
    this._unsub = null;
  }

  async componentDidMount() {
    await loadUi();
    this._unsub = this.store.subscribe(() => this.refreshChildren());
  }

  componentDidUnMount() {
    this._unsub?.();
    this._unsub = null;
  }

  refreshChildren() {
    for (const child of this._slotted || []) {
      child.refresh?.();
    }
  }

  render() {
    // Thin page: layout + children only. No imperative host clearing.
    this.ensureShell((ids) => ids.composeRoot, ({ div, h }) => {
      div(
        { id: 'composeRoot', className: 'compose-workspace' },
        h(AppHeader, { store: this.store }),
        div(
          { className: 'compose-workspace__body' },
          h(SideNav, { store: this.store }),
          h(DetailPane, { store: this.store })
        )
      );
    });
  }
}

startDemoApp({ home: WorkspacePage }, undefined, { demo: 'compose' });
