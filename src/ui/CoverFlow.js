import { Component } from '../engine/index.js';
import { cx, el, loadUi } from './util.js';

/**
 * Normalize items to a stable shape.
 * @param {Array<string|object>} items
 * @returns {Array<{key:string,title:string,subtitle?:string,image?:string,color?:string,content?:any,raw:any}>}
 */
export function normalizeCoverFlowItems(items = []) {
  return (items || []).map((item, i) => {
    if (item == null || typeof item === 'string' || typeof item === 'number') {
      const title = String(item ?? '');
      return { key: `item-${i}`, title, raw: item };
    }
    const key = String(item.key ?? item.id ?? `item-${i}`);
    return {
      key,
      title: String(item.title ?? item.label ?? item.name ?? key),
      subtitle: item.subtitle != null ? String(item.subtitle) : item.desc != null ? String(item.desc) : undefined,
      image: item.image || item.src || undefined,
      color: item.color || undefined,
      content: item.content,
      raw: item,
    };
  });
}

/**
 * CoverFlow — Apple Cover Flow / game character-select style carousel.
 * Center card faces forward; neighbors tilt & stack in perspective.
 *
 * Also known as: Cover Flow, coverflow carousel, 3D card carousel.
 *
 * @param {object} [deps]
 * @param {Array} [deps.items]
 * @param {number} [deps.index]
 * @param {number} [deps.defaultIndex]
 * @param {boolean} [deps.loop]
 * @param {number} [deps.sideCount] cards visible each side (default 2)
 * @param {number} [deps.height]
 * @param {(index:number,item:object)=>void} [deps.onChange]
 * @param {(index:number,item:object)=>void} [deps.onSelect]
 */
export class CoverFlow extends Component {
  constructor(deps = {}) {
    super(deps);
    const items = normalizeCoverFlowItems(deps.items);
    const initial =
      Number.isFinite(deps.index) ? deps.index : Number.isFinite(deps.defaultIndex) ? deps.defaultIndex : 0;
    this.state.data.items = items;
    this.state.data.index = clampIndex(initial, items.length);
    this.state.data.loop = deps.loop !== false;
    this.state.data.sideCount = Math.max(1, Math.min(4, deps.sideCount ?? 2));
    this.state.data.height = deps.height ?? 320;
    this._onChange = deps.onChange || null;
    this._onSelect = deps.onSelect || null;
    this._drag = null;
  }

  async mount(host, params = {}) {
    await loadUi();
    return super.mount(host, params);
  }

  setItems(items) {
    const next = normalizeCoverFlowItems(items);
    this.setData(
      {
        items: next,
        index: clampIndex(this.state.data.index, next.length),
      },
      { refresh: !!this._mounted }
    );
    return this;
  }

  getIndex() {
    return this.state.data.index;
  }

  getActiveItem() {
    const { items, index } = this.state.data;
    return items[index] || null;
  }

  setIndex(index, { emit = true } = {}) {
    const { items, loop } = this.state.data;
    if (!items.length) return this;
    const next = loop ? wrapIndex(index, items.length) : clampIndex(index, items.length);
    if (next === this.state.data.index) return this;
    this.setData({ index: next }, { refresh: !!this._mounted });
    if (emit) this._onChange?.(next, items[next]);
    return this;
  }

  next() {
    return this.setIndex(this.state.data.index + 1);
  }

  prev() {
    return this.setIndex(this.state.data.index - 1);
  }

