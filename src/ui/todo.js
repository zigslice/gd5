import { cx, el, omit } from './util.js';

/**
 * @typedef {'pending'|'active'|'done'} TodoStatus
 * @typedef {{
 *   key?: string|number,
 *   text?: string,
 *   title?: string,
 *   status?: TodoStatus|'in_progress'|'completed'|'todo',
 *   disabled?: boolean,
 * }} TodoItemInput
 */

/**
 * Normalize status aliases.
 * @param {string} [status]
 * @returns {TodoStatus}
 */
export function normalizeTodoStatus(status) {
  const s = String(status || 'pending').toLowerCase();
  if (s === 'active' || s === 'in_progress' || s === 'current' || s === 'running') return 'active';
  if (s === 'done' || s === 'completed' || s === 'complete' || s === 'finished') return 'done';
  return 'pending';
}

/**
 * @param {TodoItemInput[]|string[]} items
 * @returns {Array<{key:string,text:string,status:TodoStatus,disabled:boolean,raw:any}>}
 */
export function normalizeTodoItems(items = []) {
  return (items || []).map((item, i) => {
    if (item == null || typeof item === 'string' || typeof item === 'number') {
      return {
        key: `todo-${i}`,
        text: String(item ?? ''),
        status: 'pending',
        disabled: false,
        raw: item,
      };
    }
    return {
      key: String(item.key ?? item.id ?? `todo-${i}`),
      text: String(item.text ?? item.title ?? item.label ?? ''),
      status: normalizeTodoStatus(item.status),
      disabled: !!item.disabled,
      raw: item,
    };
  });
}

/**
 * Count done / total for header badge.
 * @param {Array<{status:TodoStatus}>} items
 */
export function countTodoProgress(items = []) {
  const total = items.length;
  const done = items.filter((it) => it.status === 'done').length;
  return { done, total };
}

function statusIcon(status) {
  if (status === 'active') {
    return el(
      'span',
      {
        className: 'gd-todo__icon gd-todo__icon--active',
        attrs: { 'aria-hidden': 'true' },
      },
      el('span', { className: 'gd-todo__arrow' })
    );
  }
  if (status === 'done') {
    return el(
      'span',
      {
        className: 'gd-todo__icon gd-todo__icon--done',
        attrs: { 'aria-hidden': 'true' },
      },
      el('span', { className: 'gd-todo__check' })
    );
  }
  return el('span', {
    className: 'gd-todo__icon gd-todo__icon--pending',
    attrs: { 'aria-hidden': 'true' },
  });
}

/**
 * TodoList — card checklist matching Cursor-style to-dos.
 *
 * Statuses:
 * - `pending`  dashed circle, muted text
 * - `active`   filled circle + arrow (current)
 * - `done`     filled check (counts toward n/total)
 *
 * @param {object} [props]
 * @param {string} [props.title]
 * @param {TodoItemInput[]|string[]} [props.items]
 * @param {boolean} [props.showProgress]
 * @param {(item:object, index:number)=>void} [props.onItemClick]
 * @param {string} [props.className]
 */
export function TodoList(props = {}) {
  const {
    title = 'To-dos',
    items: rawItems = [],
    showProgress = true,
    onItemClick,
    className,
  } = props;

  const items = normalizeTodoItems(rawItems);
  const { done, total } = countTodoProgress(items);

  return el(
    'div',
    {
      ...omit(props, ['title', 'items', 'showProgress', 'onItemClick', 'className']),
      className: cx('gd-todo', className),
      attrs: {
        role: 'list',
        'aria-label': title,
      },
    },
    el(
      'div',
      { className: 'gd-todo__header' },
      el('span', { className: 'gd-todo__title', text: title }),
      showProgress
        ? el('span', {
            className: 'gd-todo__progress',
            text: `${done}/${total}`,
            attrs: { 'aria-label': `${done} of ${total} completed` },
          })
        : null
    ),
    el(
      'ul',
      { className: 'gd-todo__list' },
      ...items.map((item, index) => {
        const interactive = typeof onItemClick === 'function' && !item.disabled;
        const body = [
          statusIcon(item.status),
          el('span', { className: 'gd-todo__text', text: item.text }),
        ];
        return el(
          'li',
          {
            key: item.key,
            className: cx(
              'gd-todo__item',
              `gd-todo__item--${item.status}`,
              item.disabled && 'gd-todo__item--disabled'
            ),
            attrs: {
              role: 'listitem',
              'data-status': item.status,
              'aria-current': item.status === 'active' ? 'step' : undefined,
            },
          },
          interactive
            ? el(
                'button',
                {
                  type: 'button',
                  className: 'gd-todo__row gd-todo__row--interactive',
                  onClick: (e) => {
                    e.preventDefault();
                    onItemClick(item, index);
                  },
                },
                ...body
              )
            : el('div', { className: 'gd-todo__row' }, ...body)
        );
      })
    )
  );
}

/** Alias */
export const Todos = TodoList;
export const Todo = TodoList;

/**
 * Cycle pending → active → done → pending (handy for demos).
 * @param {TodoStatus} status
 * @returns {TodoStatus}
 */
export function nextTodoStatus(status) {
  const s = normalizeTodoStatus(status);
  if (s === 'pending') return 'active';
  if (s === 'active') return 'done';
  return 'pending';
}
