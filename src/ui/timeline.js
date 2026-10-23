import { cx, el, omit } from './util.js';

/** Active key for the tab that shows every event. Tag names use their own string. */
export const TIMELINE_ALL = 'all';

/** Tag tones, in the order used when a tag does not name a color. */
export const TIMELINE_TAG_COLORS = ['peach', 'blue', 'neutral', 'sage', 'sand', 'lilac'];

const TAG_COLOR_SET = new Set(TIMELINE_TAG_COLORS);

const TAGGED_PROP_KEYS = [
  'items',
  'className',
  'mode',
  'variant',
  'tags',
  'activeKey',
  'defaultActiveKey',
  'onChange',
  'allLabel',
  'showAll',
  'empty',
  'filterLabel',
];

/**
 * @param {object} [props]
 */
function isTaggedTimeline(props) {
  if (props.mode === 'classic' || props.variant === 'classic') return false;
  if (props.mode === 'tags' || props.variant === 'tags') return true;
  const items = Array.isArray(props.items) ? props.items : [];
  return items.some((item) => item && (item.tag != null || item.year != null || item.month != null));
}

/**
 * @param {string} [color]
 * @param {number} index
 */
function toneAt(color, index) {
  if (color && TAG_COLOR_SET.has(color)) return color;
  return TIMELINE_TAG_COLORS[index % TIMELINE_TAG_COLORS.length];
}

/**
 * Tabs are these names, in order. Each row's label is the same string.
 * Declared `tags` win; any other item tag is appended.
 * @param {Array<{tag?: string}>} items
 * @param {Array<string|{name?: string, key?: string, label?: string, color?: string}>} [tags]
 * @returns {Array<{name: string, color: string}>}
 */
export function resolveTimelineTags(items = [], tags) {
  /** @type {Array<{name: string, color: string}>} */
  const out = [];
  const seen = new Set();
  const push = (name, color) => {
    const label = String(name ?? '').trim();
    if (!label || seen.has(label)) return;
    seen.add(label);
    out.push({ name: label, color: toneAt(color, out.length) });
  };

  if (Array.isArray(tags)) {
    for (const tag of tags) {
      if (tag == null) continue;
      if (typeof tag === 'string' || typeof tag === 'number') push(tag);
      else push(tag.name ?? tag.key ?? tag.label, tag.color);
    }
  }

  for (const item of items) {
    if (item?.tag == null || item.tag === '') continue;
    push(item.tag, item.color);
  }
  return out;
}

/**
 * @param {string} tag
 * @param {string} [activeKey]
 */
export function timelineItemVisible(tag, activeKey) {
  if (activeKey == null || activeKey === '' || activeKey === TIMELINE_ALL) return true;
  return String(tag) === String(activeKey);
}

/**
 * Group events by year, keeping first-seen year order and item order.
 * @param {Array<{year?: string|number}>} items
 * @returns {Array<{year: string, items: object[]}>}
 */
export function groupTimelineItems(items = []) {
  /** @type {Array<{year: string, items: object[]}>} */
  const groups = [];
  const index = new Map();
  for (const item of items) {
    const year = item?.year == null ? '' : String(item.year);
    let at = index.get(year);
    if (at == null) {
      at = groups.length;
      index.set(year, at);
      groups.push({ year, items: [] });
    }
    groups[at].items.push(item);
  }
  return groups;
}

/**
 * @param {object} item
 */
function itemText(item) {
  if (item.text != null && item.text !== '') return String(item.text);
  if (item.description) {
    const title = item.title != null ? String(item.title) : '';
    return title ? `${title} ${item.description}` : String(item.description);
  }
  return item.title != null ? String(item.title) : '';
}

/**
 * Show or hide rows for `activeKey`. Tag tabs and the All tab share this path.
 * Safe to call again after a resize.
 * @param {HTMLElement} root
 * @param {string} activeKey
 */
