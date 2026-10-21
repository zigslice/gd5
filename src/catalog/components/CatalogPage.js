import { Component, D, bind } from '../../engine/index.js';
import {
  loadUi,
  Button,
  Empty,
  Input,
  SegmentedControl,
  Statistic,
  Tag,
  Text,
  Title,
  getJelly,
  getTheme,
  JellySwitch,
  setTheme,
  themes,
} from '../../ui/index.js';
import { el } from '../../ui/util.js';
import { CATALOG, countCatalog, filterCatalog } from '../entries.js';

const THEME_KEY = 'gd5-catalog-theme';
const KIND_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'product', label: '产品' },
  { value: 'example', label: '示例' },
];

function readLocationQuery() {
  if (typeof location === 'undefined') return { kind: 'all', query: '' };
  const params = new URLSearchParams(location.search);
  const kind = params.get('kind');
  return {
    kind: kind === 'product' || kind === 'example' ? kind : 'all',
    query: params.get('q') || '',
  };
}

function writeLocationQuery(kind, query) {
  if (typeof history === 'undefined' || typeof location === 'undefined') return;
  const params = new URLSearchParams();
  if (kind && kind !== 'all') params.set('kind', kind);
  if (query) params.set('q', query);
  const next = params.toString();
  const url = `${location.pathname}${next ? `?${next}` : ''}${location.hash || ''}`;
  history.replaceState(null, '', url);
}

function rememberTheme(name) {
  try {
    localStorage.setItem(THEME_KEY, name);
  } catch {
    /* private mode */
  }
}

/**
 * 站点首页。壳只建一次；筛选和搜索只重画结果区，避免输入框丢焦点。
 */
export class CatalogPage extends Component {
  static styles = new URL('./CatalogPage.css', import.meta.url);

  constructor(deps) {
    super(deps);
    const initial = readLocationQuery();
    this.state.data.kind = initial.kind;
    this.state.data.query = initial.query;
    this.state.data.theme = getTheme();
    this.state.data.jelly = getJelly();
    this.state.data.visible = CATALOG.length;
  }

  async componentDidMount() {
    await loadUi();
    this.logger?.i('CatalogPage mounted', {
      entries: CATALOG.length,
    });
  }

  setKind(kind) {
    if (this.state.data.kind === kind) return;
    this.state.data.kind = kind;
    writeLocationQuery(kind, this.state.data.query);
    this._paintFilter();
    this._paintResults();
  }

  setQuery(query, source) {
    this.state.data.query = query;
    writeLocationQuery(this.state.data.kind, query);
    if (source !== 'input') {
      const input = this._searchInput();
      if (input) input.value = query;
    }
    this._paintResults();
  }

  setThemeName(name) {
    const theme = setTheme(name);
    this.state.data.theme = theme;
    rememberTheme(theme);
    this._paintTheme();
  }

  clearFilters() {
    this.state.data.kind = 'all';
    this.state.data.query = '';
    writeLocationQuery('all', '');
    const input = this._searchInput();
    if (input) input.value = '';
    this._paintFilter();
    this._paintResults();
  }

  render() {
    const productCount = countCatalog(CATALOG, 'product');
    const exampleCount = countCatalog(CATALOG, 'example');

    this.ensureShell(
      (ids) => ids.root,
      ({ div, header, main, span, h }) => {
        div(
          { id: 'root', className: 'catalog' },
          header(
            { className: 'catalog-bar' },
            div(
              { className: 'catalog-brand' },
              span({ className: 'catalog-logo', text: 'g5', attrs: { 'aria-hidden': 'true' } }),
              div(
                { className: 'catalog-brand__text' },
                span({ className: 'catalog-brand__name', text: 'gd5 索引' }),
                span({ className: 'catalog-brand__sub', text: '产品与示例' })
              )
            ),
            div(
              { className: 'catalog-controls' },
              div(
                { className: 'catalog-theme' },
                Text({
                  as: 'span',
                  type: 'muted',
                  small: true,
                  text: '主题',
                  className: 'catalog-theme__label',
                }),
                div({ id: 'themeSlot' })
              ),
              div(
                { className: 'catalog-theme' },
                div({ id: 'jellySlot' }),
                Button({
                  type: 'primary',
                  size: 'sm',
                  text: '按一下',
                  attrs: { 'aria-label': '试试果冻按钮' },
                })
              )
            )
          ),
          main(
            { className: 'catalog-main' },
            div(
              { className: 'catalog-hero' },
              div(
                { className: 'catalog-hero__copy' },
                Title({ level: 1, text: '先选一个入口' }),
                Text({
                  className: 'catalog-lead',
                  text: '这里是索引，不会直接打开第一个产品。搜索或筛选之后，点卡片才进入子产品或示例页。',
                })
              ),
              div(
                { className: 'catalog-stats' },
                Statistic({ title: '产品', value: productCount, suffix: '个' }),
                Statistic({ title: '示例', value: exampleCount, suffix: '个' }),
                div(
                  { className: 'gd-statistic' },
                  div({ className: 'gd-statistic__title', text: '当前' }),
                  div(
                    { className: 'gd-statistic__content' },
                    span({
                      id: 'visibleCount',
                      className: 'gd-statistic__value',
                      text: String(CATALOG.length),
                    }),
                    span({ className: 'gd-statistic__suffix', text: '个' })
                  )
                )
              )
            ),
            div(
              { className: 'catalog-tools' },
              div(
                { id: 'searchWrap', className: 'gd-search catalog-search' },
                span({
                  className: 'gd-search__icon',
                  text: '⌕',
                  attrs: { 'aria-hidden': 'true' },
                }),
                Input({
                  id: 'searchInput',
                  type: 'text',
                  className: 'gd-search__input',
                  placeholder: '搜索名称、说明或路径',
                  value: this.state.data.query,
                  attrs: { 'aria-label': '搜索产品与示例', autocomplete: 'off' },
                  onInput: (event) => this.setQuery(event.target.value, 'input'),
                }),
                Button({
                  id: 'searchClear',
                  type: 'text',
                  size: 'sm',
                  text: '清除',
                  className: 'catalog-search__clear',
                  hidden: !this.state.data.query,
                  onClick: () => this.setQuery(''),
                })
              ),
              div({ id: 'filterSlot' })
            ),
            div({ id: 'results', className: 'catalog-results-host' })
          ),
          h('footer', {
            className: 'catalog-foot',
            text: '本页由 gd5 渲染：ComponentRender 页槽、UI 组件库、旁挂样式。点卡片才会离开。',
          })
        );
      }
    );

    this._paintTheme();
    this._paintJelly();
    this._paintFilter();
    this._paintResults();
  }