  componentDidAttachEvents() {
    const stage = this.ids().gdCfStage;
    if (!stage) return;

    this.on(stage, 'pointerdown', (e) => {
      if (e.button != null && e.button !== 0) return;
      this._drag = { x0: e.clientX, moved: false };
      stage.setPointerCapture?.(e.pointerId);
    });
    this.on(stage, 'pointermove', (e) => {
      if (!this._drag) return;
      if (Math.abs(e.clientX - this._drag.x0) > 8) this._drag.moved = true;
    });
    this.on(stage, 'pointerup', (e) => {
      if (!this._drag) return;
      const dx = e.clientX - this._drag.x0;
      const moved = this._drag.moved;
      this._drag = null;
      try {
        stage.releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
      if (!moved) return;
      this._suppressClick = true;
      setTimeout(() => {
        this._suppressClick = false;
      }, 0);
      if (dx < -40) this.next();
      else if (dx > 40) this.prev();
    });
    this.on(stage, 'pointercancel', () => {
      this._drag = null;
    });

    this.on(stage, 'keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const item = this.getActiveItem();
        if (item) this._onSelect?.(this.state.data.index, item);
      }
    });
  }

  _cardStyle(offset, sideCount) {
    const abs = Math.abs(offset);
    if (abs > sideCount) {
      return {
        opacity: '0',
        pointerEvents: 'none',
        transform: `translate(-50%, -50%) translateX(${offset * 72}px) translateZ(-220px) rotateY(${offset < 0 ? 55 : -55}deg) scale(0.72)`,
        zIndex: String(0),
      };
    }
    const x = offset * 78;
    const rot = offset === 0 ? 0 : offset < 0 ? 42 : -42;
    const z = -Math.abs(offset) * 70;
    const scale = offset === 0 ? 1 : Math.max(0.78, 1 - abs * 0.1);
    const opacity = offset === 0 ? 1 : Math.max(0.45, 1 - abs * 0.22);
    return {
      opacity: String(opacity),
      transform: `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) rotateY(${rot}deg) scale(${scale})`,
      zIndex: String(100 - abs),
      pointerEvents: 'auto',
    };
  }

  _renderCard(item, offset, index) {
    const { sideCount } = this.state.data;
    const style = this._cardStyle(offset, sideCount);
    const active = offset === 0;
    const kids = [];

    if (item.image) {
      kids.push(
        el('img', {
          className: 'gd-coverflow__img',
          attrs: { src: item.image, alt: item.title, draggable: 'false' },
        })
      );
    } else {
      kids.push(
        el('div', {
          className: 'gd-coverflow__art',
          style: item.color ? { background: item.color } : undefined,
          text: item.title.slice(0, 1).toUpperCase(),
        })
      );
    }

    kids.push(
      el(
        'div',
        { className: 'gd-coverflow__meta' },
        el('div', { className: 'gd-coverflow__title', text: item.title }),
        item.subtitle
          ? el('div', { className: 'gd-coverflow__subtitle', text: item.subtitle })
          : null
      )
    );

    if (item.content) kids.push(item.content);

    return el(
      'button',
      {
        type: 'button',
        className: cx('gd-coverflow__card', active && 'gd-coverflow__card--active'),
        style,
        attrs: {
          'data-offset': String(offset),
          'data-index': String(index),
          'aria-current': active ? 'true' : 'false',
          tabindex: active ? '0' : '-1',
        },
        onClick: (e) => {
          e.preventDefault();
          if (this._suppressClick || this._drag?.moved) return;
          if (offset === 0) {
            this._onSelect?.(index, item);
            return;
          }
          this.setIndex(index);
        },
      },
      ...kids
    );
  }

  render() {
    const { items, index, height, loop } = this.state.data;
    const count = items.length;

    this.ensureShell(
      (ids) => ids.gdCfRoot,
      ({ div, button }) => {
        div(
          {
            id: 'gdCfRoot',
            className: 'gd-coverflow',
            attrs: { role: 'group', 'aria-roledescription': 'coverflow carousel' },
          },
          div({
            id: 'gdCfStage',
            className: 'gd-coverflow__stage',
            attrs: { tabindex: '0', 'aria-label': 'Cover Flow' },
          }),
          div(
            { id: 'gdCfControls', className: 'gd-coverflow__controls' },
            button({
              type: 'button',
              id: 'gdCfPrev',
              className: 'gd-btn gd-btn--default gd-btn--sm gd-coverflow__arrow',
              text: '‹',
              attrs: { 'aria-label': 'Previous' },
              onClick: () => this.prev(),
            }),
            div({ id: 'gdCfCaption', className: 'gd-coverflow__caption' }),
            button({
              type: 'button',
              id: 'gdCfNext',
              className: 'gd-btn gd-btn--default gd-btn--sm gd-coverflow__arrow',
              text: '›',
              attrs: { 'aria-label': 'Next' },
              onClick: () => this.next(),
            })
          ),
          div({ id: 'gdCfDots', className: 'gd-coverflow__dots' })
        );
        void button;
      }
    );

    const root = this.ids().gdCfRoot;
    const stage = this.ids().gdCfStage;
    const caption = this.ids().gdCfCaption;
    const dots = this.ids().gdCfDots;
    const prev = this.ids().gdCfPrev;
    const next = this.ids().gdCfNext;

    if (root) root.style.setProperty('--gd-coverflow-h', typeof height === 'number' ? `${height}px` : String(height));
    if (stage) {
      stage.style.height = typeof height === 'number' ? `${height}px` : String(height);
      stage.textContent = '';
      if (!count) {
        stage.appendChild(
          el('div', { className: 'gd-coverflow__empty', text: 'No cards' }).dom()
        );
      } else {
        for (let i = 0; i < count; i++) {
          const offset = i - index;
          stage.appendChild(this._renderCard(items[i], offset, i).dom());
        }
      }
    }

    const active = items[index];
    if (caption) {
      caption.textContent = '';
      if (active) {
        caption.appendChild(el('div', { className: 'gd-coverflow__caption-title', text: active.title }).dom());
        if (active.subtitle) {
          caption.appendChild(
            el('div', { className: 'gd-coverflow__caption-sub', text: active.subtitle }).dom()
          );
        }
      }
    }

    if (dots) {
      dots.textContent = '';
      for (let i = 0; i < count; i++) {
        dots.appendChild(
          el('button', {
            type: 'button',
            className: cx('gd-coverflow__dot', i === index && 'gd-coverflow__dot--active'),
            attrs: { 'aria-label': `Go to ${items[i].title}`, 'aria-current': i === index ? 'true' : 'false' },
            onClick: () => this.setIndex(i),
          }).dom()
        );
      }
    }

    if (prev) prev.disabled = !loop && index <= 0;
    if (next) next.disabled = !loop && index >= count - 1;
  }
}

function clampIndex(i, len) {
  if (!len) return 0;
  return Math.max(0, Math.min(len - 1, Number(i) || 0));
}

function wrapIndex(i, len) {
  if (!len) return 0;
  return ((Number(i) % len) + len) % len;
}

/**
 * @param {Array} items
 * @param {HTMLElement|string} host
 * @param {object} [options]
 */
export function createCoverFlow(items, host, options = {}) {
  const cf = new CoverFlow({ ...options, items });
  const elHost =
    typeof host === 'string'
      ? typeof document !== 'undefined'
        ? document.getElementById(host)
        : null
      : host;
  if (elHost) void cf.mount(elHost);
  return cf;
}

/** Alias names people search for */
export const Coverflow = CoverFlow;
export const CoverflowCarousel = CoverFlow;