export function paintTimelineFilter(root, activeKey) {
  if (!root) return;
  const key = activeKey == null || activeKey === '' ? TIMELINE_ALL : String(activeKey);
  root.dataset.active = key;

  const tabs = root.querySelectorAll('[data-tl-tab]');
  tabs.forEach((btn) => {
    const on = btn.getAttribute('data-tl-tab') === key;
    btn.classList.toggle('gd-timeline__tab--active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
    btn.tabIndex = on ? 0 : -1;
  });

  root.querySelectorAll('[data-tl-item]').forEach((row) => {
    row.hidden = !timelineItemVisible(row.getAttribute('data-tl-tag') || '', key);
  });

  root.querySelectorAll('[data-tl-year]').forEach((group) => {
    const any = [...group.querySelectorAll('[data-tl-item]')].some((row) => !row.hidden);
    group.hidden = !any;
  });

  const empty = root.querySelector('[data-tl-empty]');
  const anyItem = [...root.querySelectorAll('[data-tl-item]')].some((row) => !row.hidden);
  if (empty) empty.hidden = anyItem;

  layoutTimelineRail(root);
}

/**
 * Draw the rail from the first visible year mark to the last.
 * @param {HTMLElement} root
 */
export function layoutTimelineRail(root) {
  const track = root.querySelector?.('.gd-timeline__track');
  const line = root.querySelector?.('.gd-timeline__line');
  if (!track || !line) return;
  const marks = [
    ...track.querySelectorAll('.gd-timeline__year:not([hidden]) .gd-timeline__mark'),
  ];
  if (marks.length < 2 || typeof track.getBoundingClientRect !== 'function') {
    line.hidden = true;
    return;
  }
  const trackBox = track.getBoundingClientRect();
  if (!trackBox.height) {
    line.hidden = true;
    return;
  }
  const first = marks[0].getBoundingClientRect();
  const last = marks[marks.length - 1].getBoundingClientRect();
  const top = first.top + first.height / 2 - trackBox.top;
  const end = last.top + last.height / 2 - trackBox.top;
  const x = first.left + first.width / 2 - trackBox.left;
  line.hidden = false;
  line.style.top = `${top}px`;
  line.style.height = `${Math.max(0, end - top)}px`;
  line.style.left = `${x}px`;
}

/**
 * @param {HTMLElement} node
 */
function watchTimelineRail(node) {
  const run = () => layoutTimelineRail(node);
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
  else run();
  const fonts = typeof document !== 'undefined' ? document.fonts : null;
  if (fonts?.ready && typeof fonts.ready.then === 'function') {
    fonts.ready.then(run).catch(() => {});
  }
  if (typeof ResizeObserver === 'function') {
    const track = node.querySelector('.gd-timeline__track');
    if (track) {
      const observer = new ResizeObserver(run);
      observer.observe(track);
      node._gdTimelineRail = observer;
    }
  }
}

/**
 * @param {HTMLElement} node
 * @param {string} key
 */
function moveTimelineTab(node, key, delta) {
  const tabs = [...node.querySelectorAll('[data-tl-tab]')];
  const index = tabs.findIndex((tab) => tab.getAttribute('data-tl-tab') === key);
  if (index < 0 || !tabs.length) return null;
  if (delta === 'home') return tabs[0];
  if (delta === 'end') return tabs[tabs.length - 1];
  return tabs[(index + delta + tabs.length) % tabs.length];
}

/**
 * Tagged timeline: filter tabs, and a label on each row.
 * The label text is the tab name.
 * @param {object} props
 */
function taggedTimeline(props) {
  const {
    items: rawItems = [],
    className,
    tags,
    activeKey,
    defaultActiveKey,
    onChange,
    allLabel = 'All',
    showAll = true,
    empty = 'No events',
    filterLabel = 'Filter',
  } = props;

  const items = (Array.isArray(rawItems) ? rawItems : []).map((item, index) => ({
    key: item.key ?? item.id ?? `tl-${index}`,
    year: item.year == null ? '' : String(item.year),
    month: item.month == null ? '' : String(item.month),
    tag: item.tag == null ? '' : String(item.tag),
    text: itemText(item),
    color: item.color,
  }));

  const tagList = resolveTimelineTags(items, tags);
  const colorByTag = new Map(tagList.map((tag) => [tag.name, tag.color]));
  const controlled = activeKey != null && activeKey !== '';
  const initial = controlled ? String(activeKey) : String(defaultActiveKey || TIMELINE_ALL);

  /** @type {HTMLElement|null} */
  let node = null;

  const select = (key) => {
    if (typeof onChange === 'function') onChange(key);
    if (!controlled && node) paintTimelineFilter(node, key);
  };

  const onTabKeyDown = (key) => (event) => {
    let dest = null;
    if (event.key === 'ArrowRight') dest = moveTimelineTab(node, key, 1);
    else if (event.key === 'ArrowLeft') dest = moveTimelineTab(node, key, -1);
    else if (event.key === 'Home') dest = moveTimelineTab(node, key, 'home');
    else if (event.key === 'End') dest = moveTimelineTab(node, key, 'end');
    else return;
    event.preventDefault();
    if (!dest) return;
    dest.focus();
    select(dest.getAttribute('data-tl-tab'));
  };

  const tabButton = (key, label) => {
    const on = key === initial;
    return el('button', {
      type: 'button',
      className: cx('gd-timeline__tab', on && 'gd-timeline__tab--active'),
      text: label,
      attrs: {
        role: 'tab',
        'data-tl-tab': key,
        'aria-selected': on ? 'true' : 'false',
        tabindex: on ? '0' : '-1',
      },
      onClick: () => select(key),
      onKeyDown: onTabKeyDown(key),
    });
  };

  const tabs = [];
  if (showAll) tabs.push(tabButton(TIMELINE_ALL, String(allLabel)));
  for (const tag of tagList) tabs.push(tabButton(tag.name, tag.name));

  const groups = groupTimelineItems(items);
  const yearNodes = groups.map((group) => {
    const cards = group.items.map((item) => {
      const tone = colorByTag.get(item.tag) || 'neutral';
      const visible = timelineItemVisible(item.tag, initial);
      return el(
        'article',
        {
          className: 'gd-timeline__card',
          hidden: !visible,
          attrs: {
            'data-tl-item': item.key,
            'data-tl-tag': item.tag,
            role: 'listitem',
          },
        },
        el('span', { className: 'gd-timeline__month', text: item.month }),
        item.tag
          ? el('span', {
              className: cx('gd-timeline__badge', `gd-timeline__badge--${tone}`),
              text: item.tag,
            })
          : null,
        el('p', { className: 'gd-timeline__text', text: item.text })
      );
    });
    const anyVisible = cards.some((card) => !card.dom().hidden);
    return el(
      'section',
      {
        className: 'gd-timeline__year',
        hidden: !anyVisible,
        attrs: { 'data-tl-year': group.year },
      },
      el('span', { className: 'gd-timeline__mark', attrs: { 'aria-hidden': 'true' } }),
      group.year
        ? el('span', { className: 'gd-timeline__year-label', text: group.year })
        : el('span', { className: 'gd-timeline__year-label' }),
      ...cards
    );
  });

  const anyVisible = items.some((item) => timelineItemVisible(item.tag, initial));

  const root = el(
    'div',
    {
      ...omit(props, TAGGED_PROP_KEYS),
      className: cx('gd-timeline', 'gd-timeline--tags', className),
      attrs: { ...(props.attrs || {}), 'data-active': initial },
    },
    el(
      'div',
      {
        className: 'gd-timeline__filters',
        attrs: { role: 'tablist', 'aria-label': filterLabel, 'aria-orientation': 'horizontal' },
      },
      ...tabs
    ),
    el(
      'div',
      { className: 'gd-timeline__track', attrs: { role: 'list' } },
      el('span', {
        className: 'gd-timeline__line',
        hidden: true,
        attrs: { 'aria-hidden': 'true' },
      }),
      ...yearNodes
    ),
    el('p', {
      className: 'gd-timeline__empty',
      text: empty,
      hidden: anyVisible,
      attrs: { 'data-tl-empty': '1' },
    })
  );

  node = root.dom();
  watchTimelineRail(node);
  return root;
}

/**
 * Timeline.
 *
 * Classic rows (`time` / `title` / `description`):
 *
 * ```js
 * Timeline({
 *   items: [{ time: '09:12', title: 'Order placed', description: '3 items' }],
 * })
 * ```
 *
 * Tagged rows: the filter tabs are the tag names, and each row wears that same name.
 * `All` shows every row. Choosing a tag leaves only rows with that label.
 *
 * ```js
 * Timeline({
 *   tags: [
 *     { name: 'closed', color: 'peach' },
 *     { name: 'sold', color: 'blue' },
 *     { name: 'sued', color: 'neutral' },
 *   ],
 *   items: [
 *     { year: '2012', month: 'Aug', tag: 'closed', text: 'Twitter caps third-party apps.' },
 *   ],
 * })
 * ```
 *
 * Pass `activeKey` to control the filter. Omit it and the timeline updates itself.
 *
 * @param {object} [props]
 * @param {Array<object>} [props.items]
 * @param {'classic'|'tags'} [props.mode]
 * @param {Array<string|{name: string, color?: string}>} [props.tags]
 * @param {string} [props.activeKey]
 * @param {string} [props.defaultActiveKey]
 * @param {(key: string) => void} [props.onChange]
 * @param {string} [props.allLabel]
 * @param {boolean} [props.showAll]
 */
export function Timeline(props = {}) {
  if (isTaggedTimeline(props)) return taggedTimeline(props);
  return classicTimeline(props);
}

/**
 * Classic vertical timeline.
 * @param {object} [props]
 * @param {Array<{key?:string,time?:string,title:string,description?:string,color?:string}>} [props.items]
 */
function classicTimeline(props) {
  const { items = [], className } = props;
  return el(
    'div',
    {
      ...omit(props, ['items', 'className']),
      className: cx('gd-timeline', className),
    },
    ...items.map((item, i) =>
      el(
        'div',
        {
          className: cx('gd-timeline__item', item.color && `gd-timeline__item--${item.color}`),
          key: item.key || `tl-${i}`,
        },
        el('div', { className: 'gd-timeline__rail' }, el('span', { className: 'gd-timeline__dot' })),
        el(
          'div',
          { className: 'gd-timeline__body' },
          item.time
            ? el('div', { className: 'gd-timeline__time', text: item.time })
            : null,
          el('div', { className: 'gd-timeline__title', text: item.title }),
          item.description
            ? el('div', { className: 'gd-timeline__desc', text: item.description })
            : null
        )
      )
    )
  );
}
