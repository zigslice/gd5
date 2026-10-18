import { Component } from '../../../engine/index.js';
import { DiffBlock, TodoList, loadUi } from '../../../ui/index.js';

/**
 * Bottom utility panel — Todos · Terminal · Diff.
 */
export class AgentSideComponent extends Component {
  static styles = new URL('./AgentSideComponent.css', import.meta.url);

  constructor(deps = {}) {
    super(deps);
    this.store = deps.store;
  }

  async mount(host, params = {}) {
    await loadUi();
    return super.mount(host, params);
  }

  render() {
    const snap = this.store?.getState?.() || {};
    const tab = snap.sideTab || 'todos';
    const store = this.store;

    this.ensureShell(
      (ids) => ids.agentSide,
      ({ div }) => {
        div(
          { id: 'agentSide', className: 'agent-side' },
          div({ id: 'agentSideTabs', className: 'agent-side__tabs' }),
          div({ id: 'agentSideBody', className: 'agent-side__body' })
        );
      }
    );

    const tabs = this.ids().agentSideTabs;
    const body = this.ids().agentSideBody;
    if (!tabs || !body) return;

    tabs.textContent = '';
    for (const [key, label] of [
      ['todos', 'To-dos'],
      ['terminal', 'Terminal'],
      ['diff', 'Diff'],
    ]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className =
        'agent-side__tab' + (tab === key ? ' agent-side__tab--active' : '');
      b.textContent = label;
      b.addEventListener('click', () => store.setSideTab(key));
      tabs.appendChild(b);
    }

    body.textContent = '';
    if (tab === 'todos') {
      const list = TodoList({
        title: 'Agent to-dos',
        items: snap.todos || [],
        onItemClick(item, index) {
          const cycle = { pending: 'active', active: 'done', done: 'pending' };
          const cur = store.getState().todos || [];
          store.setTodos(
            cur.map((t, i) =>
              i === index ? { ...t, status: cycle[t.status] || 'pending' } : t
            )
          );
        },
      });
      body.appendChild(list.dom());
    } else if (tab === 'terminal') {
      const pre = document.createElement('pre');
      pre.className = 'agent-side__terminal';
      pre.textContent = (snap.terminal || []).join('\n');
      body.appendChild(pre);
    } else if (!snap.diff?.unified) {
      const empty = document.createElement('div');
      empty.className = 'agent-side__empty';
      empty.textContent = 'No diff yet — run an agent task';
      body.appendChild(empty);
    } else {
      const head = document.createElement('div');
      head.className = 'agent-side__diff-path';
      head.textContent = snap.diff.path;
      body.appendChild(head);
      const diff = DiffBlock({
        language: snap.diff.language || 'javascript',
        diff: snap.diff.unified,
        showCopy: true,
      });
      body.appendChild(diff.dom());
    }
  }
}