  _paintTheme() {
    const host = this.ids().themeSlot;
    if (!host) return;
    D.clear(host);
    const control = SegmentedControl({
      size: 'sm',
      value: this.state.data.theme,
      attrs: { 'aria-label': '切换主题' },
      options: Object.keys(themes).map((name) => ({
        value: name,
        label: name === 'orange' ? '橙' : name === 'blue' ? '蓝' : '绿',
      })),
      onChange: (name) => this.setThemeName(name),
    });
    host.appendChild(control.dom());
  }

  _paintJelly() {
    const host = this.ids().jellySlot;
    if (!host) return;
    D.clear(host);
    const control = JellySwitch({
      label: '果冻',
      onChange: (next) => {
        this.state.data.jelly = next;
        this._paintJelly();
      },
    });
    host.appendChild(control.dom());
  }

  _paintFilter() {
    const host = this.ids().filterSlot;
    if (!host) return;
    D.clear(host);
    const control = SegmentedControl({
      value: this.state.data.kind,
      attrs: { 'aria-label': '按类型筛选' },
      options: KIND_OPTIONS,
      onChange: (kind) => this.setKind(kind),
    });
    host.appendChild(control.dom());
  }

  _paintResults() {
    const host = this.ids().results;
    if (!host) return;
    D.clear(host);

    const { kind, query } = this.state.data;
    const items = filterCatalog(CATALOG, { kind, query });
    this.state.data.visible = items.length;
    this._syncMeta();

    if (!items.length) {
      host.appendChild(
        Empty({
          title: '没有匹配的入口',
          description: '换个关键词，或清除筛选后再看全部产品与示例。',
          extra: Button({
            type: 'default',
            text: '清除筛选',
            onClick: () => this.clearFilters(),
          }),
        }).dom()
      );
      return;
    }

    const sections = [
      ['product', '01', '产品', items.filter((entry) => entry.kind === 'product')],
      ['example', '02', '示例', items.filter((entry) => entry.kind === 'example')],
    ];
    const { div, span, get } = bind();

    div(
      { className: 'catalog-results', key: 'results-root' },
      ...sections.map(([id, index, label, list]) => {
        if (!list.length) return null;
        return div(
          { className: `catalog-section catalog-section--${id}`, key: id },
          div(
            { className: 'catalog-section__head' },
            span({ className: 'catalog-section__index', text: index }),
            Title({ level: 2, text: label, className: 'catalog-section__title' }),
            Text({
              as: 'span',
              type: 'muted',
              small: true,
              text: `${list.length} 个`,
              className: 'catalog-section__count',
            })
          ),
          div(
            { className: `catalog-grid catalog-grid--${id}` },
            ...list.map((entry, i) => this._card(entry, i + 1))
          )
        );
      })
    );

    const root = get()[1];
    if (root) host.appendChild(root);
  }

  _card(entry, index) {
    const kindLabel = entry.kind === 'product' ? '产品' : '示例';
    return el(
      'a',
      {
        className: `catalog-card catalog-card--${entry.kind}`,
        href: entry.href,
        key: entry.id,
      },
      el(
        'div',
        { className: 'catalog-card__top' },
        el('span', {
          className: 'catalog-card__index',
          text: String(index).padStart(2, '0'),
        }),
        Tag({
          color: entry.kind === 'product' ? 'primary' : 'default',
          text: kindLabel,
        })
      ),
      Title({ level: 3, text: entry.title, className: 'catalog-card__title' }),
      Text({
        as: 'span',
        type: 'secondary',
        small: true,
        text: entry.kicker,
        className: 'catalog-card__kicker',
      }),
      Text({ text: entry.summary, className: 'catalog-card__summary' }),
      el(
        'div',
        { className: 'catalog-card__tags' },
        ...entry.tags.map((tag) => Tag({ text: tag, key: tag }))
      ),
      el(
        'div',
        { className: 'catalog-card__foot' },
        el('span', { className: 'catalog-card__path', text: entry.href }),
        el('span', { className: 'catalog-card__go', text: '进入 →' })
      )
    );
  }

  _searchInput() {
    return this.ids().searchWrap?.querySelector('input') || null;
  }

  _syncMeta() {
    const count = this.ids().visibleCount;
    if (count) count.textContent = String(this.state.data.visible);
    const clear = this.ids().searchWrap?.querySelector('.catalog-search__clear');
    if (clear) clear.hidden = !this.state.data.query;
  }
}
